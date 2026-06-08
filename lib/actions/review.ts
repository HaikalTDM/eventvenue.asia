"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { requireRole } from "@/lib/auth/server";
import { db, schema } from "@/lib/db";
import {
  createReview,
  hasUserReviewedListing,
  recomputeListingRating,
} from "@/lib/db/queries/reviews";

/**
 * Server actions for reviews. Customer-only writes; reads happen through the
 * query module directly. Each successful submission recomputes the listing's
 * denormalised aggregate columns (`average_rating`, `review_count`) so the
 * detail page reflects the new review without waiting for a background job.
 *
 * The "must have a completed booking" check is enforced here rather than in
 * the query layer — the query module is pure data-access; the action layer
 * is where business policy gets to live.
 */

const createReviewSchema = z.object({
  listingId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2_000).optional().nullable(),
});

export type CreateReviewActionInput = z.infer<typeof createReviewSchema>;

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Customer-only. Creates a single review on a listing the customer has at
 * least one `completed` booking for. Duplicate submissions surface as a
 * friendly `already_reviewed` error instead of leaking the unique-violation
 * SQL state to the client.
 */
export async function createReviewAction(
  input: CreateReviewActionInput
): Promise<ActionResult<{ id: string }>> {
  const userOrResp = await requireRole("customer");
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;

  const parsed = createReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  // Listing must exist and not be a mock row.
  const [listing] = await db
    .select({ id: schema.listings.id, isMock: schema.listings.isMock })
    .from(schema.listings)
    .where(eq(schema.listings.id, parsed.data.listingId))
    .limit(1);
  if (!listing || listing.isMock) return { ok: false, error: "listing_not_found" };

  // Reviewer must have at least one completed booking against this listing.
  const [eligibility] = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.customerId, user.id),
        eq(schema.bookings.listingId, parsed.data.listingId),
        eq(schema.bookings.status, "completed")
      )
    )
    .limit(1);
  if (!eligibility) {
    return { ok: false, error: "no_completed_booking" };
  }

  // Defence in depth — the unique index handles the race, but checking up
  // front lets us return a clear error string instead of catching a Postgres
  // error code.
  const already = await hasUserReviewedListing(user.id, parsed.data.listingId);
  if (already) return { ok: false, error: "already_reviewed" };

  let row;
  try {
    row = await createReview({
      customerId: user.id,
      listingId: parsed.data.listingId,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    });
  } catch (err) {
    // Unique violation on (customer_id, listing_id) means another concurrent
    // submission landed first. Same outcome from the user's perspective.
    if (err instanceof Error && /unique|duplicate/i.test(err.message)) {
      return { ok: false, error: "already_reviewed" };
    }
    throw err;
  }

  await recomputeListingRating(parsed.data.listingId);

  revalidatePath(`/venues/${parsed.data.listingId}`);
  revalidatePath("/dashboard/bookings");

  return { ok: true, data: { id: row.id } };
}
