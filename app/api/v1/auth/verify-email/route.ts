import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { hashToken } from "@/lib/email/tokens";

/**
 * GET /api/v1/auth/verify-email?token=...
 *
 * Looks up the unconsumed, unexpired email_verifications row matching the
 * SHA-256 hash of the supplied token. If found, marks the user as verified
 * and consumes the token. Returns plain JSON; the UI page at /verify-email
 * renders the result.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Missing token" } },
      { status: 400 }
    );
  }

  const tokenHash = hashToken(token);

  const row = await db.query.emailVerifications.findFirst({
    where: (v, { eq: e }) => e(v.tokenHash, tokenHash),
  });

  if (!row) {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: "This verification link is invalid." } },
      { status: 400 }
    );
  }

  if (row.consumedAt) {
    return NextResponse.json(
      { error: { code: "ALREADY_USED", message: "This verification link has already been used." } },
      { status: 410 }
    );
  }

  if (row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: { code: "EXPIRED", message: "This verification link has expired. Please request a new one." } },
      { status: 410 }
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(schema.users.id, row.userId));
    await tx
      .update(schema.emailVerifications)
      .set({ consumedAt: new Date() })
      .where(eq(schema.emailVerifications.id, row.id));
  });

  return NextResponse.json({ ok: true });
}
