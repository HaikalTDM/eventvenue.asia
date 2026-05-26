import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { handleApiError, notFound } from "@/lib/utils/errors";
import { eq, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    let baseQuery = db.select().from(schema.users);
    if (search) {
      baseQuery = baseQuery.where(
        ilike(schema.users.name, `%${search}%`)
      ) as typeof baseQuery;
    }

    const total = await db.$count(schema.users);
    const users = await baseQuery
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
