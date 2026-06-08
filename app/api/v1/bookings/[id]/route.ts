import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth/server";
import { bookingServiceSchema, bookingStatusSchema } from "@/lib/validators/booking.schema";
import { handleApiError, notFound, validationError } from "@/lib/utils/errors";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userOrResp = await requireUser();
    if (userOrResp instanceof NextResponse) return userOrResp;
    const user = userOrResp;

    const booking = await db.query.bookings.findFirst({
      where: (b) => eq(b.id, id),
    });
    if (!booking) throw notFound("Booking");

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, booking.listingId),
    });
    const isCustomer = booking.customerId === user.id;
    const isVendorOwner = listing?.vendorId === user.vendorId;
    const isAdmin = user.role === "admin";

    if (!isCustomer && !isVendorOwner && !isAdmin) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    return NextResponse.json({ data: booking });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userOrResp = await requireRole("customer");
    if (userOrResp instanceof NextResponse) return userOrResp;
    const user = userOrResp;

    const booking = await db.query.bookings.findFirst({
      where: (b) => eq(b.id, id),
    });
    if (!booking) throw notFound("Booking");
    if (booking.customerId !== user.id) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const body = await request.json();
    if (!Array.isArray(body.services)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "services must be an array" } },
        { status: 400 }
      );
    }

    for (const service of body.services) {
      const parsed = bookingServiceSchema.safeParse(service);
      if (parsed.success) {
        await db.insert(schema.bookingServices).values({
          bookingId: id,
          serviceListingId: parsed.data.serviceListingId,
          packageId: parsed.data.packageId || null,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userOrResp = await requireRole("vendor");
    if (userOrResp instanceof NextResponse) return userOrResp;
    const user = userOrResp;

    const booking = await db.query.bookings.findFirst({
      where: (b) => eq(b.id, id),
    });
    if (!booking) throw notFound("Booking");

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, booking.listingId),
    });
    if (listing?.vendorId !== user.vendorId) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const body = await request.json();
    const parsed = bookingStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const [updated] = await db
      .update(schema.bookings)
      .set({ status: parsed.data.status })
      .where(eq(schema.bookings.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
