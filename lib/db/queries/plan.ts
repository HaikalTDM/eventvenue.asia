import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";

/**
 * Plan query module. Reads and writes the AI-driven event-planning tables
 * — `plan_sessions` (one per user prompt) and `plan_recommendations`
 * (the listings the model suggested for each session). Sessions belong
 * to a single customer; reads enforce that ownership inline so handlers
 * don't need a separate check.
 *
 * Why this exists:
 *   - `getPlanSession` returns null unless the supplied customerId owns
 *     the session — handlers can use it as a one-call auth guard.
 *   - `addRecommendations` accepts a bulk insert payload because the
 *     model produces 5–20 recs per session and round-tripping each one
 *     would balloon latency.
 *   - `listRecommendations` joins the listing fields the UI actually
 *     renders (title/slug/location/price/rating) so the recommendation
 *     card has everything it needs in a single query.
 *
 * Pure data-access: authorization for read paths is folded into the
 * WHERE clause; write paths assume the handler has already verified the
 * actor is the session's customer or an admin.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlanStatus = "processing" | "completed" | "failed";
export type RecommendationType = "venue" | "service";

export type PlanSessionRow = typeof schema.planSessions.$inferSelect;
export type PlanRecommendationRow = typeof schema.planRecommendations.$inferSelect;

export type CreatePlanSessionInput = {
  customerId: string;
  rawPrompt: string;
  parsedParams?: Record<string, unknown> | null;
};

export type AddRecommendationInput = {
  listingId: string;
  matchScore: number;
  matchReason?: string | null;
  estimatedCost?: number | string | null;
  recommendationType: RecommendationType;
};

export type RecommendationWithListing = PlanRecommendationRow & {
  listing: {
    id: string;
    title: string;
    slug: string;
    location: string | null;
    pricePerHour: string | null;
    averageRating: string;
    isMock: boolean;
  };
};

// ─── Read queries ───────────────────────────────────────────────────────────

/**
 * Loads a plan session by id, but only if it belongs to the supplied
 * customer. Returns null otherwise — handlers should map that to a 404
 * (not 403) so we don't leak the existence of other customers' sessions.
 */
export async function getPlanSession(
  id: string,
  customerId: string
): Promise<PlanSessionRow | null> {
  const [row] = await db
    .select()
    .from(schema.planSessions)
    .where(
      and(
        eq(schema.planSessions.id, id),
        eq(schema.planSessions.customerId, customerId)
      )
    )
    .limit(1);
  return row ?? null;
}

/**
 * Lists every recommendation for a session, joined with the parent
 * listing's display fields. Mock-flag is intentionally surfaced here
 * (`listing.isMock`) so the UI can badge synthetic seed listings if
 * they slip into a result set during development. Ordered by descending
 * match score so the strongest suggestion renders first.
 */
export async function listRecommendations(
  sessionId: string
): Promise<RecommendationWithListing[]> {
  return db
    .select({
      id: schema.planRecommendations.id,
      sessionId: schema.planRecommendations.sessionId,
      listingId: schema.planRecommendations.listingId,
      matchScore: schema.planRecommendations.matchScore,
      matchReason: schema.planRecommendations.matchReason,
      estimatedCost: schema.planRecommendations.estimatedCost,
      recommendationType: schema.planRecommendations.recommendationType,
      createdAt: schema.planRecommendations.createdAt,
      listing: {
        id: schema.listings.id,
        title: schema.listings.title,
        slug: schema.listings.slug,
        location: schema.listings.location,
        pricePerHour: schema.listings.pricePerHour,
        averageRating: schema.listings.averageRating,
        isMock: schema.listings.isMock,
      },
    })
    .from(schema.planRecommendations)
    .innerJoin(
      schema.listings,
      eq(schema.planRecommendations.listingId, schema.listings.id)
    )
    .where(eq(schema.planRecommendations.sessionId, sessionId))
    .orderBy(desc(schema.planRecommendations.matchScore));
}

// ─── Write queries ──────────────────────────────────────────────────────────

/**
 * Inserts a new plan session in the "processing" state. The model worker
 * is expected to flip the status via `markSessionStatus` once it's done
 * (or has failed). Returns the persisted row.
 */
export async function createPlanSession(
  input: CreatePlanSessionInput
): Promise<PlanSessionRow> {
  const [row] = await db
    .insert(schema.planSessions)
    .values({
      customerId: input.customerId,
      rawPrompt: input.rawPrompt,
      parsedParams: (input.parsedParams ?? null) as never,
      status: "processing",
    })
    .returning();
  return row;
}

/**
 * Bulk-inserts recommendations for a session. The `match_score_check`
 * constraint enforces 0 ≤ score ≤ 1 at the DB level. Numeric fields
 * accept either number or string; Drizzle's decimal columns want a
 * string so we normalise here.
 */
export async function addRecommendations(
  sessionId: string,
  recs: AddRecommendationInput[]
): Promise<PlanRecommendationRow[]> {
  if (recs.length === 0) return [];
  return db
    .insert(schema.planRecommendations)
    .values(
      recs.map((r) => ({
        sessionId,
        listingId: r.listingId,
        matchScore: String(r.matchScore),
        matchReason: r.matchReason ?? null,
        estimatedCost:
          r.estimatedCost == null ? null : String(r.estimatedCost),
        recommendationType: r.recommendationType,
      }))
    )
    .returning();
}

/**
 * Flips a session's status. Used by the worker to mark the run completed
 * or failed once recommendations have been generated. Returns the
 * updated row, or null if the id was not found.
 */
export async function markSessionStatus(
  id: string,
  status: PlanStatus
): Promise<PlanSessionRow | null> {
  const [row] = await db
    .update(schema.planSessions)
    .set({ status })
    .where(eq(schema.planSessions.id, id))
    .returning();
  return row ?? null;
}
