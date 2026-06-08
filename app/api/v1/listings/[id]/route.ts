import { NextResponse, type NextRequest } from "next/server";
import { eq, inArray, sql } from "drizzle-orm";

import { requireRole } from "@/lib/auth/server";
import { getListingById, getListingBySlug } from "@/lib/db/queries/listings";
import { db, schema } from "@/lib/db";
import { listingUpdateSchema } from "@/lib/validators/listing.schema";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/v1/listings/[id]
 *
 * Returns a single listing with all relations needed by the detail page.
 * The route param accepts either a UUID or a slug — the public venue page
 * navigates by slug, vendor edit pages navigate by id.
 *
 * Increments view_count as a side effect for active listings only, so vendor
 * previews and admin reads don't pollute analytics.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isUuid = UUID_RE.test(id);

  const listing = isUuid
    ? await getListingById(id)
    : await getListingBySlug(id);

  if (!listing) {
    return NextResponse.json(
      { error: "not_found", message: "Listing not found." },
      { status: 404 }
    );
  }

  if (listing.status === "active") {
    // Atomic SQL increment so concurrent reads don't lose updates. The legacy
    // read-then-write pattern read viewCount from the cached row above and
    // would clobber other in-flight increments at high traffic.
    void db
      .update(schema.listings)
      .set({ viewCount: sql`${schema.listings.viewCount} + 1` })
      .where(eq(schema.listings.id, listing.id))
      .catch(() => {
        // View counter is best-effort; never block the response on its failure.
      });
  }

  return NextResponse.json({ data: listing });
}

/**
 * PATCH /api/v1/listings/[id]
 *
 * Vendor-only. Updates the caller's own listing. All fields are optional
 * (partial update); amenities and event types, when supplied, replace the
 * existing set rather than merging.
 *
 * Status transitions belong to the dedicated /status route — this handler
 * intentionally ignores any `status` field in the body.
 */
async function resolveListingId(id: string) {
  if (UUID_RE.test(id)) return { id, uuid: id };
  const listing = await getListingBySlug(id);
  if (!listing) return null;
  return { id: listing.id, uuid: listing.id };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paramId } = await params;
  const userOrResp = await requireRole("vendor");
  if (userOrResp instanceof NextResponse) return userOrResp;
  const user = userOrResp;

  const resolved = await resolveListingId(paramId);
  if (!resolved) {
    return NextResponse.json(
      { error: { message: "Listing not found." } },
      { status: 404 }
    );
  }
  const listingId = resolved.uuid;

  const [listing] = await db
    .select({ id: schema.listings.id, vendorId: schema.listings.vendorId })
    .from(schema.listings)
    .where(eq(schema.listings.id, listingId))
    .limit(1);

  if (!listing) {
    return NextResponse.json(
      { error: { message: "Listing not found." } },
      { status: 404 }
    );
  }
  if (listing.vendorId !== user.vendorId) {
    return NextResponse.json(
      { error: { message: "You don't own this listing." } },
      { status: 403 }
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

  const parsed = listingUpdateSchema.safeParse(body);
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

  // Build the update payload, only setting columns the caller actually
  // included. Drizzle's set() accepts partial objects, but we still need
  // to coerce decimals to strings ourselves.
  const patch: Partial<typeof schema.listings.$inferInsert> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.location !== undefined) patch.location = input.location ?? null;
  if (input.state !== undefined) patch.state = input.state ?? null;
  if (input.city !== undefined) patch.city = input.city ?? null;
  if (input.district !== undefined) patch.district = input.district ?? null;
  if (input.address !== undefined) patch.address = input.address ?? null;
  if (input.capacity !== undefined) patch.capacity = input.capacity ?? null;
  if (input.pricePerHour !== undefined) {
    patch.pricePerHour = input.pricePerHour != null ? String(input.pricePerHour) : null;
  }
  if (input.latitude !== undefined) {
    patch.latitude = input.latitude != null ? String(input.latitude) : null;
  }
  if (input.longitude !== undefined) {
    patch.longitude = input.longitude != null ? String(input.longitude) : null;
  }
  if (input.currency !== undefined) patch.currency = input.currency;
  if (input.halalCertified !== undefined) patch.halalCertified = input.halalCertified;

  if (Object.keys(patch).length > 0) {
    await db.update(schema.listings).set(patch).where(eq(schema.listings.id, listingId));
  }

  // Replace the amenity / event-type sets when the caller supplied them.
  // Skipping the field entirely leaves the existing rows untouched.
  if (input.amenities !== undefined) {
    await db.delete(schema.listingAmenities).where(eq(schema.listingAmenities.listingId, listingId));
    if (input.amenities.length > 0) {
      const matched = await db
        .select({ id: schema.amenities.id })
        .from(schema.amenities)
        .where(inArray(schema.amenities.name, input.amenities));
      if (matched.length > 0) {
        await db.insert(schema.listingAmenities).values(
          matched.map((a) => ({ listingId, amenityId: a.id }))
        );
      }
    }
  }

  if (input.eventTypes !== undefined) {
    await db.delete(schema.listingEventTypes).where(eq(schema.listingEventTypes.listingId, listingId));
    if (input.eventTypes.length > 0) {
      const matched = await db
        .select({ id: schema.eventTypes.id })
        .from(schema.eventTypes)
        .where(inArray(schema.eventTypes.name, input.eventTypes));
      if (matched.length > 0) {
        await db.insert(schema.listingEventTypes).values(
          matched.map((e) => ({ listingId, eventTypeId: e.id }))
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/v1/listings/[id]
 *
 * Vendor-only. Deletes a listing the caller owns. Cascades through child
 * tables via FK ON DELETE CASCADE (photos, amenities, packages, etc.).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paramId } = await params;
  const userOrResp = await requireRole("vendor");
  if (userOrResp instanceof NextResponse) return userOrResp;
  const user = userOrResp;

  const resolved = await resolveListingId(paramId);
  if (!resolved) {
    return NextResponse.json(
      { error: "not_found", message: "Listing not found." },
      { status: 404 }
    );
  }

  const [listing] = await db
    .select({ id: schema.listings.id, vendorId: schema.listings.vendorId })
    .from(schema.listings)
    .where(eq(schema.listings.id, resolved.uuid))
    .limit(1);

  if (!listing) {
    return NextResponse.json(
      { error: "not_found", message: "Listing not found." },
      { status: 404 }
    );
  }
  if (listing.vendorId !== user.vendorId) {
    return NextResponse.json(
      { error: "forbidden", message: "You don't own this listing." },
      { status: 403 }
    );
  }

  await db.delete(schema.listings).where(eq(schema.listings.id, resolved.uuid));
  return NextResponse.json({ ok: true });
}
