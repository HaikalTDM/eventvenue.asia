import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/server";
import { handleApiError, notFound } from "@/lib/utils/errors";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const userOrResp = await requireRole("vendor");
    if (userOrResp instanceof NextResponse) return userOrResp;
    const user = userOrResp;

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, listingId),
    });
    if (!listing) throw notFound("Listing");
    if (listing.vendorId !== user.vendorId) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const body = await request.json();
    const { startTime, endTime, label, source } = body;

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "startTime and endTime required" } },
        { status: 400 }
      );
    }

    const [slot] = await db
      .insert(schema.availabilitySlots)
      .values({
        listingId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        label: label || null,
        source: source || null,
      })
      .returning();

    return NextResponse.json({ data: slot }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
