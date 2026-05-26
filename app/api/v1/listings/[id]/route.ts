import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { listingUpdateSchema } from "@/lib/validators/listing.schema";
import { handleApiError, notFound, validationError } from "@/lib/utils/errors";
import { eq, inArray } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await authenticate(request);

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, id),
    });

    if (!listing) {
      throw notFound("Listing");
    }

    await db
      .update(schema.listings)
      .set({ viewCount: (listing.viewCount || 0) + 1 })
      .where(eq(schema.listings.id, id));

    const photos = await db.query.listingPhotos.findMany({
      where: (p) => eq(p.listingId, id),
      orderBy: (p) => p.sortOrder,
    });

    const amenityData = await db
      .select({ id: schema.amenities.id, name: schema.amenities.name, icon: schema.amenities.icon, category: schema.amenities.category })
      .from(schema.listingAmenities)
      .innerJoin(schema.amenities, eq(schema.listingAmenities.amenityId, schema.amenities.id))
      .where(eq(schema.listingAmenities.listingId, id));

    const eventTypeData = await db
      .select({ id: schema.eventTypes.id, name: schema.eventTypes.name })
      .from(schema.listingEventTypes)
      .innerJoin(schema.eventTypes, eq(schema.listingEventTypes.eventTypeId, schema.eventTypes.id))
      .where(eq(schema.listingEventTypes.listingId, id));

    const servicePackages = await db.query.servicePackages.findMany({
      where: (p) => eq(p.listingId, id),
    });

    const vendor = await db.query.vendorProfiles.findFirst({
      where: (vp) => eq(vp.id, listing.vendorId),
    });

    const blockedDates = await db.query.availabilityBlocks.findMany({
      where: (b) => eq(b.listingId, id),
    });

    const appointments = await db.query.availabilitySlots.findMany({
      where: (s) => eq(s.listingId, id),
      orderBy: (s) => s.startTime,
    });

    const reviewList = await db.query.reviews.findMany({
      where: (r) => eq(r.listingId, id),
      orderBy: (r) => r.createdAt,
      limit: 10,
    });

    let reviewsWithCustomers: Array<Record<string, unknown>> = [];
    if (reviewList.length > 0) {
      const customerIds = [...new Set(reviewList.map((r) => r.customerId))];
      const customers = await db.query.users.findMany({
        where: (u) => inArray(u.id, customerIds),
      });
      const customerMap = new Map(customers.map((c) => [c.id, c]));
      reviewsWithCustomers = reviewList.map((r) => ({
        id: r.id,
        customer: {
          name: customerMap.get(r.customerId)?.name || "Anonymous",
          avatarUrl: customerMap.get(r.customerId)?.avatarUrl,
        },
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      }));
    }

    const responseData: Record<string, unknown> = {
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      listingType: listing.listingType,
      description: listing.description,
      location: listing.location,
      address: listing.address,
      capacity: listing.capacity,
      pricePerHour: listing.pricePerHour,
      currency: listing.currency,
      halalCertified: listing.halalCertified,
      status: listing.status,
      averageRating: listing.averageRating,
      reviewCount: listing.reviewCount,
      photos,
      amenities: amenityData,
      eventTypes: eventTypeData,
      servicePackages,
      vendor: vendor ? {
        id: vendor.id,
        businessName: vendor.businessName,
        businessDescription: vendor.businessDescription,
        businessWebsite: vendor.businessWebsite,
        verificationBadge: vendor.verificationBadge,
        joinDate: vendor.createdAt,
      } : null,
      availability: {
        blockedDates: blockedDates.filter((b) => b.isBlocked).map((b) => b.date),
        appointments: appointments.map((a) => ({
          startTime: a.startTime,
          endTime: a.endTime,
          label: a.label,
          source: a.source,
        })),
      },
      reviews: reviewsWithCustomers,
      createdAt: listing.createdAt,
    };

    if (user) {
      const favorite = await db.query.favorites.findFirst({
        where: (f, { eq: eqFn, and: andFn }) => andFn(eqFn(f.customerId, user.sub), eqFn(f.listingId, id)),
      });
      responseData.isFavorited = !!favorite;
    }

    return NextResponse.json({ data: responseData });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, id),
    });
    if (!listing) throw notFound("Listing");

    const vendorProfile = await db.query.vendorProfiles.findFirst({
      where: (vp) => eq(vp.userId, user.sub),
    });

    if (!vendorProfile || (vendorProfile.id !== listing.vendorId && user.role !== "admin")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You do not own this listing" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = listingUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const { amenities: amenityNames, eventTypes: eventTypeNames, ...updateData } = parsed.data;

    const dbUpdateData: Record<string, unknown> = { ...updateData };
    if (updateData.pricePerHour !== undefined) {
      dbUpdateData.pricePerHour = String(updateData.pricePerHour);
    }
    if (updateData.capacity !== undefined) {
      dbUpdateData.capacity = updateData.capacity;
    }

    const [updated] = await db
      .update(schema.listings)
      .set(dbUpdateData)
      .where(eq(schema.listings.id, id))
      .returning();

    if (amenityNames !== undefined) {
      await db.delete(schema.listingAmenities).where(eq(schema.listingAmenities.listingId, id));
      if (amenityNames.length > 0) {
        const existing = await db.select().from(schema.amenities).where(inArray(schema.amenities.name, amenityNames));
        const newNames = amenityNames.filter((n) => !existing.some((a) => a.name === n));
        let all = existing;
        if (newNames.length > 0) {
          const inserted = await db.insert(schema.amenities).values(newNames.map((n) => ({ name: n }))).returning();
          all = [...existing, ...inserted];
        }
        await db.insert(schema.listingAmenities).values(all.map((a) => ({ listingId: id, amenityId: a.id })));
      }
    }

    if (eventTypeNames !== undefined) {
      await db.delete(schema.listingEventTypes).where(eq(schema.listingEventTypes.listingId, id));
      if (eventTypeNames.length > 0) {
        const existing = await db.select().from(schema.eventTypes).where(inArray(schema.eventTypes.name, eventTypeNames));
        const newNames = eventTypeNames.filter((n) => !existing.some((e) => e.name === n));
        let all = existing;
        if (newNames.length > 0) {
          const inserted = await db.insert(schema.eventTypes).values(newNames.map((n) => ({ name: n }))).returning();
          all = [...existing, ...inserted];
        }
        await db.insert(schema.listingEventTypes).values(all.map((e) => ({ listingId: id, eventTypeId: e.id })));
      }
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, id),
    });
    if (!listing) throw notFound("Listing");

    const vendorProfile = await db.query.vendorProfiles.findFirst({
      where: (vp) => eq(vp.userId, user.sub),
    });

    if (!vendorProfile || (vendorProfile.id !== listing.vendorId && user.role !== "admin")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    await db.update(schema.listings)
      .set({ status: "paused" as const })
      .where(eq(schema.listings.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
