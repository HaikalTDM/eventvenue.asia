import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { bookingCreateSchema, bookingServiceSchema, bookingStatusSchema } from "@/lib/validators/booking.schema";
import { handleApiError, notFound, validationError, conflict } from "@/lib/utils/errors";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }
    if (user.role !== "customer") {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const body = await request.json();
    const parsed = bookingCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const { listingId, inquiryId, eventDate, startTime, endTime, guestCount, totalAmount } = parsed.data;

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, listingId),
    });
    if (!listing) throw notFound("Listing");

    const [booking] = await db
      .insert(schema.bookings)
      .values({
        customerId: user.sub,
        listingId,
        inquiryId: inquiryId || null,
        eventDate,
        startTime,
        endTime,
        guestCount,
        totalAmount: String(totalAmount),
        status: "pending",
      })
      .returning();

    const vendorProfile = await db.query.vendorProfiles.findFirst({
      where: (vp) => eq(vp.id, listing.vendorId),
    });

    if (vendorProfile) {
      const [conversation] = await db
        .insert(schema.conversations)
        .values({
          type: "direct",
          title: listing.title,
          bookingId: booking.id,
        })
        .returning();

      await db.insert(schema.conversationParticipants).values([
        { conversationId: conversation.id, userId: user.sub },
        { conversationId: conversation.id, userId: vendorProfile.userId },
      ]);
    }

    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const bookings = await db.query.bookings.findMany({
      where: (b) => eq(b.customerId, user!.sub),
      orderBy: (b, { desc }) => desc(b.createdAt),
    });

    return NextResponse.json({ data: bookings });
  } catch (error) {
    return handleApiError(error);
  }
}
