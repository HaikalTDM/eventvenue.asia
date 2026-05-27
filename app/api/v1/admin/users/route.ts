import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate, requireRole } from "@/lib/auth/middleware";
import { handleApiError, notFound } from "@/lib/utils/errors";
import { eq, and, ilike, type SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    const roleError = requireRole(user, "admin");
    if (roleError) return roleError;

    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const includeMock = url.searchParams.get("includeMock") === "true";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Hide seeded mock users from the production view by default. Pass
    // ?includeMock=true to inspect the demo data.
    const conditions: SQL[] = [];
    if (!includeMock) conditions.push(eq(schema.users.isMock, false));
    if (search) conditions.push(ilike(schema.users.name, `%${search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const total = await db.$count(schema.users, where);
    const users = await db
      .select()
      .from(schema.users)
      .where(where)
      .orderBy(schema.users.createdAt)
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
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
    const userId = url.searchParams.get("userId");
    const action = url.searchParams.get("action");

    if (!userId || !["suspend", "reactivate"].includes(action || "")) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(schema.users)
      .set({ isSuspended: action === "suspend" })
      .where(eq(schema.users.id, userId))
      .returning();

    if (!updated) throw notFound("User");

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
