import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { requireRole } from "@/lib/auth/server";
import { handleApiError } from "@/lib/utils/errors";
import { sql, eq, and, gte, lt, desc } from "drizzle-orm";

interface MonthlyBucket {
  month: string;
  bookings: number;
  revenue: number;
}

function startOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1));
}

function shortMonthLabel(d: Date): string {
  return d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / prev) * 100;
}

/**
 * GET /api/v1/admin/analytics
 *
 * Returns platform-wide booking and inquiry metrics derived from the live
 * database. Mock-flagged listings are excluded from joined queries; the
 * bookings and inquiries tables contain only real activity.
 */
export async function GET() {
  try {
    const userOrResp = await requireRole("admin");
    if (userOrResp instanceof NextResponse) return userOrResp;

    const now = new Date();
    const currentMonthStart = startOfMonth(now.getUTCFullYear(), now.getUTCMonth());
    const nextMonthStart = startOfMonth(now.getUTCFullYear(), now.getUTCMonth() + 1);
    const previousMonthStart = startOfMonth(now.getUTCFullYear(), now.getUTCMonth() - 1);

    // -- Current and previous month aggregates -------------------------------
    const [currMonth, prevMonth] = await Promise.all([
      db
        .select({
          count: sql<number>`count(*)::int`,
          revenue: sql<number>`coalesce(sum(${schema.bookings.totalAmount}), 0)::float`,
        })
        .from(schema.bookings)
        .where(
          and(
            gte(schema.bookings.eventDate, currentMonthStart.toISOString().slice(0, 10)),
            lt(schema.bookings.eventDate, nextMonthStart.toISOString().slice(0, 10))
          )
        ),
      db
        .select({
          count: sql<number>`count(*)::int`,
          revenue: sql<number>`coalesce(sum(${schema.bookings.totalAmount}), 0)::float`,
        })
        .from(schema.bookings)
        .where(
          and(
            gte(schema.bookings.eventDate, previousMonthStart.toISOString().slice(0, 10)),
            lt(schema.bookings.eventDate, currentMonthStart.toISOString().slice(0, 10))
          )
        ),
    ]);

    const currentBookings = currMonth[0]?.count ?? 0;
    const currentRevenue = currMonth[0]?.revenue ?? 0;
    const previousBookings = prevMonth[0]?.count ?? 0;
    const previousRevenue = prevMonth[0]?.revenue ?? 0;

    // Conversion rate uses inquiries created in the current month.
    const [currInquiries, prevInquiries] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.inquiries)
        .where(
          and(
            gte(schema.inquiries.createdAt, currentMonthStart),
            lt(schema.inquiries.createdAt, nextMonthStart)
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.inquiries)
        .where(
          and(
            gte(schema.inquiries.createdAt, previousMonthStart),
            lt(schema.inquiries.createdAt, currentMonthStart)
          )
        ),
    ]);

    const currInqCount = currInquiries[0]?.count ?? 0;
    const prevInqCount = prevInquiries[0]?.count ?? 0;
    const currConversion = currInqCount > 0 ? currentBookings / currInqCount : 0;
    const prevConversion = prevInqCount > 0 ? previousBookings / prevInqCount : 0;
    const currAvgValue = currentBookings > 0 ? currentRevenue / currentBookings : 0;
    const prevAvgValue = previousBookings > 0 ? previousRevenue / previousBookings : 0;

    // -- 7-month trend (chart) ----------------------------------------------
    const trend: MonthlyBucket[] = [];
    for (let i = 6; i >= 0; i--) {
      const ms = startOfMonth(now.getUTCFullYear(), now.getUTCMonth() - i);
      const me = startOfMonth(now.getUTCFullYear(), now.getUTCMonth() - i + 1);
      const [row] = await db
        .select({
          count: sql<number>`count(*)::int`,
          revenue: sql<number>`coalesce(sum(${schema.bookings.totalAmount}), 0)::float`,
        })
        .from(schema.bookings)
        .where(
          and(
            gte(schema.bookings.eventDate, ms.toISOString().slice(0, 10)),
            lt(schema.bookings.eventDate, me.toISOString().slice(0, 10))
          )
        );
      trend.push({
        month: shortMonthLabel(ms),
        bookings: row?.count ?? 0,
        revenue: row?.revenue ?? 0,
      });
    }

    // -- Bookings by event type (joins bookings -> inquiries) ---------------
    const eventTypeRows = await db
      .select({
        eventType: schema.inquiries.eventType,
        count: sql<number>`count(${schema.bookings.id})::int`,
      })
      .from(schema.bookings)
      .innerJoin(schema.inquiries, eq(schema.bookings.inquiryId, schema.inquiries.id))
      .groupBy(schema.inquiries.eventType);

    const totalEventTyped = eventTypeRows.reduce((s, r) => s + r.count, 0);
    const eventTypes = eventTypeRows
      .map((r) => ({
        category: r.eventType ?? "Unspecified",
        count: r.count,
        percentage:
          totalEventTyped > 0 ? Math.round((r.count / totalEventTyped) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // -- Top listings by bookings (excludes mock listings) ------------------
    const topListings = await db
      .select({
        id: schema.listings.id,
        title: schema.listings.title,
        currency: schema.listings.currency,
        bookings: sql<number>`count(${schema.bookings.id})::int`,
        revenue: sql<number>`coalesce(sum(${schema.bookings.totalAmount}), 0)::float`,
      })
      .from(schema.listings)
      .leftJoin(schema.bookings, eq(schema.bookings.listingId, schema.listings.id))
      .where(eq(schema.listings.isMock, false))
      .groupBy(schema.listings.id, schema.listings.title, schema.listings.currency)
      .orderBy(desc(sql`count(${schema.bookings.id})`))
      .limit(5);

    return NextResponse.json({
      data: {
        currentMonth: {
          revenue: currentRevenue,
          bookings: currentBookings,
          avgBookingValue: currAvgValue,
          conversionRate: currConversion,
          currency: "MYR",
          revenueChangePct: pctChange(currentRevenue, previousRevenue),
          bookingsChangePct: pctChange(currentBookings, previousBookings),
          avgValueChangePct: pctChange(currAvgValue, prevAvgValue),
          conversionChangePct: pctChange(currConversion, prevConversion),
        },
        trend,
        eventTypes,
        topListings: topListings.map((l) => ({
          id: l.id,
          title: l.title,
          bookings: l.bookings,
          revenue: l.revenue,
          currency: l.currency,
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
