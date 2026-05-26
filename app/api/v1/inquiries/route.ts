import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { handleApiError, notFound, validationError } from "@/lib/utils/errors";
import { inquiryCreateSchema, inquiryStatusSchema } from "@/lib/validators/inquiry.schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const body = await request.json();
    const parsed = inquiryCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const { listingId, eventDate, eventTime, guestCount, eventType, specialRequirements } = parsed.data;

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, listingId),
    });
    if (!listing) throw notFound("Listing");

    const [inquiry] = await db
      .insert(schema.inquiries)
      .values({
        customerId: user.sub,
        listingId,
        eventDate,
        eventTime,
        guestCount,
        eventType: eventType || null,
        specialRequirements: specialRequirements || null,
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
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const inquiries = await db.query.inquiries.findMany({
      where: (i) => eq(i.customerId, user!.sub),
      orderBy: (i, { desc }) => desc(i.createdAt),
    });

    return NextResponse.json({ data: inquiries });
  } catch (error) {
    return handleApiError(error);
  }
}
