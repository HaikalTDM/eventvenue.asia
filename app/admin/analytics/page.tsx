"use client";

const monthlyData = [
  { month: "Jul", bookings: 45, revenue: 18500 },
  { month: "Aug", bookings: 52, revenue: 21200 },
  { month: "Sep", bookings: 68, revenue: 27800 },
  { month: "Oct", bookings: 74, revenue: 31500 },
  { month: "Nov", bookings: 89, revenue: 38200 },
  { month: "Dec", bookings: 112, revenue: 48700 },
  { month: "Jan", bookings: 98, revenue: 42300 },
];

const topVenues = [
  { name: "Grand Ballroom at The Majestic KL", bookings: 34, revenue: "RM 68,000" },
  { name: "Skyline Rooftop Lounge", bookings: 28, revenue: "RM 42,000" },
  { name: "Glasshouse Petaling Jaya", bookings: 22, revenue: "RM 33,000" },
  { name: "Heritage Hall JB", bookings: 18, revenue: "RM 27,000" },
  { name: "The Orchid Garden", bookings: 15, revenue: "RM 22,500" },
];

const topCategories = [
  { category: "Wedding", percentage: 38 },
  { category: "Corporate", percentage: 27 },
  { category: "Private Party", percentage: 18 },
  { category: "Seminar", percentage: 10 },
  { category: "Other", percentage: 7 },
];

export default function AdminAnalyticsPage() {
  const maxBookings = Math.max(...monthlyData.map((d) => d.bookings));

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
        <p className="mt-1 text-sm text-gray-400">Performance metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-sm text-gray-400">Monthly Revenue</p>
          <p className="mt-2 text-2xl font-bold text-white">RM 42,300</p>
          <p className="mt-1 text-xs text-green-400">+18% vs last month</p>
        </div>
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-sm text-gray-400">Monthly Bookings</p>
          <p className="mt-2 text-2xl font-bold text-white">98</p>
          <p className="mt-1 text-xs text-red-400">-12% vs last month</p>
        </div>
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-sm text-gray-400">Avg. Booking Value</p>
          <p className="mt-2 text-2xl font-bold text-white">RM 432</p>
          <p className="mt-1 text-xs text-green-400">+5% vs last month</p>
        </div>
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <p className="text-sm text-gray-400">Conversion Rate</p>
          <p className="mt-2 text-2xl font-bold text-white">12.4%</p>
          <p className="mt-1 text-xs text-green-400">+2.1% vs last month</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Bookings Chart (Bar) */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white">Monthly Bookings</h2>
          <div className="mt-6 flex items-end gap-3 h-48">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-lg bg-[#EB4D4B] transition-all" style={{ height: `${(d.bookings / maxBookings) * 100}%` }} />
                <span className="text-xs text-gray-400">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Event Categories */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white">Bookings by Event Type</h2>
          <div className="mt-6 space-y-4">
            {topCategories.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{cat.category}</span>
                  <span className="text-sm font-medium text-white">{cat.percentage}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-700">
                  <div className="h-full rounded-full bg-[#EB4D4B]" style={{ width: `${cat.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Venues */}
      <div className="mt-6 rounded-2xl border border-gray-700 bg-gray-800 p-5">
        <h2 className="text-sm font-semibold text-white">Top Performing Venues</h2>
        <div className="mt-4 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-400">#</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-400">Venue</th>
                <th className="pb-3 text-right text-xs font-semibold uppercase text-gray-400">Bookings</th>
                <th className="pb-3 text-right text-xs font-semibold uppercase text-gray-400">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topVenues.map((venue, i) => (
                <tr key={venue.name} className="border-b border-gray-700/50">
                  <td className="py-3 text-sm text-gray-400">{i + 1}</td>
                  <td className="py-3 text-sm font-medium text-white">{venue.name}</td>
                  <td className="py-3 text-right text-sm text-gray-300">{venue.bookings}</td>
                  <td className="py-3 text-right text-sm font-medium text-white">{venue.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
