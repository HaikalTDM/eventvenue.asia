import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db, schema } from "@/lib/db";

/**
 * Favorites query module. Reads and writes the `favorites` link table that
 * pairs a customer with the listings they've saved. The `favorites` table
 * itself has no mock flag; mock filtering happens on the joined `listings`
 * row (and is applied by default for production reads).
 *
 * Why this exists:
 *   - `listFavorites` returns the joined listing rows, not the raw link
 *     rows — that's what every consumer (customer dashboard, "My favorites"
 *     page) actually wants.
 *   - `addFavorite` uses `onConflictDoNothing` so the API can be safely
 *     called twice for the same (customer, listing) pair without surfacing
 *     a unique-violation error to the client.
 *
 * Pure data-access: authorization (does the caller own this customerId?)
 * is the route handler's job.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ListingRow = typeof schema.listings.$inferSelect;

// ─── Read queries ───────────────────────────────────────────────────────────

/**
 * Lists every listing the customer has favorited, newest-favorite first.
 * Mock listings are filtered out by default (production behaviour); the
 * favorites table itself is not joined into the result.
 */
export async function listFavorites(customerId: string): Promise<ListingRow[]> {
  const rows = await db
    .select({ listing: schema.listings, createdAt: schema.favorites.createdAt })
    .from(schema.favorites)
    .innerJoin(schema.listings, eq(schema.favorites.listingId, schema.listings.id))
    .where(
      and(
        eq(schema.favorites.customerId, customerId),
        eq(schema.listings.isMock, false)
      )
    )
    .orderBy(desc(schema.favorites.createdAt));
  return rows.map((r) => r.listing);
}

/**
 * Returns true if the (customerId, listingId) pair already exists in the
 * favorites table. Used by listing detail pages to render the heart icon
 * in its filled state.
 */
export async function isFavorited(
  customerId: string,
  listingId: string
): Promise<boolean> {
  const [row] = await db
    .select({ one: sql<number>`1` })
    .from(schema.favorites)
    .where(
      and(
        eq(schema.favorites.customerId, customerId),
        eq(schema.favorites.listingId, listingId)
      )
    )
    .limit(1);
  return Boolean(row);
}

// ─── Write queries ──────────────────────────────────────────────────────────

/**
 * Idempotently saves a (customerId, listingId) pair. `onConflictDoNothing`
 * keyed on the (customer_id, listing_id) primary key means re-favoriting
 * a listing is a no-op rather than an error.
 */
export async function addFavorite(
  customerId: string,
  listingId: string
): Promise<void> {
  await db
    .insert(schema.favorites)
    .values({ customerId, listingId })
    .onConflictDoNothing({
      target: [schema.favorites.customerId, schema.favorites.listingId],
    });
}

/**
 * Removes a (customerId, listingId) pair. No-op if the row doesn't exist.
 */
export async function removeFavorite(
  customerId: string,
  listingId: string
): Promise<void> {
  await db
    .delete(schema.favorites)
    .where(
      and(
        eq(schema.favorites.customerId, customerId),
        eq(schema.favorites.listingId, listingId)
      )
    );
}
