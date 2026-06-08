"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth/server";
import {
  addFavorite,
  isFavorited,
  removeFavorite,
} from "@/lib/db/queries/favorites";

/**
 * Server actions for the favorites toggle. Customer-only — vendors and
 * admins don't have a "saved listings" surface so a role gate is the
 * cleanest expression of intent. Each action returns a discriminated
 * `{ ok: true, ... }` / `{ ok: false, error }` so the heart-icon UI can
 * branch inline without a try/catch.
 */

const favoriteSchema = z.object({
  listingId: z.string().uuid(),
});

export type FavoriteActionInput = z.infer<typeof favoriteSchema>;

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Add a listing to the caller's favorites. Idempotent: re-favoriting a
 * listing returns success without surfacing the unique-violation error.
 */
export async function addFavoriteAction(
  input: FavoriteActionInput
): Promise<ActionResult<{ favorited: true }>> {
  const userOrResp = await requireRole("customer");
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;

  const parsed = favoriteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  await addFavorite(user.id, parsed.data.listingId);

  revalidatePath("/dashboard/favorites");
  revalidatePath(`/venues/${parsed.data.listingId}`);

  return { ok: true, data: { favorited: true } };
}

/**
 * Remove a listing from the caller's favorites. Idempotent — calling on a
 * non-favorited listing is a no-op that returns success.
 */
export async function removeFavoriteAction(
  input: FavoriteActionInput
): Promise<ActionResult<{ favorited: false }>> {
  const userOrResp = await requireRole("customer");
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;

  const parsed = favoriteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  await removeFavorite(user.id, parsed.data.listingId);

  revalidatePath("/dashboard/favorites");
  revalidatePath(`/venues/${parsed.data.listingId}`);

  return { ok: true, data: { favorited: false } };
}

/**
 * Convenience toggle for UI buttons that don't track favorited state. Reads
 * the current state and flips it, returning the new state in the response
 * payload. Safe against double-clicks because `addFavorite`/`removeFavorite`
 * are both idempotent.
 */
export async function toggleFavoriteAction(
  input: FavoriteActionInput
): Promise<ActionResult<{ favorited: boolean }>> {
  const userOrResp = await requireRole("customer");
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;

  const parsed = favoriteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  const current = await isFavorited(user.id, parsed.data.listingId);
  if (current) {
    await removeFavorite(user.id, parsed.data.listingId);
  } else {
    await addFavorite(user.id, parsed.data.listingId);
  }

  revalidatePath("/dashboard/favorites");
  revalidatePath(`/venues/${parsed.data.listingId}`);

  return { ok: true, data: { favorited: !current } };
}
