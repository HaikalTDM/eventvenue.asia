import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/server";
import { handleApiError, notFound, validationError } from "@/lib/utils/errors";
import { eq, inArray } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userOrResp = await requireRole(["vendor", "admin"]);
    if (userOrResp instanceof NextResponse) return userOrResp;
    const user = userOrResp;

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, id),
    });
    if (!listing) throw notFound("Listing");

    const vendorProfile = await db.query.vendorProfiles.findFirst({
      where: (vp) => eq(vp.userId, user.id),
    });
    if (!vendorProfile || (vendorProfile.id !== listing.vendorId && user.role !== "admin")) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const body = await request.json();
    const names = body.amenities as string[];
    if (!Array.isArray(names)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "amenities must be an array of strings" } },
        { status: 400 }
      );
    }

    await db.delete(schema.listingAmenities).where(eq(schema.listingAmenities.listingId, id));

    if (names.length > 0) {
      const existing = await db.select().from(schema.amenities).where(inArray(schema.amenities.name, names));
      const newNames = names.filter((n) => !existing.some((a) => a.name === n));
      let all = existing;
      if (newNames.length > 0) {
        const inserted = await db.insert(schema.amenities).values(newNames.map((n) => ({ name: n }))).returning();
        all = [...existing, ...inserted];
      }
      await db.insert(schema.listingAmenities).values(all.map((a) => ({ listingId: id, amenityId: a.id })));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
