"use client";

import { useAdminAnalytics } from "@/hooks/use-admin";

interface AnalyticsData {
  currentMonth: {
    revenue: number;
    bookings: number;
    avgBookingValue: number;
    conversionRate: number;
    currency: string;
    revenueChangePct: number | null;
    bookingsChangePct: number | null;
    avgValueChangePct: number | null;
    conversionChangePct: number | null;
  };
  trend: Array<{ month: string; bookings: number; revenue: number }>;
  eventTypes: Array<{ category: string; count: number; percentage: number }>;
  topListings: Array<{
    id: string;
    title: string;
    bookings: number;
    revenue: number;
    currency: string;
  }>;
}

function formatMoney(amt: number, ccy: string): string {
  return `${ccy} ${amt.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

function formatChange(p: number | null): { text: string; positive: boolean } | null {
  if (p === null) return null;
  const sign = p >= 0 ? "+" : "";
  return { text: `${sign}${p.toFixed(1)}% vs last month`, positive: p >= 0 };
}

export default function AdminAnalyticsPage() {
  const { data, isLoading: loading, error } = useAdminAnalytics();
  const errorMessage = error?.message ?? null;
  const typed = data as AnalyticsData | undefined;

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
        <div className="mt-12 flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-[#EB4D4B]" />
        </div>
      </div>
    );
  }

  if (error || !typed) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage || "No analytics data."}
        </div>
      </div>
    );
  }

  const { currentMonth, trend, eventTypes, topListings } = typed;
  const maxBookings = Math.max(1, ...trend.map((t) => t.bookings));

  const cards = [
    {
      label: "Monthly Revenue",
      value: formatMoney(currentMonth.revenue, currentMonth.currency),
      change: formatChange(currentMonth.revenueChangePct),
    },
    {
      label: "Monthly Bookings",
      value: currentMonth.bookings.toLocaleString(),
      change: formatChange(currentMonth.bookingsChangePct),
    },
    {
      label: "Avg. Booking Value",
      value: formatMoney(currentMonth.avgBookingValue, currentMonth.currency),
      change: formatChange(currentMonth.avgValueChangePct),
    },
    {
      label: "Conversion Rate",
      value: formatPct(currentMonth.conversionRate),
      change: formatChange(currentMonth.conversionChangePct),
    },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
        <p className="mt-1 text-sm text-gray-400">
          Booking, revenue, and conversion metrics for the current month
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
            <p className="text-sm text-gray-400">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{c.value}</p>
            {c.change && (
              <p
                className={`mt-1 text-xs ${
                  c.change.positive ? "text-green-400" : "text-red-400"
                }`}
              >
                {c.change.text}
              </p>
            )}
            {!c.change && (
              <p className="mt-1 text-xs text-gray-500">no prior period</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Trend */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white">Monthly Bookings (Last 7 months)</h2>
          {trend.every((t) => t.bookings === 0) ? (
            <p className="mt-6 text-sm text-gray-500">No bookings yet.</p>
          ) : (
            <div className="mt-6 flex items-end gap-3 h-48">
              {trend.map((d) => (
                <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-[#EB4D4B] transition-all"
                    style={{ height: `${(d.bookings / maxBookings) * 100}%` }}
                    title={`${d.bookings} bookings`}
                  />
                  <span className="text-xs text-gray-400">{d.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Event Types */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white">Bookings by Event Type</h2>
          {eventTypes.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">No bookings yet.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {eventTypes.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{cat.category}</span>
                    <span className="text-sm font-medium text-white">{cat.percentage}%</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-700">
                    <div
                      className="h-full rounded-full bg-[#EB4D4B]"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Listings */}
      <div className="mt-6 rounded-2xl border border-gray-700 bg-gray-800 p-5">
        <h2 className="text-sm font-semibold text-white">Top Performing Listings</h2>
        {topListings.length === 0 || topListings.every((l) => l.bookings === 0) ? (
          <p className="mt-4 text-sm text-gray-500">
            No listings have bookings yet. Once vendors start receiving bookings, the top performers will appear here.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-400">#</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-400">Listing</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase text-gray-400">Bookings</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase text-gray-400">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topListings
                  .filter((l) => l.bookings > 0)
                  .map((l, i) => (
                    <tr key={l.id} className="border-b border-gray-700/50">
                      <td className="py-3 text-sm text-gray-400">{i + 1}</td>
                      <td className="py-3 text-sm font-medium text-white">{l.title}</td>
                      <td className="py-3 text-right text-sm text-gray-300">{l.bookings}</td>
                      <td className="py-3 text-right text-sm font-medium text-white">
                        {formatMoney(l.revenue, l.currency)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
