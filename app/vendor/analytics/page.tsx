"use client";

import { useVendorAuth } from "@/lib/vendor-auth";
import VendorPortalLayout from "@/components/VendorPortalLayout";

export default function VendorAnalyticsPage() {
  const { vendor } = useVendorAuth();
  if (!vendor) return null;

  const isVenue = vendor.vendorType === "venue";

  const metrics = isVenue
    ? [
        { label: "Total Views", value: "2,340", change: "+12%", up: true },
        { label: "Inquiry Rate", value: "8.5%", change: "+2.1%", up: true },
        { label: "Booking Rate", value: "62%", change: "-1.3%", up: false },
        { label: "Avg Rating", value: "4.85", change: "+0.1", up: true },
      ]
    : [
        { label: "Profile Views", value: "1,890", change: "+18%", up: true },
        { label: "Request Rate", value: "5.2%", change: "+0.8%", up: true },
        { label: "Conversion", value: "45%", change: "+3%", up: true },
        { label: "Avg Rating", value: "4.7", change: "+0.2", up: true },
      ];

  const topChannels = [
    { name: "Direct Search", pct: 42 },
    { name: "EventVenue.Asia", pct: 28 },
    { name: "Social Media", pct: 18 },
    { name: "Referrals", pct: 12 },
  ];

  return (
    <VendorPortalLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Performance overview for the last 30 days</p>
        </div>
        <select className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 outline-none focus:border-[#EB4D4B]">
          <option>Last 30 days</option>
          <option>Last 7 days</option>
          <option>Last 90 days</option>
        </select>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{m.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{m.value}</p>
            <p className={`mt-1 text-xs font-semibold ${m.up ? "text-green-600" : "text-red-500"}`}>
              {m.change} from last period
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">Traffic Sources</h2>
          <div className="mt-4 space-y-3">
            {topChannels.map((ch) => (
              <div key={ch.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{ch.name}</span>
                  <span className="font-semibold text-gray-900">{ch.pct}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-[#EB4D4B]" style={{ width: `${ch.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
          <div className="mt-4 space-y-3">
            {[
              { text: "New inquiry from Sarah Lim", time: "2 hours ago", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8" },
              { text: "Booking confirmed for Jun 15", time: "1 day ago", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
              { text: "5-star review from Ahmad S.", time: "3 days ago", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034" },
              { text: "Listing viewed 48 times", time: "5 days ago", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7" },
            ].map((act, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={act.icon} /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{act.text}</p>
                  <p className="text-xs text-gray-400">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VendorPortalLayout>
  );
}
