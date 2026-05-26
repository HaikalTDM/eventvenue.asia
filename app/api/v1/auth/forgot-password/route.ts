import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { issueToken } from "@/lib/email/tokens";
import { sendEmail } from "@/lib/email/client";
import { buildResetPasswordEmail } from "@/lib/email/templates";
import { handleApiError } from "@/lib/utils/errors";

const RESET_EXPIRES_MINUTES = 60;

/**
 * POST /api/v1/auth/forgot-password
 * body: { email: string }
 *
 * Always returns 200 with the same shape regardless of whether the email
 * exists, to prevent account enumeration. If a credentials user matches,
 * a fresh password_resets row is inserted and an email is sent (or logged
 * if Resend is not configured).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";

    if (email) {
      const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
      });

      // Only credentials users can reset a password. Google users have no
      // password to reset and we don't want to leak that fact via behaviour
      // differences.
      if (user && user.authProvider === "credentials" && !user.isSuspended) {
        const { token, tokenHash } = issueToken();
        const expiresAt = new Date(Date.now() + RESET_EXPIRES_MINUTES * 60 * 1000);

        await db.insert(schema.passwordResets).values({
          userId: user.id,
          tokenHash,
          expiresAt,
        });

        const origin = request.nextUrl.origin;
        const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
        const { subject, html, text } = buildResetPasswordEmail({
          name: user.name,
          resetUrl,
          expiresInMinutes: RESET_EXPIRES_MINUTES,
        });
        await sendEmail({
          to: user.email,
          subject,
          html,
          text,
          consoleLabel: "password reset",
          actionLink: resetUrl,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
