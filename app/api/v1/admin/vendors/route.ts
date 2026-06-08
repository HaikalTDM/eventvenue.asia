import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/server";
import { handleApiError, notFound } from "@/lib/utils/errors";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const userOrResp = await requireRole("admin");
    if (userOrResp instanceof NextResponse) return userOrResp;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const includeMock = url.searchParams.get("includeMock") === "true";

    const conditions = [];
    if (!includeMock) conditions.push(eq(schema.vendorProfiles.isMock, false));
    if (status) conditions.push(eq(schema.vendorProfiles.verificationStatus, status as "pending" | "approved" | "rejected"));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const vendors = await db
      .select({
        id: schema.vendorProfiles.id,
        vendorType: schema.vendorProfiles.vendorType,
        businessName: schema.vendorProfiles.businessName,
        businessLocation: schema.vendorProfiles.businessLocation,
        verificationStatus: schema.vendorProfiles.verificationStatus,
        verificationBadge: schema.vendorProfiles.verificationBadge,
        createdAt: schema.vendorProfiles.createdAt,
        userId: schema.users.id,
        userName: schema.users.name,
        userEmail: schema.users.email,
      })
      .from(schema.vendorProfiles)
      .innerJoin(schema.users, eq(schema.vendorProfiles.userId, schema.users.id))
      .where(where)
      .orderBy(desc(schema.vendorProfiles.createdAt))
      .limit(50);

    return NextResponse.json({ data: vendors });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userOrResp = await requireRole("admin");
    if (userOrResp instanceof NextResponse) return userOrResp;

    const url = new URL(request.url);
    const vendorId = url.searchParams.get("vendorId");
    const action = url.searchParams.get("action");

    if (!vendorId || !["approve", "reject"].includes(action || "")) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "vendorId and action (approve|reject) required" } },
        { status: 400 }
      );
    }

    const vendor = await db.query.vendorProfiles.findFirst({
      where: (vp) => eq(vp.id, vendorId!),
    });
    if (!vendor) throw notFound("Vendor");

    if (action === "approve") {
      await db.update(schema.vendorProfiles)
        .set({ verificationStatus: "approved", verificationBadge: "verified" })
        .where(eq(schema.vendorProfiles.id, vendorId));
      await db.update(schema.users)
        .set({ isVerified: true, isSuspended: false, suspendedReason: null })
        .where(eq(schema.users.id, vendor.userId));
    } else {
      const body = await request.json().catch(() => ({}));
      const reason = typeof body?.reason === "string" ? body.reason : null;
      await db.update(schema.vendorProfiles)
        .set({ verificationStatus: "rejected" })
        .where(eq(schema.vendorProfiles.id, vendorId));
      // Suspend the user account so the rejected vendor cannot reach
      // /vendor/dashboard or any authenticated route. The next /auth/session
      // poll (or any new sign-in) will be rejected.
      await db.update(schema.users)
        .set({
          isSuspended: true,
          suspendedReason: reason || "Vendor application was rejected.",
        })
        .where(eq(schema.users.id, vendor.userId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
