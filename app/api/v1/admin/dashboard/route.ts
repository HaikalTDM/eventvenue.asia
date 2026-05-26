import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";
import { handleApiError } from "@/lib/utils/errors";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticate(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    // Counts exclude seeded mock rows (isMock=true) so admins see real
    // production activity. The mock data stays in the DB as a demo
    // safety net but is hidden from production-facing views.
    const [userCount, vendorCount, listingCount, pendingVendorCount, bookingCount] = await Promise.all([
      db.$count(schema.users, eq(schema.users.isMock, false)),
      db.$count(schema.vendorProfiles, eq(schema.vendorProfiles.isMock, false)),
      db.$count(schema.listings, eq(schema.listings.isMock, false)),
      db.$count(
        schema.vendorProfiles,
        and(
          eq(schema.vendorProfiles.verificationStatus, "pending"),
          eq(schema.vendorProfiles.isMock, false)
        )!
      ),
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
