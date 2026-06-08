import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth/server";

/**
 * GET /api/v1/users/me
 * PATCH /api/v1/users/me
 *
 * The current user's application profile (`public.users`). The session itself
 * lives in `auth.users` and is exposed via `/api/v1/auth/me`; this endpoint
 * exclusively serves the editable profile fields (name, phone, avatar_url).
 *
 * PATCH keeps writes to a small allow-list so callers can't grant themselves
 * a role, set isVerified, or alter the mock flag.
 */

export async function GET() {
  const userOrResp = await requireUser();
  if (userOrResp instanceof NextResponse) return userOrResp;
  return NextResponse.json({ data: userOrResp });
}

const ALLOWED_FIELDS = ["name", "phone", "avatarUrl"] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

export async function PATCH(request: NextRequest) {
  const userOrResp = await requireUser();
  if (userOrResp instanceof NextResponse) return userOrResp;
  const user = userOrResp;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Body must be valid JSON." },
      { status: 400 }
    );
  }

  // `name` is NOT NULL in the schema; phone and avatarUrl are nullable.
  const updates: { name?: string; phone?: string | null; avatarUrl?: string | null } = {};

  if ("name" in body) {
    const v = body.name;
    if (typeof v !== "string" || v.trim().length === 0) {
      return NextResponse.json(
        { error: "invalid_value", message: "name must be a non-empty string." },
        { status: 400 }
      );
    }
    updates.name = v;
  }

  for (const field of ["phone", "avatarUrl"] as const) {
    if (field in body) {
      const v = body[field];
      if (v === null) {
        updates[field] = null;
        continue;
      }
      if (typeof v !== "string") {
        return NextResponse.json(
          { error: "invalid_value", message: `${field} must be a string or null.` },
          { status: 400 }
        );
      }
      // Normalise empty strings to null so the column reflects "unset"
      // rather than holding "" — keeps the legacy shim's clear-via-empty
      // pattern working consistently.
      updates[field] = v.length === 0 ? null : v;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ data: user });
  }

  const [updated] = await db
    .update(schema.users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id))
    .returning({
      id: schema.users.id,
      name: schema.users.name,
      phone: schema.users.phone,
      avatarUrl: schema.users.avatarUrl,
      email: schema.users.email,
      role: schema.users.role,
    });

  return NextResponse.json({ data: updated });
}
