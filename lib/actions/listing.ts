"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { requireRole, requireUser } from "@/lib/auth/server";
import { db, schema } from "@/lib/db";
import {
  setAvailabilityBlocks,
  createAvailabilitySlot,
} from "@/lib/db/queries/availability";

/**
 * Server actions for listing-side mutations: status flips, taxonomy edits
 * (amenities and event types), availability blocks, slot creation, and
 * deletes. The full create/edit-listing wizard is a separate, larger surface
 * that lives with its form schema; this file holds the small, focused
 * mutations that today's vendor portal already exercises.
 *
 * Every action enforces vendor (or admin) ownership before touching the
 * database. Pure data-access lives in `lib/db/queries/*`; the policy of
 * "is this caller allowed to do this" is concentrated here so the query
 * layer stays unaware of identity.
 */

// ─── Shared helpers ─────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Loads a listing by id, returning the bare ownership and status fields.
 * Used by every action below to gate writes — keeps a single SELECT instead
 * of duplicating the (id, vendorId) probe in every action body.
 */
async function loadListingForOwnerCheck(listingId: string) {
  const [row] = await db
    .select({
      id: schema.listings.id,
      vendorId: schema.listings.vendorId,
      status: schema.listings.status,
    })
    .from(schema.listings)
    .where(eq(schema.listings.id, listingId))
    .limit(1);
  return row ?? null;
}

// ─── Status ─────────────────────────────────────────────────────────────────

const statusSchema = z.object({
  listingId: z.string().uuid(),
  status: z.enum(["active", "paused", "draft"] as const),
});

export type UpdateListingStatusActionInput = z.infer<typeof statusSchema>;

/**
 * Vendor or admin. Toggles a listing between draft / active / paused.
 * No state-machine — the column simply reflects the latest desired state.
 */
export async function updateListingStatusAction(
  input: UpdateListingStatusActionInput
): Promise<ActionResult<{ status: "active" | "paused" | "draft" }>> {
  const userOrResp = await requireUser();
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  const listing = await loadListingForOwnerCheck(parsed.data.listingId);
  if (!listing) return { ok: false, error: "not_found" };

  const isOwner = user.vendorId === listing.vendorId;
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) return { ok: false, error: "forbidden" };

  const [updated] = await db
    .update(schema.listings)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(schema.listings.id, parsed.data.listingId))
    .returning({ status: schema.listings.status });

  revalidatePath("/vendor/listings");
  revalidatePath(`/venues/${parsed.data.listingId}`);

  return { ok: true, data: { status: updated.status } };
}

// ─── Delete ─────────────────────────────────────────────────────────────────

const deleteSchema = z.object({ listingId: z.string().uuid() });

/**
 * Vendor-only (no admin override here — admins use the moderation surface
 * instead). FK ON DELETE CASCADE handles the photos / amenities / event-type
 * link / package / availability cleanup automatically.
 */
export async function deleteListingAction(
  input: z.infer<typeof deleteSchema>
): Promise<ActionResult> {
  const userOrResp = await requireRole("vendor");
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;

  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const listing = await loadListingForOwnerCheck(parsed.data.listingId);
  if (!listing) return { ok: false, error: "not_found" };
  if (listing.vendorId !== user.vendorId) return { ok: false, error: "forbidden" };

  await db.delete(schema.listings).where(eq(schema.listings.id, parsed.data.listingId));

  revalidatePath("/vendor/listings");
  return { ok: true, data: undefined };
}
