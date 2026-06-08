import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/server";
import { handleApiError } from "@/lib/utils/errors";
import { eq } from "drizzle-orm";

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

    const bookings = await db.query.bookings.findMany({
      where: (b, { inArray }) => inArray(b.listingId, listingIds),
      orderBy: (b, { desc }) => desc(b.createdAt),
    });

    return NextResponse.json({ data: bookings });
  } catch (error) {
    return handleApiError(error);
  }
}
