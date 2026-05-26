"use client";

import { useVendorAuth } from "@/lib/vendor-auth";
import VendorPortalLayout from "@/components/VendorPortalLayout";

export default function VendorDashboardPage() {
  const { vendor } = useVendorAuth();

  if (!vendor) return null;

  const isVenue = vendor.vendorType === "venue";

  return (
    <VendorPortalLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {vendor.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isVenue ? "Manage your venue listings and bookings" : "Manage your service listings and bookings"}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${vendor.isVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={vendor.isVerified ? "M5 13l4 4L19 7" : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 7.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" } />
          </svg>
          {vendor.isVerified ? "Verified" : "Pending Verification"}
        </span>
      </div>

      {isVenue ? <VenueDashboard /> : <ServiceDashboard />}
    </VendorPortalLayout>
  );
}

function VenueDashboard() {
  const stats = [
    { label: "Active Listings", value: "2", color: "text-gray-900" },
    { label: "Pending Inquiries", value: "3", color: "text-amber-600" },
    { label: "Confirmed Bookings", value: "2", color: "text-green-600" },
    { label: "This Month Revenue", value: "RM 4,200", color: "text-[#EB4D4B]" },
  ];

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">Quick Tips</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2"><svg className="h-4 w-4 mt-0.5 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Add high-quality photos to increase booking rates by 40%</li>
          <li className="flex items-start gap-2"><svg className="h-4 w-4 mt-0.5 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Respond to inquiries within 1 hour for best conversion</li>
          <li className="flex items-start gap-2"><svg className="h-4 w-4 mt-0.5 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Update your availability calendar to avoid double-bookings</li>
        </ul>
      </div>
    </>
  );
}

function ServiceDashboard() {
  const stats = [
    { label: "Active Services", value: "1", color: "text-gray-900" },
    { label: "New Requests", value: "2", color: "text-amber-600" },
    { label: "Upcoming Jobs", value: "1", color: "text-blue-600" },
    { label: "This Month Revenue", value: "RM 6,000", color: "text-[#EB4D4B]" },
  ];

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">Quick Tips</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2"><svg className="h-4 w-4 mt-0.5 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Upload portfolio samples to showcase your work</li>
          <li className="flex items-start gap-2"><svg className="h-4 w-4 mt-0.5 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Create clear package tiers (Basic/Standard/Premium)</li>
          <li className="flex items-start gap-2"><svg className="h-4 w-4 mt-0.5 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Keep your availability updated to get more requests</li>
        </ul>
      </div>
    </>
  );
}
