import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { issueToken } from "@/lib/email/tokens";
import { sendEmail } from "@/lib/email/client";
import { buildVerifyEmail } from "@/lib/email/templates";
import { handleApiError } from "@/lib/utils/errors";

const VERIFY_EXPIRES_HOURS = 24;

/**
 * POST /api/v1/auth/resend-verification
 * body: { email: string }
 *
 * Always returns 200 to prevent account enumeration. If a credentials user
 * exists with that email and is not yet verified, a fresh token is issued
 * and the email is sent (or logged when Resend is not configured).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    if (!email) {
      return NextResponse.json({ ok: true });
    }

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });

    if (!user || user.authProvider !== "credentials" || user.isVerified) {
      return NextResponse.json({ ok: true });
    }

    const { token, tokenHash } = issueToken();
    const expiresAt = new Date(Date.now() + VERIFY_EXPIRES_HOURS * 60 * 60 * 1000);

    await db.insert(schema.emailVerifications).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const origin = request.nextUrl.origin;
    const verifyUrl = `${origin}/verify-email?token=${encodeURIComponent(token)}`;
    const { subject, html, text } = buildVerifyEmail({
      name: user.name,
      verifyUrl,
      expiresInHours: VERIFY_EXPIRES_HOURS,
    });
    await sendEmail({
      to: user.email,
      subject,
      html,
      text,
      consoleLabel: "verify-email (resend)",
      actionLink: verifyUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
