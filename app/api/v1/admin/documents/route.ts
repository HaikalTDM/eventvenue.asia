import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray, desc, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/server";
import { handleApiError, notFound } from "@/lib/utils/errors";

/**
 * GET /api/v1/admin/documents
 *
 * Lists vendor verification documents with the vendor's business name
 * and contact email so an admin can review without leaving the page.
 *
 * Query params:
 *   status   - "pending" | "approved" | "rejected" | "all" (default "pending")
 *   limit    - default 50, max 100
 */
export async function GET(request: NextRequest) {
  try {
    const userOrResp = await requireRole("admin");
    if (userOrResp instanceof NextResponse) return userOrResp;

    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "pending";
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1),
      100
    );

    const conditions: SQL[] = [];
    if (status === "pending" || status === "approved" || status === "rejected") {
      conditions.push(eq(schema.vendorDocuments.status, status));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const docs = await db
      .select()
      .from(schema.vendorDocuments)
      .where(where)
      .orderBy(desc(schema.vendorDocuments.createdAt))
      .limit(limit);

    if (docs.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Resolve vendor + user info in two batches.
    const vendorIds = [...new Set(docs.map((d) => d.vendorId))];
    const vendors = await db
      .select({
        id: schema.vendorProfiles.id,
        userId: schema.vendorProfiles.userId,
        businessName: schema.vendorProfiles.businessName,
      })
      .from(schema.vendorProfiles)
      .where(inArray(schema.vendorProfiles.id, vendorIds));
    const vendorMap = new Map(vendors.map((v) => [v.id, v]));

    const userIds = [...new Set(vendors.map((v) => v.userId))];
    const users =
      userIds.length > 0
        ? await db
            .select({
              id: schema.users.id,
              name: schema.users.name,
              email: schema.users.email,
            })
            .from(schema.users)
            .where(inArray(schema.users.id, userIds))
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = docs.map((d) => {
      const vendor = vendorMap.get(d.vendorId);
      const owner = vendor ? userMap.get(vendor.userId) : null;
      return {
        id: d.id,
        docType: d.docType,
        fileUrl: d.fileUrl,
        status: d.status,
        rejectReason: d.rejectReason,
        createdAt: d.createdAt,
        reviewedAt: d.reviewedAt,
        vendor: vendor
          ? {
              id: vendor.id,
              businessName: vendor.businessName,
              ownerName: owner?.name ?? null,
              ownerEmail: owner?.email ?? null,
            }
          : null,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/v1/admin/documents?docId=...&action=approve|reject
 * Optional body: { reason?: string }   (used only with action=reject)
 *
 * Marks the document approved or rejected, stamps reviewedBy with the
 * acting admin and reviewedAt with the current timestamp. Reject also
 * stores the supplied reason.
 */
export async function PUT(request: NextRequest) {
  try {
    const userOrResp = await requireRole("admin");
    if (userOrResp instanceof NextResponse) return userOrResp;
    const user = userOrResp;

    const url = new URL(request.url);
    const docId = url.searchParams.get("docId");
    const action = url.searchParams.get("action");
    if (!docId || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "docId and action=approve|reject are required",
          },
        },
        { status: 400 }
      );
    }

    const doc = await db.query.vendorDocuments.findFirst({
      where: (d, { eq: e }) => e(d.id, docId),
    });
    if (!doc) throw notFound("Document");

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason : null;

    await db
      .update(schema.vendorDocuments)
      .set({
        status: action === "approve" ? "approved" : "rejected",
        rejectReason: action === "reject" ? reason || "Rejected" : null,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      })
      .where(eq(schema.vendorDocuments.id, docId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
