import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/server";
import { handleApiError } from "@/lib/utils/errors";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const userOrResp = await requireRole("vendor");
    if (userOrResp instanceof NextResponse) return userOrResp;
    const user = userOrResp;

    const vendorProfile = await db.query.vendorProfiles.findFirst({
      where: (vp) => eq(vp.userId, user.id),
    });

    if (!vendorProfile) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Vendor profile not found" } },
        { status: 404 }
      );
    }

    const vendorUser = await db.query.users.findFirst({
      where: (u) => eq(u.id, user.id),
    });

    const documents = await db.query.vendorDocuments.findMany({
      where: (d) => eq(d.vendorId, vendorProfile.id),
    });

    return NextResponse.json({
      data: {
        ...vendorProfile,
        email: vendorUser?.email,
        phone: vendorUser?.phone,
        name: vendorUser?.name,
        documents,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userOrResp = await requireRole("vendor");
    if (userOrResp instanceof NextResponse) return userOrResp;
    const user = userOrResp;

    const vendorProfile = await db.query.vendorProfiles.findFirst({
      where: (vp) => eq(vp.userId, user.id),
    });
    if (!vendorProfile) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Vendor profile not found" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      "businessName", "businessDescription", "businessWebsite",
      "businessLocation", "serviceCategory",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ data: vendorProfile });
    }

    const [updated] = await db
      .update(schema.vendorProfiles)
      .set(updates)
      .where(eq(schema.vendorProfiles.id, vendorProfile.id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
