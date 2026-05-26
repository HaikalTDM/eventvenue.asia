import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { handleApiError, notFound } from "@/lib/utils/errors";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, id),
    });
    if (!listing) throw notFound("Listing");

    const vendorProfile = await db.query.vendorProfiles.findFirst({
      where: (vp) => eq(vp.userId, user.sub),
    });

    if (!vendorProfile || (vendorProfile.id !== listing.vendorId && user.role !== "admin")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const newStatus = body.status as string;
    if (!["active", "paused", "draft"].includes(newStatus)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid status. Must be active, paused, or draft" } },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(schema.listings)
      .set({ status: newStatus as "active" | "paused" | "draft" })
      .where(eq(schema.listings.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
