import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/server";
import { handleApiError, notFound, validationError } from "@/lib/utils/errors";
import { inquiryCreateSchema } from "@/lib/validators/inquiry.schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const userOrResp = await requireRole("customer");
    if (userOrResp instanceof NextResponse) return userOrResp;
    const user = userOrResp;

    const body = await request.json();
    const parsed = inquiryCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const { listingId, eventDate, eventTime, guestCount, eventType, specialRequirements, totalPrice } = parsed.data;

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, listingId),
    });
    if (!listing) throw notFound("Listing");

    const [inquiry] = await db
      .insert(schema.inquiries)
      .values({
        customerId: user.id,
        listingId,
        eventDate,
        eventTime,
        guestCount,
        eventType: eventType || null,
        specialRequirements: specialRequirements || null,
        totalPrice: totalPrice != null ? String(totalPrice) : null,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ data: inquiry }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const userOrResp = await requireRole("customer");
    if (userOrResp instanceof NextResponse) return userOrResp;
    const user = userOrResp;

    const inquiries = await db.query.inquiries.findMany({
      where: (i) => eq(i.customerId, user.id),
      orderBy: (i, { desc }) => desc(i.createdAt),
    });

    const listingIds = [...new Set(inquiries.map((i) => i.listingId))];
    const listings = listingIds.length > 0
      ? await db.query.listings.findMany({
          where: (l, { inArray }) => inArray(l.id, listingIds),
        })
      : [];

    const primaryPhotos = listingIds.length > 0
      ? await db.query.listingPhotos.findMany({
          where: (p, { inArray, and, eq }) =>
            and(inArray(p.listingId, listingIds), eq(p.isPrimary, true)),
        })
      : [];

    const listingMap = new Map(listings.map((l) => [l.id, l]));
    const photoMap = new Map(primaryPhotos.map((p) => [p.listingId, p]));

    const data = inquiries.map((inquiry) => {
      const listing = listingMap.get(inquiry.listingId);
      const primaryPhoto = photoMap.get(inquiry.listingId);
      return {
        ...inquiry,
        listing: listing
          ? {
              id: listing.id,
              title: listing.title,
              slug: listing.slug,
              location: listing.location,
              primaryPhoto: primaryPhoto ? { url: primaryPhoto.url } : null,
            }
          : undefined,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
