"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  users: number;
  vendors: number;
  listings: number;
  pendingVendors: number;
  bookings: number;
}

const ICONS = {
  users:
    "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  vendors:
    "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  listings:
    "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  bookings:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
};

function formatNumber(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  return n.toLocaleString();
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/admin/dashboard", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setError("Could not load platform stats.");
          return;
        }
        const json = await res.json();
        if (!cancelled) setStats(json.data as DashboardStats);
      } catch {
        if (!cancelled) setError("Network error while loading stats.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { key: "users", label: "Total Users", value: stats?.users, icon: ICONS.users },
    { key: "vendors", label: "Active Vendors", value: stats?.vendors, icon: ICONS.vendors },
    { key: "listings", label: "Listings", value: stats?.listings, icon: ICONS.listings },
    { key: "bookings", label: "Total Bookings", value: stats?.bookings, icon: ICONS.bookings },
  ];

  const pendingActions = [
    {
      type: "Vendor Approval",
      count: stats?.pendingVendors ?? 0,
      href: "/admin/vendors",
      color: "bg-amber-500",
    },
    { type: "Document Review", count: 0, href: "/admin/documents", color: "bg-blue-500" },
    { type: "Flagged Content", count: 0, href: "/admin/moderation", color: "bg-red-500" },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">Platform overview and quick actions</p>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat) => (
          <div key={stat.key} className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-700">
                <svg
                  className="h-5 w-5 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d={stat.icon}
                  />
                </svg>
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-white">
              {loading ? "…" : formatNumber(stat.value)}
            </p>
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
                  {loading ? "…" : item.count}
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Document review and content moderation counts will be wired in
            once those queues are persisted.
          </p>
        </div>

        {/* Recent Activity placeholder */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
          <p className="mt-4 text-sm text-gray-400">
            Activity feed coming soon. It will show real-time vendor approvals,
            new bookings, flagged content, and signups once the audit-log
            stream is in place.
          </p>
        </div>
      </div>
    </div>
  );
}
