import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { handleApiError, notFound, validationError } from "@/lib/utils/errors";
import { inquiryStatusSchema } from "@/lib/validators/inquiry.schema";
import { eq, and } from "drizzle-orm";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["approved", "cancelled"],
  approved: ["proceed", "cancelled"],
  proceed: ["ongoing", "cancelled"],
  ongoing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const inquiry = await db.query.inquiries.findFirst({
      where: (i) => eq(i.id, id),
    });
    if (!inquiry) throw notFound("Inquiry");

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, inquiry.listingId),
    });

    const isOwner = user.role === "vendor" && listing?.vendorId === user.vendorId;
    const isCustomer = inquiry.customerId === user.sub;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isCustomer && !isAdmin) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    return NextResponse.json({ data: inquiry });
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
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const inquiry = await db.query.inquiries.findFirst({
      where: (i) => eq(i.id, id),
    });
    if (!inquiry) throw notFound("Inquiry");

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, inquiry.listingId),
    });

    const isOwner = user.role === "vendor" && listing?.vendorId === user.vendorId;
    const isCustomer = inquiry.customerId === user.sub;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isCustomer && !isAdmin) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const body = await request.json();
    const parsed = inquiryStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const newStatus = parsed.data.status;
    const allowed = STATUS_TRANSITIONS[inquiry.status] || [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: `Cannot transition from ${inquiry.status} to ${newStatus}. Allowed: ${allowed.join(", ")}`,
          },
        },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(schema.inquiries)
      .set({ status: newStatus })
      .where(eq(schema.inquiries.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
