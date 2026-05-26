import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { handleApiError } from "@/lib/utils/errors";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    if (!user || user.role !== "vendor") {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const vendorProfile = await db.query.vendorProfiles.findFirst({
      where: (vp) => eq(vp.userId, user.sub),
    });
    if (!vendorProfile) {
      return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    }

    const vendorListings = await db.query.listings.findMany({
      where: (l) => eq(l.vendorId, vendorProfile.id),
    });
    const listingIds = vendorListings.map((l) => l.id);

    if (listingIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const inquiries = await db.query.inquiries.findMany({
      where: (i, { inArray }) => inArray(i.listingId, listingIds),
      orderBy: (i, { desc }) => desc(i.createdAt),
    });

    return NextResponse.json({ data: inquiries });
  } catch (error) {
    return handleApiError(error);
  }
}
