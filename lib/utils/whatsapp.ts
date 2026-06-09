/**
 * WhatsApp deep-link helpers.
 *
 * The vendor workflow hands off customer inquiries to WhatsApp rather than an
 * internal chat. Given a customer's stored phone number and inquiry context,
 * `buildWhatsAppUrl` produces a `wa.me` link that opens WhatsApp (mobile app or
 * WhatsApp Web) with a personalized message pre-filled in the compose box.
 */

/**
 * Normalize a raw phone string to bare E.164 digits (no `+`, no spaces/dashes)
 * suitable for a `wa.me/<number>` link. Defaults to Malaysian country code 60.
 *
 * Handles the common local-input shapes:
 *   "+60 12-345 6789" -> "60123456789"
 *   "012-345 6789"    -> "60123456789"  (leading 0 stripped, 60 prepended)
 *   "0060123456789"   -> "60123456789"  (international 00 prefix)
 *   "60123456789"     -> "60123456789"  (already normalized)
 *
 * Returns null when there aren't enough digits to be a real number.
 */
export function normalizePhone(raw: string | null | undefined, defaultCountryCode = "60"): string | null {
  if (!raw) return null;

  // Strip everything except digits and a possible leading +.
  let digits = raw.trim().replace(/[^\d+]/g, "");

  // "00" international prefix -> drop it (equivalent to +).
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("+")) {
    digits = digits.slice(1);
  } else if (digits.startsWith("0")) {
    // Local format with trunk 0 (e.g. 012...) -> replace 0 with country code.
    digits = defaultCountryCode + digits.slice(1);
  } else if (!digits.startsWith(defaultCountryCode)) {
    // Bare local number without trunk 0 and without country code.
    digits = defaultCountryCode + digits;
  }

  // Sanity check: a valid MY mobile is ~11-12 digits incl. country code.
  if (digits.length < 8 || digits.length > 15) return null;

  return digits;
}

export type WhatsAppMessageContext = {
  customerName?: string | null;
  listingTitle?: string | null;
  eventDate?: string | null;
  guestCount?: number | null;
  eventType?: string | null;
};

/**
 * Build the pre-filled vendor → customer opening message. Only references
 * fields that are present, so a sparse inquiry still yields a clean sentence.
 */
export function buildInquiryMessage(ctx: WhatsAppMessageContext): string {
  const name = ctx.customerName?.trim() || "there";
  const parts: string[] = [`Hi ${name}, thanks for your inquiry`];

  if (ctx.listingTitle) parts.push(`about ${ctx.listingTitle}`);

  const details: string[] = [];
  if (ctx.eventDate) details.push(`on ${ctx.eventDate}`);
  if (typeof ctx.guestCount === "number" && ctx.guestCount > 0) {
    details.push(`for ${ctx.guestCount} guests`);
  }
  if (details.length > 0) parts.push(details.join(" "));

  let message = parts.join(" ") + ".";
  if (ctx.eventType) {
    message += ` I'd love to help with your ${ctx.eventType}.`;
  }
  message += " Let's discuss the details here!";

  return message;
}

/**
 * Produce a ready-to-open WhatsApp deep link, or null when the phone can't be
 * normalized (caller should hide the button in that case).
 */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  ctx: WhatsAppMessageContext = {}
): string | null {
  const number = normalizePhone(phone);
  if (!number) return null;

  const text = buildInquiryMessage(ctx);
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
