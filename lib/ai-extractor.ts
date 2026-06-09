import type { PlanExtraction, ServiceCategory } from "@/lib/types";

/**
 * AI-powered plan extraction via OpenAI tool-calling.
 *
 * The model is forced to call a single `submit_plan` tool whose JSON schema
 * mirrors {@link PlanExtraction}. This guarantees a structured, parseable
 * result instead of free-form prose. When the call fails for a *recoverable*
 * reason — the AI service is unreachable, rate/quota limited, or the context
 * exceeds the token budget — we throw an {@link AiExtractionError} flagged as
 * `recoverable` so the caller (`app/api/plan/route.ts`) can transparently fall
 * back to the regex NLP extractor (`lib/nlp-extractor.ts`).
 */

const SERVICE_CATEGORIES: ServiceCategory[] = [
  "catering",
  "photography",
  "videography",
  "decoration",
  "dj_entertainment",
  "makeup",
  "planning",
  "photobooth",
  "ice_cream",
  "florist",
  "cake",
  "transport",
  "emcee",
  "live_band",
  "lighting",
  "bridal",
  "henna",
];

/** Reason buckets so the route can decide whether falling back is appropriate. */
export type AiFailureReason =
  | "not_configured" // OPENAI_API_KEY missing
  | "insufficient_tokens" // context too large / quota / rate limit
  | "unavailable" // network error, 5xx, timeout
  | "invalid_response" // 2xx but no/garbled tool call
  | "unknown";

export class AiExtractionError extends Error {
  readonly reason: AiFailureReason;
  /** When true, the caller should silently fall back to NLP. */
  readonly recoverable: boolean;

  constructor(reason: AiFailureReason, message: string, recoverable: boolean) {
    super(message);
    this.name = "AiExtractionError";
    this.reason = reason;
    this.recoverable = recoverable;
  }
}

const TOOL_DEFINITION = {
  type: "function" as const,
  function: {
    name: "submit_plan",
    description:
      "Submit the structured event-planning requirements extracted from the user's prompt.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        eventType: {
          type: ["string", "null"],
          description:
            "Canonical event type, e.g. Wedding, Corporate, Birthday, Launch, Seminar, Private Party. Null if unknown.",
        },
        guestCount: {
          type: ["object", "null"],
          additionalProperties: false,
          properties: {
            min: { type: "number" },
            max: {
              type: "number",
              description: "0 when no explicit upper bound was given.",
            },
          },
          required: ["min", "max"],
        },
        location: {
          type: ["string", "null"],
          description: "Normalised location string, e.g. 'Kuala Lumpur, Malaysia'. Null if unknown.",
        },
        budget: {
          type: ["object", "null"],
          additionalProperties: false,
          properties: {
            amount: { type: "number" },
            currency: {
              type: "string",
              description: "Currency symbol/code such as RM, S$, THB, IDR.",
            },
          },
          required: ["amount", "currency"],
        },
        halalRequired: { type: "boolean" },
        services: {
          type: "array",
          items: { type: "string", enum: SERVICE_CATEGORIES },
          description: "Service categories explicitly or implicitly requested.",
        },
        amenities: {
          type: "array",
          items: { type: "string" },
          description: "Venue amenities mentioned, e.g. WiFi, AV System, Free Parking, Stage.",
        },
        preferredDate: {
          type: ["string", "null"],
          description: "ISO date (YYYY-MM-DD) if a specific date was given, else null.",
        },
        specialNotes: {
          type: "string",
          description: "Any remaining requirements that don't fit other fields. Empty string if none.",
        },
      },
      required: [
        "eventType",
        "guestCount",
        "location",
        "budget",
        "halalRequired",
        "services",
        "amenities",
        "preferredDate",
        "specialNotes",
      ],
    },
  },
};

const SYSTEM_PROMPT = [
  "You are an event-planning requirements extractor for a Southeast-Asian venue",
  "marketplace (Malaysia, Singapore, Thailand, Indonesia).",
  "Read the user's free-text event brief and call the `submit_plan` tool with the",
  "structured requirements. Only include values the user actually stated or that are",
  "strongly implied. Use null / empty arrays for anything unspecified — never invent",
  "guest counts, budgets, or locations. Normalise locations to 'City, Country' form",
  "and budgets to a numeric amount plus a currency symbol.",
].join(" ");

type ToolArgs = {
  eventType: string | null;
  guestCount: { min: number; max: number } | null;
  location: string | null;
  budget: { amount: number; currency: string } | null;
  halalRequired: boolean;
  services: string[];
  amenities: string[];
  preferredDate: string | null;
  specialNotes: string;
};

function clampConfidence(present: boolean): number {
  // The model returns structured fields rather than per-field probabilities, so
  // we assign a high-but-not-certain confidence to fields it populated. This keeps
  // the downstream confidence UI meaningful while signalling LLM provenance.
  return present ? 0.95 : 0;
}

function normalizeToExtraction(args: ToolArgs): PlanExtraction {
  const validServices = (args.services ?? []).filter((s): s is ServiceCategory =>
    (SERVICE_CATEGORIES as string[]).includes(s)
  );

  const guestCount =
    args.guestCount && Number.isFinite(args.guestCount.min)
      ? { min: args.guestCount.min, max: args.guestCount.max ?? 0 }
      : null;

  const budget =
    args.budget && Number.isFinite(args.budget.amount)
      ? { amount: args.budget.amount, currency: args.budget.currency || "RM" }
      : null;

  const confidence = {
    eventType: clampConfidence(Boolean(args.eventType)),
    guestCount: clampConfidence(Boolean(guestCount)),
    location: clampConfidence(Boolean(args.location)),
    budget: clampConfidence(Boolean(budget)),
    overall: 0,
  };
  const populated = Object.values(confidence).filter((v) => v > 0);
  confidence.overall =
    populated.length > 0 ? populated.reduce((a, b) => a + b, 0) / populated.length : 0;

  return {
    eventType: args.eventType ?? null,
    guestCount,
    location: args.location ?? null,
    budget,
    halalRequired: Boolean(args.halalRequired),
    services: validServices,
    amenities: Array.isArray(args.amenities) ? args.amenities : [],
    preferredDate: args.preferredDate ?? null,
    duration: null,
    specialNotes: typeof args.specialNotes === "string" ? args.specialNotes : "",
    confidence,
    source: "llm",
  };
}

/** Map an OpenAI HTTP error status to a recoverable/non-recoverable failure. */
function classifyHttpError(status: number, detail: string): AiExtractionError {
  // 429 = rate limit or quota exhaustion; 413 = payload too large.
  if (status === 429 || status === 413) {
    return new AiExtractionError(
      "insufficient_tokens",
      `OpenAI rate/quota/size limit (HTTP ${status}): ${detail}`,
      true
    );
  }
  // Context-length errors arrive as 400 with a recognizable code/message.
  if (status === 400 && /context_length|maximum context|too many tokens/i.test(detail)) {
    return new AiExtractionError(
      "insufficient_tokens",
      `OpenAI context-length exceeded: ${detail}`,
      true
    );
  }
  // 401/403 are config/auth issues — recoverable in the sense that NLP should
  // still serve the user, but they signal a setup problem worth surfacing.
  if (status === 401 || status === 403) {
    return new AiExtractionError(
      "not_configured",
      `OpenAI auth failed (HTTP ${status}): ${detail}`,
      true
    );
  }
  // 5xx and anything else: service problem -> recoverable via NLP.
  return new AiExtractionError(
    "unavailable",
    `OpenAI request failed (HTTP ${status}): ${detail}`,
    true
  );
}

/**
 * Extract structured plan requirements using OpenAI tool-calling.
 *
 * @throws {AiExtractionError} On any failure. Inspect `.recoverable` to decide
 *         whether to fall back to the regex NLP extractor.
 */
export async function extractPlanWithAi(
  prompt: string,
  options: { signal?: AbortSignal } = {}
): Promise<PlanExtraction> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AiExtractionError(
      "not_configured",
      "OPENAI_API_KEY is not set; skipping AI extraction.",
      true
    );
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  // Guard against unbounded prompts before they hit the API. Trimming here is a
  // cheap pre-emptive defence against the very token-overflow case we fall back on.
  const safePrompt = prompt.length > 4000 ? `${prompt.slice(0, 4000)}…` : prompt;

  // Caller may pass its own signal; we also enforce a hard timeout so a hung
  // connection surfaces as `unavailable` rather than blocking the request.
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), 15_000);
  const signal = options.signal ?? timeout.signal;

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: safePrompt },
        ],
        tools: [TOOL_DEFINITION],
        tool_choice: { type: "function", function: { name: "submit_plan" } },
      }),
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new AiExtractionError(
      "unavailable",
      aborted ? "OpenAI request timed out." : `Network error reaching OpenAI: ${String(err)}`,
      true
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw classifyHttpError(res.status, detail.slice(0, 300));
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw new AiExtractionError("invalid_response", "OpenAI returned non-JSON body.", true);
  }

  const toolCall = (payload as {
    choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
  })?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;

  if (!toolCall) {
    throw new AiExtractionError(
      "invalid_response",
      "OpenAI response did not include a submit_plan tool call.",
      true
    );
  }

  let args: ToolArgs;
  try {
    args = JSON.parse(toolCall) as ToolArgs;
  } catch {
    throw new AiExtractionError(
      "invalid_response",
      "Failed to parse submit_plan tool arguments as JSON.",
      true
    );
  }

  return normalizeToExtraction(args);
}
