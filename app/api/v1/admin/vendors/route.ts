import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { handleApiError, notFound } from "@/lib/utils/errors";
import { eq, desc, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    let conditions = [];
    if (status) conditions.push(eq(schema.vendorProfiles.verificationStatus, status as "pending" | "approved" | "rejected"));

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
      .where(conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : undefined) : undefined)
      .orderBy(desc(schema.vendorProfiles.createdAt))
      .limit(50);

    return NextResponse.json({ data: vendors });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

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
        .set({ isVerified: true })
        .where(eq(schema.users.id, vendor.userId));
    } else {
      const body = await request.json().catch(() => ({}));
      await db.update(schema.vendorProfiles)
        .set({ verificationStatus: "rejected" })
        .where(eq(schema.vendorProfiles.id, vendorId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
