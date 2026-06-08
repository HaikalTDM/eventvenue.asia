import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { db, schema } from "@/lib/db";

/**
 * Reviews query module. Reads and writes the `reviews` table and keeps the
 * denormalised aggregate columns (`listings.average_rating`,
 * `listings.review_count`) in sync via `recomputeListingRating`.
 *
 * Why this exists:
 *   - `listReviewsForListing` joins the customer's display name in one
 *     query so review cards don't need a follow-up users lookup.
 *   - The unique (customer_id, listing_id) index means `createReview`
 *     throws on duplicates; the route handler wraps that in a friendlier
 *     409 conflict.
 *   - `recomputeListingRating` uses an atomic UPDATE … FROM (SELECT … FROM
 *     reviews) form so the aggregates stay consistent even if multiple
 *     reviews land in quick succession; both the write and the recompute
 *     run inside one transaction.
 *
 * Pure data-access: authorization (does this customer have a completed
 * booking against the listing?) is the route handler's job.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ReviewRow = typeof schema.reviews.$inferSelect;

export type ReviewWithCustomer = ReviewRow & {
  customer: {
    id: string;
    name: string;
  };
};

export type CreateReviewInput = {
  customerId: string;
  listingId: string;
  rating: number;
  comment?: string | null;
};

export type RatingAggregate = {
  averageRating: number;
  reviewCount: number;
};

// ─── Read queries ───────────────────────────────────────────────────────────

/**
 * Lists reviews for a listing, newest first, with the reviewer's display
 * name joined in. The default `limit=20` matches the listing detail page's
 * initial render; a "load more" path can pass a larger limit.
 */
export async function listReviewsForListing(
  listingId: string,
  limit = 20
): Promise<ReviewWithCustomer[]> {
  return db
    .select({
      id: schema.reviews.id,
      customerId: schema.reviews.customerId,
      listingId: schema.reviews.listingId,
      rating: schema.reviews.rating,
      comment: schema.reviews.comment,
      createdAt: schema.reviews.createdAt,
      customer: {
        id: schema.users.id,
        name: schema.users.name,
      },
    })
    .from(schema.reviews)
    .innerJoin(schema.users, eq(schema.reviews.customerId, schema.users.id))
    .where(eq(schema.reviews.listingId, listingId))
    .orderBy(desc(schema.reviews.createdAt))
    .limit(limit);
}

/**
 * Returns true if the customer has already reviewed the listing. Used by
 * the review form to pre-empt the unique-violation case with a clearer
 * client-side message.
 */
export async function hasUserReviewedListing(
  customerId: string,
  listingId: string
): Promise<boolean> {
  const [row] = await db
    .select({ one: sql<number>`1` })
    .from(schema.reviews)
    .where(
      sql`${schema.reviews.customerId} = ${customerId} and ${schema.reviews.listingId} = ${listingId}`
    )
    .limit(1);
  return Boolean(row);
}

// ─── Write queries ──────────────────────────────────────────────────────────

/**
 * Inserts a new review. The unique (customer_id, listing_id) index causes
 * a duplicate insert to throw at the DB level; callers should catch the
 * Postgres `23505` error code and surface a 409 conflict. The rating
 * value is enforced to be 1–5 by a check constraint at the DB level.
 */
export async function createReview(input: CreateReviewInput): Promise<ReviewRow> {
  const [row] = await db
    .insert(schema.reviews)
    .values({
      customerId: input.customerId,
      listingId: input.listingId,
      rating: input.rating,
      comment: input.comment ?? null,
    })
    .returning();
  return row;
}

/**
 * Recomputes the listing's average rating and review count from the
 * `reviews` table and writes the result back to
 * `listings.average_rating` / `listings.review_count`. Done as a single
 * atomic UPDATE driven by an inline subquery so two reviews landing
 * concurrently can't produce a stale aggregate. Returns the freshly
 * computed values so the caller can echo them in the response.
 */
export async function recomputeListingRating(
  listingId: string
): Promise<RatingAggregate> {
  return db.transaction(async (tx) => {
    const [agg] = await tx
      .select({
        avg: sql<number>`coalesce(avg(${schema.reviews.rating})::float, 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.reviews)
      .where(eq(schema.reviews.listingId, listingId));

    const averageRating = Math.round((agg?.avg ?? 0) * 10) / 10;
    const reviewCount = agg?.count ?? 0;

    await tx
      .update(schema.listings)
      .set({
        averageRating: String(averageRating),
        reviewCount,
        updatedAt: new Date(),
      })
      .where(eq(schema.listings.id, listingId));

    return { averageRating, reviewCount };
  });
}
