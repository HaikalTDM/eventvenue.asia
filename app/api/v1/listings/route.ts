import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { requireRole } from "@/lib/auth/server";
import { listListings } from "@/lib/db/queries/listings";
import { db, schema } from "@/lib/db";
import { listingCreateSchema } from "@/lib/validators/listing.schema";

/**
 * GET /api/v1/listings
 *
 * Public listing search. All filters are optional. The query layer applies
 * `is_mock=false` and `status=active` by default so anonymous traffic only
 * sees real, published listings. Pass `mine=true` (vendor-authenticated) to
 * include the caller's own drafts and paused rows.
 */
const listQuerySchema = z.object({
  type: z.enum(["venue", "service"]).optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  search: z.string().optional(),
  minCapacity: z.coerce.number().int().nonnegative().optional(),
  maxCapacity: z.coerce.number().int().nonnegative().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  halalOnly: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  amenityIds: z
    .string()
    .transform((s) => s.split(",").map(Number).filter(Number.isFinite))
    .optional(),
  eventTypeIds: z
    .string()
    .transform((s) => s.split(",").map(Number).filter(Number.isFinite))
    .optional(),
  sort: z.enum(["newest", "rating", "price_asc", "price_desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  offset: z.coerce.number().int().nonnegative().default(0),
  mine: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams);
  const parsed = listQuerySchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_query", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { mine, ...filters } = parsed.data;

  // Gather the rows first (both paths use the same enrichment step after).
  let rows: Awaited<ReturnType<typeof listListings>>["rows"];
  let total: number;

  if (mine) {
    const userOrResp = await requireRole("vendor");
    if (userOrResp instanceof NextResponse) return userOrResp;
    const user = userOrResp;
    if (!user.vendorId) {
      return NextResponse.json({ data: [], total: 0 });
    }
    ({ rows, total } = await listListings({
      ...filters,
      vendorId: user.vendorId,
      // Must be `null` (not `undefined`) — the default-arg only fires on
      // `undefined`, so null skips the status filter.
      status: null,
      includeMock: false,
    }));
  } else {
    ({ rows, total } = await listListings(filters));
  }

  // Attach the primary photo to each row so the grid cards have a
  // thumbnail without loading every listing's full relation tree. One
  // batch query per page — minimal overhead vs. N+1 per card.
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const photos = await db
      .select({
        listingId: schema.listingPhotos.listingId,
        url: schema.listingPhotos.url,
        altText: schema.listingPhotos.altText,
      })
      .from(schema.listingPhotos)
      .where(
        and(
          inArray(schema.listingPhotos.listingId, ids),
          eq(schema.listingPhotos.isPrimary, true)
        )
      );
    const photoByListingId = new Map(photos.map((p) => [p.listingId, { url: p.url, altText: p.altText }]));
    const enriched = rows.map((r) => ({
      ...r,
      primaryPhoto: photoByListingId.get(r.id) ?? null,
    }));
    return NextResponse.json({ data: enriched, total });
  }

  return NextResponse.json({ data: rows, total });
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "listing";
  const suffix = randomUUID().split("-")[0];
  return `${base}-${suffix}`;
}

/**
 * POST /api/v1/listings
 *
 * Vendor-only. Creates a new listing in `draft` status. The slug is derived
 * from the title with a UUID segment for uniqueness — no dependency on a DB
 * trigger.
 */
export async function POST(request: NextRequest) {
  const userOrResp = await requireRole("vendor");
  if (userOrResp instanceof NextResponse) return userOrResp;
  const user = userOrResp;
  if (!user.vendorId) {
    return NextResponse.json(
      { error: { message: "Complete vendor onboarding before creating listings." } },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const parsed = listingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          message: "Invalid input.",
          details: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  const input = parsed.data;

  try {
    const [row] = await db
      .insert(schema.listings)
      .values({
        vendorId: user.vendorId,
        listingType: input.listingType,
        title: input.title,
        // Slug is generated here AND by the ensure_listing_slug trigger as a
        // defensive fallback. Postgres function uses a random hex suffix;
        // Node uses a UUID segment. Either guarantees uniqueness under
        // concurrent inserts.
        slug: generateSlug(input.title),
        description: input.description ?? null,
        location: input.location ?? null,
        state: input.state ?? null,
        city: input.city ?? null,
        district: input.district ?? null,
        latitude: input.latitude != null ? String(input.latitude) : null,
        longitude: input.longitude != null ? String(input.longitude) : null,
        address: input.address ?? null,
        capacity: input.capacity ?? null,
        pricePerHour: input.pricePerHour != null ? String(input.pricePerHour) : null,
        currency: input.currency,
        halalCertified: input.halalCertified,
        // Vendors create in draft; an explicit publish flips status to active.
        status: "draft",
      })
      .returning({ id: schema.listings.id, slug: schema.listings.slug });

    if (input.amenities && input.amenities.length > 0) {
      const matched = await db
        .select({ id: schema.amenities.id })
        .from(schema.amenities)
        .where(inArray(schema.amenities.name, input.amenities));
      if (matched.length > 0) {
        await db.insert(schema.listingAmenities).values(
          matched.map((a) => ({ listingId: row.id, amenityId: a.id }))
        );
      }
    }

    if (input.eventTypes && input.eventTypes.length > 0) {
      const matched = await db
        .select({ id: schema.eventTypes.id })
        .from(schema.eventTypes)
        .where(inArray(schema.eventTypes.name, input.eventTypes));
      if (matched.length > 0) {
        await db.insert(schema.listingEventTypes).values(
          matched.map((e) => ({ listingId: row.id, eventTypeId: e.id }))
        );
      }
    }

    return NextResponse.json(
      { data: { id: row.id, slug: row.slug } },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          message: err instanceof Error ? err.message : "Listing creation failed.",
        },
      },
      { status: 500 }
    );
  }
}
