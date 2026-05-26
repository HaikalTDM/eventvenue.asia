import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { hashToken } from "@/lib/email/tokens";
import { handleApiError, validationError } from "@/lib/utils/errors";

const bodySchema = z.object({
  token: z.string().min(10).max(512),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

/**
 * POST /api/v1/auth/reset-password
 * body: { token: string, password: string }
 *
 * Validates the token (unconsumed + unexpired), updates the user's password,
 * and consumes the token. Also clears any other outstanding reset tokens for
 * the same user so a stolen old link cannot be replayed afterwards.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const { token, password } = parsed.data;
    const tokenHash = hashToken(token);

    const row = await db.query.passwordResets.findFirst({
      where: (r, { eq: e }) => e(r.tokenHash, tokenHash),
    });

    if (!row || row.consumedAt || row.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: { code: "INVALID_TOKEN", message: "This reset link is invalid or has expired." } },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(schema.users)
        .set({ passwordHash, updatedAt: now })
        .where(eq(schema.users.id, row.userId));
      await tx
        .update(schema.passwordResets)
        .set({ consumedAt: now })
        .where(eq(schema.passwordResets.userId, row.userId));
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
