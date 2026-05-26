"use client";

import Link from "next/link";

const stats = [
  { label: "Total Users", value: "2,847", change: "+12%", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { label: "Active Vendors", value: "156", change: "+8%", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { label: "Total Bookings", value: "1,203", change: "+23%", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { label: "Revenue (MYR)", value: "284,500", change: "+18%", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const pendingActions = [
  { type: "Vendor Approval", count: 5, href: "/admin/vendors", color: "bg-amber-500" },
  { type: "Document Review", count: 8, href: "/admin/documents", color: "bg-blue-500" },
  { type: "Flagged Content", count: 3, href: "/admin/moderation", color: "bg-red-500" },
];

const recentActivity = [
  { action: "New vendor registered", detail: "Elegant Events Catering — Penang", time: "10 min ago" },
  { action: "Booking confirmed", detail: "Grand Ballroom KL — Wedding, March 15", time: "25 min ago" },
  { action: "Review flagged", detail: "Inappropriate language on Skyline Lounge review", time: "1 hour ago" },
  { action: "Vendor approved", detail: "DJ Beats Entertainment — KL", time: "2 hours ago" },
  { action: "New user signup", detail: "sarah.ahmad@gmail.com — Customer", time: "3 hours ago" },
  { action: "Document uploaded", detail: "Hassan Catering — Halal cert renewal", time: "4 hours ago" },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">Platform overview and quick actions</p>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-700">
                <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                </svg>
              </div>
              <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                {stat.change}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-white">{stat.value}</p>
            <p className="mt-0.5 text-sm text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Pending Actions */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white">Pending Actions</h2>
          <div className="mt-4 space-y-3">
            {pendingActions.map((item) => (
              <Link
                key={item.type}
                href={item.href}
                className="flex items-center justify-between rounded-xl border border-gray-700 p-3 transition-colors hover:bg-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-300">{item.type}</span>
                </div>
                <span className="rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-bold text-white">
                  {item.count}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
          <div className="mt-4 space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-4 rounded-xl border border-gray-700 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-200">{item.action}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{item.detail}</p>
                </div>
                <span className="shrink-0 text-xs text-gray-500">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
