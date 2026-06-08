import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/server";
import { handleApiError, notFound } from "@/lib/utils/errors";
import { eq } from "drizzle-orm";

export async function PUT(
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
