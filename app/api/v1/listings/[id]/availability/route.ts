import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { handleApiError, notFound, validationError } from "@/lib/utils/errors";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;

    const blocks = await db.query.availabilityBlocks.findMany({
      where: (b) => eq(b.listingId, listingId),
      orderBy: (b) => b.date,
    });

    const slots = await db.query.availabilitySlots.findMany({
      where: (s) => eq(s.listingId, listingId),
      orderBy: (s) => s.startTime,
    });

    return NextResponse.json({
      data: {
        blockedDates: blocks.filter((b) => b.isBlocked).map((b) => b.date),
        slots,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const { user } = await authenticate(request);
    if (!user || user.role !== "vendor") {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, listingId),
    });
    if (!listing) throw notFound("Listing");
    if (listing.vendorId !== user.vendorId) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const body = await request.json();
    const action = body.action as string;
    const dates = body.dates as string[];

    if (!["block", "unblock"].includes(action)) {
      throw validationError([{
        field: "action",
        message: "action must be 'block' or 'unblock'",
      }]);
    }
    if (!Array.isArray(dates) || dates.length === 0) {
      throw validationError([{
        field: "dates",
        message: "dates must be a non-empty array of YYYY-MM-DD strings",
      }]);
    }

    for (const date of dates) {
      await db
        .insert(schema.availabilityBlocks)
        .values({
          listingId,
          date,
          isBlocked: action === "block",
        })
        .onConflictDoUpdate({
          target: [schema.availabilityBlocks.listingId, schema.availabilityBlocks.date],
          set: { isBlocked: action === "block" },
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
