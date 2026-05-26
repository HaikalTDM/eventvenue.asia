import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { listingCreateSchema, listingQuerySchema } from "@/lib/validators/listing.schema";
import { handleApiError, validationError } from "@/lib/utils/errors";
import { paginate } from "@/lib/utils/pagination";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { eq, and, gte, lte, ilike, sql, desc, asc, inArray, or, SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    const url = new URL(request.url);
    const raw = Object.fromEntries(url.searchParams);

    const parsed = listingQuerySchema.safeParse(raw);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const {
      q, location, capacity, halal, amenities: amenitiesFilter,
      eventTypes: eventTypesFilter, type, category, minPrice, maxPrice,
      sort, page, limit,
    } = parsed.data;

    const conditions: SQL[] = [eq(schema.listings.status, "active")];

    if (type) conditions.push(eq(schema.listings.listingType, type));
    if (location) conditions.push(ilike(schema.listings.location, `%${location}%`));
    if (capacity) conditions.push(gte(schema.listings.capacity, capacity));
    if (halal !== undefined) conditions.push(eq(schema.listings.halalCertified, halal));
    if (minPrice) conditions.push(gte(schema.listings.pricePerHour, String(minPrice)));
    if (maxPrice) conditions.push(lte(schema.listings.pricePerHour, String(maxPrice)));
    if (q) {
      conditions.push(
        or(
          ilike(schema.listings.title, `%${q}%`),
          ilike(schema.listings.description || sql`''`, `%${q}%`),
          ilike(schema.listings.location || sql`''`, `%${q}%`)
        )!
      );
    }

    let listingIds: string[] = [];

    if (amenitiesFilter) {
      const amenityNames = amenitiesFilter.split(",").map((a) => a.trim());
      const amenityRows = await db
        .select({ id: schema.amenities.id })
        .from(schema.amenities)
        .where(inArray(schema.amenities.name, amenityNames));

      for (const { id } of amenityRows) {
        const matched = await db
          .select({ listingId: schema.listingAmenities.listingId })
          .from(schema.listingAmenities)
          .where(eq(schema.listingAmenities.amenityId, id));
        const matchedIds = matched.map((m) => m.listingId);
        if (listingIds.length === 0) {
          listingIds = matchedIds;
        } else {
          listingIds = listingIds.filter((lid) => matchedIds.includes(lid));
        }
      }
      if (listingIds.length === 0) {
        return NextResponse.json({ data: [], pagination: paginate(page, limit, 0), filters: { amenities: [], eventTypes: [] } });
      }
      conditions.push(inArray(schema.listings.id, listingIds));
    }

    if (eventTypesFilter) {
      const eventTypeNames = eventTypesFilter.split(",").map((e) => e.trim());
      const eventTypeRows = await db
        .select({ id: schema.eventTypes.id })
        .from(schema.eventTypes)
        .where(inArray(schema.eventTypes.name, eventTypeNames));

      const etIds: string[] = [];
      for (const { id } of eventTypeRows) {
        const matched = await db
          .select({ listingId: schema.listingEventTypes.listingId })
          .from(schema.listingEventTypes)
          .where(eq(schema.listingEventTypes.eventTypeId, id));
        const matchedIds = matched.map((m) => m.listingId);
        if (etIds.length === 0) {
          etIds.push(...matchedIds);
        } else {
          const filtered = etIds.filter((lid) => matchedIds.includes(lid));
          etIds.length = 0;
          etIds.push(...filtered);
        }
      }
      if (etIds.length === 0) {
        return NextResponse.json({ data: [], pagination: paginate(page, limit, 0), filters: { amenities: [], eventTypes: [] } });
      }
      conditions.push(inArray(schema.listings.id, etIds));
    }

    let orderFn;
    switch (sort) {
      case "price_asc": orderFn = asc(schema.listings.pricePerHour); break;
      case "price_desc": orderFn = desc(schema.listings.pricePerHour); break;
      case "newest": orderFn = desc(schema.listings.createdAt); break;
      default: orderFn = desc(schema.listings.averageRating);
    }

    const baseWhere = and(...conditions);

    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.listings)
      .where(baseWhere);

    const total = totalResult[0]?.count || 0;

    const offset = (page - 1) * limit;

    const listings = await db
      .select({
        id: schema.listings.id,
        title: schema.listings.title,
        slug: schema.listings.slug,
        listingType: schema.listings.listingType,
        location: schema.listings.location,
        capacity: schema.listings.capacity,
        pricePerHour: schema.listings.pricePerHour,
        currency: schema.listings.currency,
        halalCertified: schema.listings.halalCertified,
        averageRating: schema.listings.averageRating,
        reviewCount: schema.listings.reviewCount,
        createdAt: schema.listings.createdAt,
        businessName: schema.vendorProfiles.businessName,
        verificationBadge: schema.vendorProfiles.verificationBadge,
      })
      .from(schema.listings)
      .leftJoin(schema.vendorProfiles, eq(schema.listings.vendorId, schema.vendorProfiles.id))
      .where(baseWhere)
      .orderBy(orderFn)
      .limit(limit)
      .offset(offset);

    const lIds = listings.map((l) => l.id);

    const photos = await db
      .select()
      .from(schema.listingPhotos)
      .where(
        lIds.length > 0
          ? and(inArray(schema.listingPhotos.listingId, lIds), eq(schema.listingPhotos.isPrimary, true))
          : undefined
      );

    const photoMap = new Map(photos.map((p) => [p.listingId, p]));

    let allAmenities: Array<{ listingId: string; name: string }> = [];
    if (lIds.length > 0) {
      allAmenities = await db
        .select({
          listingId: schema.listingAmenities.listingId,
          name: schema.amenities.name,
        })
        .from(schema.listingAmenities)
        .innerJoin(schema.amenities, eq(schema.listingAmenities.amenityId, schema.amenities.id))
        .where(inArray(schema.listingAmenities.listingId, lIds));
    }

    const amenitiesMap = new Map<string, string[]>();
    for (const a of allAmenities) {
      const arr = amenitiesMap.get(a.listingId) || [];
      arr.push(a.name);
      amenitiesMap.set(a.listingId, arr);
    }

    let allEventTypes: Array<{ listingId: string; name: string }> = [];
    if (lIds.length > 0) {
      allEventTypes = await db
        .select({
          listingId: schema.listingEventTypes.listingId,
          name: schema.eventTypes.name,
        })
        .from(schema.listingEventTypes)
        .innerJoin(schema.eventTypes, eq(schema.listingEventTypes.eventTypeId, schema.eventTypes.id))
        .where(inArray(schema.listingEventTypes.listingId, lIds));
    }

    const eventTypesMap = new Map<string, string[]>();
    for (const e of allEventTypes) {
      const arr = eventTypesMap.get(e.listingId) || [];
      arr.push(e.name);
      eventTypesMap.set(e.listingId, arr);
    }

    const data = listings.map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      listingType: l.listingType,
      location: l.location,
      capacity: l.capacity,
      pricePerHour: l.pricePerHour,
      currency: l.currency,
      halalCertified: l.halalCertified,
      averageRating: l.averageRating,
      reviewCount: l.reviewCount,
      primaryPhoto: photoMap.get(l.id) ? {
        url: photoMap.get(l.id)!.url,
        altText: photoMap.get(l.id)!.altText,
      } : null,
      vendor: {
        businessName: l.businessName,
        verificationBadge: l.verificationBadge,
      },
      amenities: amenitiesMap.get(l.id) || [],
      eventTypes: eventTypesMap.get(l.id) || [],
      createdAt: l.createdAt,
    }));

    const amenityCounts = await db
      .select({
        id: schema.amenities.id,
        name: schema.amenities.name,
        count: sql<number>`count(${schema.listingAmenities.listingId})::int`,
      })
      .from(schema.amenities)
      .leftJoin(schema.listingAmenities, eq(schema.amenities.id, schema.listingAmenities.amenityId))
      .groupBy(schema.amenities.id, schema.amenities.name);

    const eventTypeCounts = await db
      .select({
        id: schema.eventTypes.id,
        name: schema.eventTypes.name,
        count: sql<number>`count(${schema.listingEventTypes.listingId})::int`,
      })
      .from(schema.eventTypes)
      .leftJoin(schema.listingEventTypes, eq(schema.eventTypes.id, schema.listingEventTypes.eventTypeId))
      .groupBy(schema.eventTypes.id, schema.eventTypes.name);

    const response: Record<string, unknown> = {
      data,
      pagination: paginate(page, limit, total),
      filters: {
        amenities: amenityCounts.filter((a) => a.count > 0),
        eventTypes: eventTypeCounts.filter((e) => e.count > 0),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    if (!user || user.role !== "vendor") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only vendors can create listings" } },
        { status: 403 }
      );
    }

    const vendorProfile = await db.query.vendorProfiles.findFirst({
      where: (vp) => eq(vp.userId, user.sub),
    });
    if (!vendorProfile || vendorProfile.verificationStatus !== "approved") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Vendor must be approved to create listings" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = listingCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const { amenities: amenityNames, eventTypes: eventTypeNames, ...listingData } = parsed.data;

    const slug = generateUniqueSlug(listingData.title);

    const dbValues: Record<string, unknown> = {
      vendorId: vendorProfile.id,
      listingType: listingData.listingType,
      title: listingData.title,
      slug,
      status: "draft" as const,
    };

    if (listingData.description !== undefined) dbValues.description = listingData.description;
    if (listingData.location !== undefined) dbValues.location = listingData.location;
    if (listingData.address !== undefined) dbValues.address = listingData.address;
    if (listingData.capacity !== undefined) dbValues.capacity = listingData.capacity;
    if (listingData.pricePerHour !== undefined) dbValues.pricePerHour = String(listingData.pricePerHour);
    if (listingData.currency !== undefined) dbValues.currency = listingData.currency;
    if (listingData.halalCertified !== undefined) dbValues.halalCertified = listingData.halalCertified;
    if (listingData.coordinates !== undefined) dbValues.coordinates = listingData.coordinates;

    const [listing] = await db
      .insert(schema.listings)
      .values(dbValues as typeof schema.listings.$inferInsert)
      .returning();

    if (amenityNames && amenityNames.length > 0) {
      const existing = await db
        .select()
        .from(schema.amenities)
        .where(inArray(schema.amenities.name, amenityNames));

      const newNames = amenityNames.filter(
        (n) => !existing.some((a) => a.name === n)
      );

      if (newNames.length > 0) {
        const inserted = await db
          .insert(schema.amenities)
          .values(newNames.map((n) => ({ name: n })))
          .returning();

        existing.push(...inserted);
      }

      await db.insert(schema.listingAmenities).values(
        existing.map((a) => ({
          listingId: listing.id,
          amenityId: a.id,
        }))
      );
    }

    if (eventTypeNames && eventTypeNames.length > 0) {
      const existing = await db
        .select()
        .from(schema.eventTypes)
        .where(inArray(schema.eventTypes.name, eventTypeNames));

      const newNames = eventTypeNames.filter(
        (n) => !existing.some((e) => e.name === n)
      );

      if (newNames.length > 0) {
        const inserted = await db
          .insert(schema.eventTypes)
          .values(newNames.map((n) => ({ name: n })))
          .returning();

        existing.push(...inserted);
      }

      await db.insert(schema.listingEventTypes).values(
        existing.map((e) => ({
          listingId: listing.id,
          eventTypeId: e.id,
        }))
      );
    }

    return NextResponse.json({ data: listing }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
