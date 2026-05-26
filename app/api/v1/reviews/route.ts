import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { reviewCreateSchema } from "@/lib/validators/review.schema";
import { handleApiError, notFound, validationError, conflict } from "@/lib/utils/errors";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }
    if (user.role !== "customer") {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const body = await request.json();
    const parsed = reviewCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const { listingId, rating, comment } = parsed.data;

    const existing = await db.query.reviews.findFirst({
      where: (r, { eq: eqFn, and: andFn }) => andFn(eqFn(r.customerId, user.sub), eqFn(r.listingId, listingId)),
    });
    if (existing) {
      throw conflict("You have already reviewed this listing");
    }

    const listing = await db.query.listings.findFirst({
      where: (l) => eq(l.id, listingId),
    });
    if (!listing) throw notFound("Listing");

    const [review] = await db
      .insert(schema.reviews)
      .values({ customerId: user.sub, listingId, rating, comment: comment || null })
      .returning();

    const avgResult = await db
      .select({ avg: schema.reviews.rating })
      .from(schema.reviews)
      .where(eq(schema.reviews.listingId, listingId));

    const countResult = await db
      .select({ count: db.$count(schema.reviews) })
      .from(schema.reviews)
      .where(eq(schema.reviews.listingId, listingId));

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const listingId = url.searchParams.get("listingId");
    if (listingId) {
      const reviews = await db.query.reviews.findMany({
        where: (r) => eq(r.listingId, listingId),
        orderBy: (r, { desc }) => desc(r.createdAt),
        limit: 20,
      });
      return NextResponse.json({ data: reviews });
    }

    return NextResponse.json({ data: [] });
  } catch (error) {
    return handleApiError(error);
  }
}
