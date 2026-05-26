import { Resend } from "resend";

/**
 * Returns a Resend client instance, or null if RESEND_API_KEY is not set.
 *
 * When the key is missing (development / pre-deploy), email helpers fall back
 * to logging the message and any action link to the server console so flows
 * can still be tested end-to-end.
 */
let cachedClient: Resend | null | undefined;

export function getResendClient(): Resend | null {
  if (cachedClient !== undefined) return cachedClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    cachedClient = null;
    return null;
  }
  cachedClient = new Resend(key);
  return cachedClient;
}

export function getFromAddress(): string {
  return process.env.RESEND_FROM || "EventVenue.Asia <noreply@eventvenue.asia>";
}

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Optional human-readable description used only in the console fallback log */
  consoleLabel?: string;
  /** Optional action link logged separately for easy copy/paste during local testing */
  actionLink?: string;
}

export interface SendResult {
  delivered: boolean;
  via: "resend" | "console";
  id?: string;
  error?: string;
}

/**
 * Sends an email via Resend, or logs to console if RESEND_API_KEY is not set.
 * Never throws — returns a result describing what happened.
 */
export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const client = getResendClient();

  if (!client) {
    // Console fallback: log enough detail that the action link is testable.
    const label = args.consoleLabel || "email";
    console.log(
      `\n[email:console] ${label}\n  to:      ${args.to}\n  subject: ${args.subject}` +
        (args.actionLink ? `\n  link:    ${args.actionLink}` : "") +
        "\n  (RESEND_API_KEY not set — email not delivered)\n"
    );
    return { delivered: false, via: "console" };
  }

  try {
    const res = await client.emails.send({
      from: getFromAddress(),
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });

    if (res.error) {
      console.error("[email:resend] error", res.error);
      return { delivered: false, via: "resend", error: res.error.message };
    }

    return { delivered: true, via: "resend", id: res.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email:resend] threw", message);
    return { delivered: false, via: "resend", error: message };
  }
}
