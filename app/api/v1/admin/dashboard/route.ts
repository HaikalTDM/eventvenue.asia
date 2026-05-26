import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { handleApiError, notFound } from "@/lib/utils/errors";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const [userCount, vendorCount, listingCount, pendingVendorCount, bookingCount] = await Promise.all([
      db.$count(schema.users),
      db.$count(schema.vendorProfiles),
      db.$count(schema.listings),
      db.$count(schema.vendorProfiles, eq(schema.vendorProfiles.verificationStatus, "pending")),
      db.$count(schema.bookings),
    ]);

    return NextResponse.json({
      data: {
        users: userCount,
        vendors: vendorCount,
        listings: listingCount,
        pendingVendors: pendingVendorCount,
        bookings: bookingCount,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
