import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { handleApiError } from "@/lib/utils/errors";
import { eq, and, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const favorites = await db.query.favorites.findMany({
      where: (f) => eq(f.customerId, user!.sub),
      orderBy: (f, { desc }) => desc(f.createdAt),
    });

    const listingIds = favorites.map((f) => f.listingId);
    if (listingIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const listings = await db.query.listings.findMany({
      where: (l, { inArray }) => inArray(l.id, listingIds),
    });

    return NextResponse.json({ data: listings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const { listingId } = await request.json();
    if (!listingId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "listingId is required" } },
        { status: 400 }
      );
    }

    await db
      .insert(schema.favorites)
      .values({ customerId: user.sub, listingId })
      .onConflictDoNothing();

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const url = new URL(request.url);
    const listingId = url.searchParams.get("listingId");
    if (!listingId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "listingId query param required" } },
        { status: 400 }
      );
    }

    await db
      .delete(schema.favorites)
      .where(
        and(
          eq(schema.favorites.customerId, user.sub),
          eq(schema.favorites.listingId, listingId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
