import "server-only";

import { and, desc, eq, gte, inArray, lt, sql, type SQL } from "drizzle-orm";

import { db, schema } from "@/lib/db";

/**
 * Admin query module. Read-only and write paths used exclusively by the
 * admin console: dashboard counts, monthly analytics, the moderation
 * queue (content flags), and flag resolution. Mock-flag handling is
 * specific to each query — counts exclude `is_mock=true` rows so the
 * dashboard reflects real production activity, but bookings (which
 * carry no mock flag of their own) are counted as-is.
 *
 * Why this exists:
 *   - Centralises the dashboard count shape so the dashboard route and
 *     any future admin landing page see identical numbers.
 *   - `getMonthlyAnalytics` is a faithful port of the analytics route
 *     handler — same buckets, same shape — so swapping the route over
 *     to call this module is a one-line change with no UI delta.
 *   - `listFlags` does the polymorphic target-preview lookup once, in
 *     one place, so the moderation queue UI can render review/listing/
 *     message previews without a per-row round trip.
 *   - `resolveFlag` wraps the flag mutation and the optional content
 *     mutation (clearing a review's comment, pausing a listing,
 *     redacting a message) in one transaction.
 *
 * Pure data-access: every caller has already passed `requireRole("admin")`
 * by the time they get here.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type DashboardStats = {
  users: number;
  vendors: number;
  listings: number;
  pendingVendors: number;
  bookings: number;
};

export type MonthlyBucket = {
  month: string;
  bookings: number;
  revenue: number;
};

export type CurrentMonthStats = {
  revenue: number;
  bookings: number;
  avgBookingValue: number;
  conversionRate: number;
  currency: "MYR";
  revenueChangePct: number | null;
  bookingsChangePct: number | null;
  avgValueChangePct: number | null;
  conversionChangePct: number | null;
};

export type EventTypeBreakdown = {
  category: string;
  count: number;
  percentage: number;
};

export type TopListingRow = {
  id: string;
  title: string;
  bookings: number;
  revenue: number;
  currency: string;
};

export type MonthlyAnalytics = {
  currentMonth: CurrentMonthStats;
  previousMonth: { bookings: number; revenue: number };
  trend7Months: MonthlyBucket[];
  eventTypeBreakdown: EventTypeBreakdown[];
  topListings: TopListingRow[];
};

export type FlagStatus = "pending" | "resolved" | "all";

export type FlagListItem = {
  id: string;
  type: "review" | "listing" | "message";
  targetId: string;
  targetTitle: string | null;
  targetPreview: string;
  flagReason: string;
  status: "pending" | "resolved";
  flaggedBy: { id: string | null; name: string; email: string | null };
  createdAt: Date;
  resolvedAt: Date | null;
};

// ─── Local helpers (kept here per spec) ─────────────────────────────────────

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

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

/**
 * Returns the admin dashboard's headline counts. Excludes mock-flagged
 * users/vendors/listings; bookings are counted as-is because that table
 * has no `is_mock` column.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [users, vendors, listings, pendingVendors, bookings] = await Promise.all([
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

  return { users, vendors, listings, pendingVendors, bookings };
}

// ─── Monthly analytics ──────────────────────────────────────────────────────

/**
 * Returns the platform-wide monthly analytics shape: current-month KPIs
 * with month-over-month deltas, the previous month's baseline, a
 * 7-month trend for the chart, an event-type breakdown, and the top
 * five listings by bookings. Mirrors the legacy
 * `app/api/v1/admin/analytics/route.ts` payload exactly — moving that
 * route to this module is intended to be a no-op for clients.
 */
export async function getMonthlyAnalytics(now: Date): Promise<MonthlyAnalytics> {
  const currentMonthStart = startOfMonth(now.getUTCFullYear(), now.getUTCMonth());
  const nextMonthStart = startOfMonth(now.getUTCFullYear(), now.getUTCMonth() + 1);
  const previousMonthStart = startOfMonth(now.getUTCFullYear(), now.getUTCMonth() - 1);

  const [currMonth, prevMonth] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${schema.bookings.totalAmount}), 0)::float`,
      })
      .from(schema.bookings)
      .where(
        and(
          gte(schema.bookings.eventDate, isoDate(currentMonthStart)),
          lt(schema.bookings.eventDate, isoDate(nextMonthStart))
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
          gte(schema.bookings.eventDate, isoDate(previousMonthStart)),
          lt(schema.bookings.eventDate, isoDate(currentMonthStart))
        )
      ),
  ]);

  const currentBookings = currMonth[0]?.count ?? 0;
  const currentRevenue = currMonth[0]?.revenue ?? 0;
  const previousBookings = prevMonth[0]?.count ?? 0;
  const previousRevenue = prevMonth[0]?.revenue ?? 0;

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

  // 7-month trend.
  const trend7Months: MonthlyBucket[] = [];
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
          gte(schema.bookings.eventDate, isoDate(ms)),
          lt(schema.bookings.eventDate, isoDate(me))
        )
      );
    trend7Months.push({
      month: shortMonthLabel(ms),
      bookings: row?.count ?? 0,
      revenue: row?.revenue ?? 0,
    });
  }

  // Event-type breakdown (bookings -> inquiries).
  const eventTypeRows = await db
    .select({
      eventType: schema.inquiries.eventType,
      count: sql<number>`count(${schema.bookings.id})::int`,
    })
    .from(schema.bookings)
    .innerJoin(schema.inquiries, eq(schema.bookings.inquiryId, schema.inquiries.id))
    .groupBy(schema.inquiries.eventType);

  const totalEventTyped = eventTypeRows.reduce((s, r) => s + r.count, 0);
  const eventTypeBreakdown: EventTypeBreakdown[] = eventTypeRows
    .map((r) => ({
      category: r.eventType ?? "Unspecified",
      count: r.count,
      percentage:
        totalEventTyped > 0 ? Math.round((r.count / totalEventTyped) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Top listings by bookings.
  const topListingsRows = await db
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

  return {
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
    previousMonth: {
      bookings: previousBookings,
      revenue: previousRevenue,
    },
    trend7Months,
    eventTypeBreakdown,
    topListings: topListingsRows.map((l) => ({
      id: l.id,
      title: l.title,
      bookings: l.bookings,
      revenue: l.revenue,
      currency: l.currency,
    })),
  };
}

// ─── Moderation queue ──────────────────────────────────────────────────────

/**
 * Lists content flags for the moderation queue with target previews and
 * the flagger's user info already joined in. The polymorphic
 * `(targetType, targetId)` pointer is resolved into one of three preview
 * shapes so the UI doesn't need to know about the underlying tables.
 *
 * Status filter: "pending" (default), "resolved", or "all".
 */
export async function listFlags(opts: {
  status?: FlagStatus;
  limit?: number;
} = {}): Promise<FlagListItem[]> {
  const { status = "pending", limit = 50 } = opts;

  const conditions: SQL[] = [];
  if (status === "pending" || status === "resolved") {
    conditions.push(eq(schema.contentFlags.status, status));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const flags = await db
    .select()
    .from(schema.contentFlags)
    .where(where)
    .orderBy(desc(schema.contentFlags.createdAt))
    .limit(limit);

  if (flags.length === 0) return [];

  // Resolve flagger user names in one batch.
  const flaggerIds = [
    ...new Set(flags.map((f) => f.flaggerId).filter((x): x is string => !!x)),
  ];
  const flaggers =
    flaggerIds.length > 0
      ? await db
          .select({
            id: schema.users.id,
            name: schema.users.name,
            email: schema.users.email,
          })
          .from(schema.users)
          .where(inArray(schema.users.id, flaggerIds))
      : [];
  const flaggerMap = new Map(flaggers.map((f) => [f.id, f]));

  // Resolve target preview content per type. Three small batched queries.
  const reviewIds = flags.filter((f) => f.targetType === "review").map((f) => f.targetId);
  const listingIds = flags.filter((f) => f.targetType === "listing").map((f) => f.targetId);
  const messageIds = flags.filter((f) => f.targetType === "message").map((f) => f.targetId);

  const [reviews, listings, messages] = await Promise.all([
    reviewIds.length > 0
      ? db
          .select({
            id: schema.reviews.id,
            comment: schema.reviews.comment,
            rating: schema.reviews.rating,
            listingId: schema.reviews.listingId,
          })
          .from(schema.reviews)
          .where(inArray(schema.reviews.id, reviewIds))
      : Promise.resolve(
          [] as Array<{ id: string; comment: string | null; rating: number; listingId: string }>
        ),
    listingIds.length > 0
      ? db
          .select({
            id: schema.listings.id,
            title: schema.listings.title,
            slug: schema.listings.slug,
          })
          .from(schema.listings)
          .where(inArray(schema.listings.id, listingIds))
      : Promise.resolve([] as Array<{ id: string; title: string; slug: string }>),
    messageIds.length > 0
      ? db
          .select({
            id: schema.messages.id,
            content: schema.messages.content,
            senderId: schema.messages.senderId,
          })
          .from(schema.messages)
          .where(inArray(schema.messages.id, messageIds))
      : Promise.resolve([] as Array<{ id: string; content: string; senderId: string }>),
  ]);

  const reviewMap = new Map(reviews.map((r) => [r.id, r]));
  const listingMap = new Map(listings.map((l) => [l.id, l]));
  const messageMap = new Map(messages.map((m) => [m.id, m]));

  return flags.map((f) => {
    let targetPreview = "";
    let targetTitle: string | null = null;
    if (f.targetType === "review") {
      const r = reviewMap.get(f.targetId);
      targetPreview = r?.comment ?? "(review removed)";
      targetTitle = r ? `${r.rating}\u2605 review` : null;
    } else if (f.targetType === "listing") {
      const l = listingMap.get(f.targetId);
      targetPreview = l?.title ?? "(listing removed)";
      targetTitle = l?.title ?? null;
    } else if (f.targetType === "message") {
      const m = messageMap.get(f.targetId);
      targetPreview = m?.content ?? "(message removed)";
      targetTitle = "Direct message";
    }

    const flagger = f.flaggerId ? flaggerMap.get(f.flaggerId) : null;

    return {
      id: f.id,
      type: f.targetType,
      targetId: f.targetId,
      targetTitle,
      targetPreview,
      flagReason: f.flagReason,
      status: f.status,
      flaggedBy: flagger
        ? { id: flagger.id, name: flagger.name, email: flagger.email }
        : { id: null, name: "System", email: null },
      createdAt: f.createdAt,
      resolvedAt: f.resolvedAt,
    };
  });
}

/**
 * Resolves or dismisses a flag.
 *   - "resolve" takes action against the flagged content (clears a
 *     review's comment, pauses a listing, redacts a message) and then
 *     marks the flag resolved.
 *   - "dismiss" leaves the flagged content untouched and just marks
 *     the flag resolved.
 *
 * Both paths run inside one transaction and stamp `resolvedBy` /
 * `resolvedAt` with the actor and current timestamp. Returns true on
 * success, false if the flag id was not found.
 */
export async function resolveFlag(
  flagId: string,
  action: "resolve" | "dismiss",
  actorId: string
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [flag] = await tx
      .select()
      .from(schema.contentFlags)
      .where(eq(schema.contentFlags.id, flagId))
      .limit(1);
    if (!flag) return false;

    if (action === "resolve") {
      if (flag.targetType === "review") {
        await tx
          .update(schema.reviews)
          .set({ comment: null })
          .where(eq(schema.reviews.id, flag.targetId));
      } else if (flag.targetType === "listing") {
        await tx
          .update(schema.listings)
          .set({ status: "paused" })
          .where(eq(schema.listings.id, flag.targetId));
      } else if (flag.targetType === "message") {
        await tx
          .update(schema.messages)
          .set({ content: "(removed by moderator)" })
          .where(eq(schema.messages.id, flag.targetId));
      }
    }

    await tx
      .update(schema.contentFlags)
      .set({
        status: "resolved",
        resolvedBy: actorId,
        resolvedAt: new Date(),
      })
      .where(eq(schema.contentFlags.id, flagId));

    return true;
  });
}
