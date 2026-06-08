import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/server";
import { handleApiError } from "@/lib/utils/errors";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listingId = id;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ isFavorited: false });
    }

    const favorite = await db.query.favorites.findFirst({
      where: (f, { eq: eqFn, and: andFn }) => andFn(eqFn(f.customerId, user.id), eqFn(f.listingId, listingId)),
    });

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    return handleApiError(error);
  }
}
