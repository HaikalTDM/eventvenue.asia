import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/server";
import { handleApiError } from "@/lib/utils/errors";
import { eq, inArray, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const userOrResp = await requireRole("vendor");
    if (userOrResp instanceof NextResponse) return userOrResp;
    const user = userOrResp;

    if (!user.vendorId) {
      return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    }

    const vendorListings = await db.query.listings.findMany({
      where: (l) => eq(l.vendorId, user.vendorId!),
    });
    const listingIds = vendorListings.map((l) => l.id);

    if (listingIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const inquiries = await db.query.inquiries.findMany({
      where: (i, { inArray }) => inArray(i.listingId, listingIds),
      orderBy: (i, { desc }) => desc(i.createdAt),
    });

    const allListingIds = [...new Set(inquiries.map((i) => i.listingId))];
    const allCustomerIds = [...new Set(inquiries.map((i) => i.customerId))];

    const [listings, primaryPhotos, customers] = await Promise.all([
      allListingIds.length > 0
        ? db.query.listings.findMany({
            where: (l, { inArray }) => inArray(l.id, allListingIds),
          })
        : [],
      allListingIds.length > 0
        ? db.query.listingPhotos.findMany({
            where: (p, { inArray, and, eq }) =>
              and(inArray(p.listingId, allListingIds), eq(p.isPrimary, true)),
          })
        : [],
      allCustomerIds.length > 0
        ? db.query.users.findMany({
            where: (u, { inArray }) => inArray(u.id, allCustomerIds),
          })
        : [],
    ]);

    const listingMap = new Map(listings.map((l) => [l.id, l]));
    const photoMap = new Map(primaryPhotos.map((p) => [p.listingId, p]));
    const customerMap = new Map(customers.map((c) => [c.id, c]));

    const data = inquiries.map((inquiry) => {
      const listing = listingMap.get(inquiry.listingId);
      const primaryPhoto = photoMap.get(inquiry.listingId);
      const customer = customerMap.get(inquiry.customerId);
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
        customer: customer
          ? {
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
            }
          : undefined,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
