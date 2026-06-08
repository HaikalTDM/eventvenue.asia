import "server-only";

import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";

import { db, schema } from "@/lib/db";

/**
 * Listings query module. The single source of truth for reading and writing
 * the `listings` table and its child rows (photos, amenities link, event-types
 * link, service packages, tags). Every API route handler and Server
 * Component that needs listing data goes through this file — never directly
 * through Drizzle.
 *
 * Why this exists:
 *   - Centralises the join shape (`ListingWithRelations`) so callers can't
 *     produce slightly-different views of the same entity.
 *   - Lets us swap in caching, RLS-bypass paths, or a different ORM later
 *     without touching consumers.
 *   - Mock-data-flag (`is_mock`) filtering happens here, so production reads
 *     never accidentally include seed rows.
 *
 * Phase 3 deletes the mock filter and the `is_mock` column once cutover is
 * done; until then every public-facing read defaults to `includeMock=false`.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ListingType = "venue" | "service";
export type ListingStatus = "active" | "paused" | "draft";

export type ListingPhoto = {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export type ListingRow = typeof schema.listings.$inferSelect;

export type ListingWithRelations = ListingRow & {
  photos: ListingPhoto[];
  amenities: { id: number; name: string; icon: string | null; category: string | null }[];
  eventTypes: { id: number; name: string }[];
  packages: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    unit: string;
  }[];
  vendor: {
    id: string;
    businessName: string;
    vendorType: "venue_owner" | "service_provider";
    verificationBadge: "none" | "verified" | "premium";
  } | null;
};

export type ListListingsFilters = {
  type?: ListingType;
  /**
   * Filter by listing status. Defaults to `"active"` for public reads.
   * Pass `null` explicitly to disable the filter (e.g. vendor's own dashboard
   * which sees drafts and paused listings alongside active ones).
   */
  status?: ListingStatus | null;
  state?: string;
  city?: string;
  district?: string;
  minCapacity?: number;
  maxCapacity?: number;
  minPrice?: number;
  maxPrice?: number;
  halalOnly?: boolean;
  search?: string;
  vendorId?: string;
  amenityIds?: number[];
  eventTypeIds?: number[];
  /** Include rows flagged `is_mock=true`. Defaults to false in production. */
  includeMock?: boolean;
};

export type ListListingsOptions = ListListingsFilters & {
  limit?: number;
  offset?: number;
  /** "newest" | "rating" | "price_asc" | "price_desc". Default "newest". */
  sort?: "newest" | "rating" | "price_asc" | "price_desc";
};

// ─── Read queries ───────────────────────────────────────────────────────────

/**
 * Lists listings with optional filters, sort, and pagination. Returns a thin
 * row shape (no joined photos/amenities/etc.) for performance — use
 * `getListingBySlug` or `getListingById` to load a full detail view.
 */
export async function listListings(
  options: ListListingsOptions = {}
): Promise<{ rows: ListingRow[]; total: number }> {
  const {
    type,
    status = "active",
    state,
    city,
    district,
    minCapacity,
    maxCapacity,
    minPrice,
    maxPrice,
    halalOnly,
    search,
    vendorId,
    amenityIds,
    eventTypeIds,
    includeMock = false,
    limit = 24,
    offset = 0,
    sort = "newest",
  } = options;

  const conditions = [];
  // status === null means "no filter" (vendor dashboards). The default-arg
  // above only applies when the key is omitted entirely.
  if (status !== null) conditions.push(eq(schema.listings.status, status));

  if (type) conditions.push(eq(schema.listings.listingType, type));
  if (state) conditions.push(eq(schema.listings.state, state));
  if (city) conditions.push(eq(schema.listings.city, city));
  if (district) conditions.push(eq(schema.listings.district, district));
  if (vendorId) conditions.push(eq(schema.listings.vendorId, vendorId));
  if (halalOnly) conditions.push(eq(schema.listings.halalCertified, true));
  if (!includeMock) conditions.push(eq(schema.listings.isMock, false));

  if (typeof minCapacity === "number") {
    conditions.push(gte(schema.listings.capacity, minCapacity));
  }
  if (typeof maxCapacity === "number") {
    conditions.push(lte(schema.listings.capacity, maxCapacity));
  }
  if (typeof minPrice === "number") {
    conditions.push(gte(schema.listings.pricePerHour, String(minPrice)));
  }
  if (typeof maxPrice === "number") {
    conditions.push(lte(schema.listings.pricePerHour, String(maxPrice)));
  }
  if (search) {
    const term = `%${search}%`;
    conditions.push(
      or(
        ilike(schema.listings.title, term),
        ilike(schema.listings.location, term),
        ilike(schema.listings.description, term)
      )!
    );
  }

  // Amenity / event-type filters require a subquery (any listing that has at
  // least one matching link row). Done as a correlated EXISTS to avoid
  // duplicating rows from joins.
  if (amenityIds && amenityIds.length > 0) {
    conditions.push(
      sql`exists (select 1 from ${schema.listingAmenities} la
                  where la.listing_id = ${schema.listings.id}
                    and la.amenity_id in (${sql.join(amenityIds, sql`, `)}))`
    );
  }
  if (eventTypeIds && eventTypeIds.length > 0) {
    conditions.push(
      sql`exists (select 1 from ${schema.listingEventTypes} le
                  where le.listing_id = ${schema.listings.id}
                    and le.event_type_id in (${sql.join(eventTypeIds, sql`, `)}))`
    );
  }

  const orderBy =
    sort === "rating"
      ? desc(schema.listings.averageRating)
      : sort === "price_asc"
      ? schema.listings.pricePerHour
      : sort === "price_desc"
      ? desc(schema.listings.pricePerHour)
      : desc(schema.listings.createdAt);

  const where = and(...conditions);

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(schema.listings).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.listings)
      .where(where),
  ]);

  return { rows, total: count };
}

/**
 * Loads a single listing by slug with every relation needed to render the
 * detail page. Returns `null` if the slug doesn't exist or the listing is
 * mock-flagged and the caller didn't opt in.
 */
export async function getListingBySlug(
  slug: string,
  options: { includeMock?: boolean } = {}
): Promise<ListingWithRelations | null> {
  const { includeMock = false } = options;

  const [listing] = await db
    .select()
    .from(schema.listings)
    .where(
      includeMock
        ? eq(schema.listings.slug, slug)
        : and(eq(schema.listings.slug, slug), eq(schema.listings.isMock, false))
    )
    .limit(1);

  if (!listing) return null;
  return loadListingRelations(listing);
}

/**
 * Same as `getListingBySlug` but keyed by id. Used for vendor-side editing
 * where slugs can change.
 */
export async function getListingById(
  id: string,
  options: { includeMock?: boolean } = {}
): Promise<ListingWithRelations | null> {
  const { includeMock = false } = options;

  const [listing] = await db
    .select()
    .from(schema.listings)
    .where(
      includeMock
        ? eq(schema.listings.id, id)
        : and(eq(schema.listings.id, id), eq(schema.listings.isMock, false))
    )
    .limit(1);

  if (!listing) return null;
  return loadListingRelations(listing);
}

// ─── Relation loader ────────────────────────────────────────────────────────

/**
 * Hydrates a base listing row with all its child relations in parallel.
 * Kept as a helper so both `getListingBySlug` and `getListingById` produce
 * identical shapes.
 */
async function loadListingRelations(
  listing: ListingRow
): Promise<ListingWithRelations> {
  const [photos, amenityRows, eventTypeRows, packages, vendor] = await Promise.all([
    db
      .select({
        id: schema.listingPhotos.id,
        url: schema.listingPhotos.url,
        altText: schema.listingPhotos.altText,
        sortOrder: schema.listingPhotos.sortOrder,
        isPrimary: schema.listingPhotos.isPrimary,
      })
      .from(schema.listingPhotos)
      .where(eq(schema.listingPhotos.listingId, listing.id))
      .orderBy(schema.listingPhotos.sortOrder),

    db
      .select({
        id: schema.amenities.id,
        name: schema.amenities.name,
        icon: schema.amenities.icon,
        category: schema.amenities.category,
      })
      .from(schema.listingAmenities)
      .innerJoin(
        schema.amenities,
        eq(schema.amenities.id, schema.listingAmenities.amenityId)
      )
      .where(eq(schema.listingAmenities.listingId, listing.id)),

    db
      .select({ id: schema.eventTypes.id, name: schema.eventTypes.name })
      .from(schema.listingEventTypes)
      .innerJoin(
        schema.eventTypes,
        eq(schema.eventTypes.id, schema.listingEventTypes.eventTypeId)
      )
      .where(eq(schema.listingEventTypes.listingId, listing.id)),

    db
      .select({
        id: schema.servicePackages.id,
        name: schema.servicePackages.name,
        description: schema.servicePackages.description,
        price: schema.servicePackages.price,
        unit: schema.servicePackages.unit,
      })
      .from(schema.servicePackages)
      .where(eq(schema.servicePackages.listingId, listing.id)),

    db
      .select({
        id: schema.vendorProfiles.id,
        businessName: schema.vendorProfiles.businessName,
        vendorType: schema.vendorProfiles.vendorType,
        verificationBadge: schema.vendorProfiles.verificationBadge,
      })
      .from(schema.vendorProfiles)
      .where(eq(schema.vendorProfiles.id, listing.vendorId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  return {
    ...listing,
    photos,
    amenities: amenityRows,
    eventTypes: eventTypeRows,
    packages,
    vendor,
  };
}
