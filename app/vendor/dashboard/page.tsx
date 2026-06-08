"use client";

import { useMemo } from "react";
import { useVendorAuth } from "@/lib/vendor-auth";
import VendorPortalLayout from "@/components/VendorPortalLayout";
import { useListings } from "@/hooks/use-listings";
import { useVendorInquiries } from "@/hooks/use-inquiries";
import { useVendorBookings } from "@/hooks/use-bookings";

interface DashboardStats {
  activeListings: number;
  pendingInquiries: number;
  confirmedBookings: number;
  monthRevenue: number;
  currency: string;
}

export default function VendorDashboardPage() {
  const { vendor } = useVendorAuth();

  const isVenueType =
    vendor?.vendorType === "venue" || vendor?.vendorType === "venue_owner";
  const listingType = isVenueType ? "venue" : "service";

  // mine=true returns this vendor's listings regardless of status, so the
  // dashboard sees drafts and paused listings too. The "Active Listings"
  // card then filters on status==='active' explicitly. The hooks are
  // gated on `vendor` so we don't fire requests before the session resolves.
  const { data: listingsResponse, error: listingsError } = useListings(
    { mine: true, type: listingType },
    { enabled: Boolean(vendor) }
  );
  const { data: inquiries = [], error: inquiriesError } = useVendorInquiries({
    enabled: Boolean(vendor),
  });
  const { data: bookings = [], error: bookingsError } = useVendorBookings({
    enabled: Boolean(vendor),
  });

  const loading = !vendor || (!listingsResponse && !listingsError);
  const error =
    listingsError?.message ?? inquiriesError?.message ?? bookingsError?.message ?? null;

  const stats = useMemo<DashboardStats | null>(() => {
    if (!listingsResponse) return null;

    const listings = listingsResponse.data ?? [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthRevenue = bookings
      .filter((b) => {
        if (!b.status || !b.eventDate) return false;
        if (!["confirmed", "in_progress", "completed"].includes(b.status)) return false;
        return new Date(b.eventDate) >= startOfMonth;
      })
      .reduce((sum, b) => sum + Number(b.totalAmount ?? 0), 0);

    const currency = listings[0]?.currency ?? "MYR";

    return {
      activeListings: listings.filter((l) => l.status !== "paused").length,
      pendingInquiries: inquiries.filter(
        (i) => i.status === "pending" || i.status === "accepted"
      ).length,
      confirmedBookings: bookings.filter(
        (b) => b.status === "confirmed" || b.status === "in_progress"
      ).length,
      monthRevenue,
      currency,
    };
  }, [listingsResponse, inquiries, bookings]);

  if (!vendor) {
    // Defer to VendorPortalLayout's own loading + redirect logic. Returning
    // a wrapped layout (instead of null) lets the spinner show during the
    // /api/v1/auth/session round-trip immediately after registration.
    return <VendorPortalLayout><div /></VendorPortalLayout>;
  }

  const isVenue = vendor.vendorType === "venue" || vendor.vendorType === "venue_owner";

  const formatNumber = (n: number) => n.toLocaleString();
  const formatMoney = (amt: number, ccy: string) =>
    `${ccy} ${amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <VendorPortalLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {vendor.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isVenue
              ? "Manage your venue listings and bookings"
              : "Manage your service listings and bookings"}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            vendor.isVerified
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d={
                vendor.isVerified
                  ? "M5 13l4 4L19 7"
                  : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 7.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              }
            />
          </svg>
          {vendor.isVerified ? "Verified" : "Pending Verification"}
        </span>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label={isVenue ? "Active Listings" : "Active Services"}
          value={loading ? "…" : formatNumber(stats?.activeListings ?? 0)}
          color="text-gray-900"
        />
        <StatCard
          label={isVenue ? "Pending Inquiries" : "New Requests"}
          value={loading ? "…" : formatNumber(stats?.pendingInquiries ?? 0)}
          color="text-amber-600"
        />
        <StatCard
          label={isVenue ? "Confirmed Bookings" : "Upcoming Jobs"}
          value={loading ? "…" : formatNumber(stats?.confirmedBookings ?? 0)}
          color={isVenue ? "text-green-600" : "text-blue-600"}
        />
        <StatCard
          label="This Month Revenue"
          value={loading ? "…" : formatMoney(stats?.monthRevenue ?? 0, stats?.currency ?? "MYR")}
          color="text-[#EB4D4B]"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">Quick Tips</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          {(isVenue
            ? [
                "Add high-quality photos to increase booking rates",
                "Respond to inquiries within 1 hour for best conversion",
                "Update your availability calendar to avoid double-bookings",
              ]
            : [
                "Upload portfolio samples to showcase your work",
                "Create clear package tiers (Basic / Standard / Premium)",
                "Keep your availability updated to get more requests",
              ]
          ).map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <svg
                className="h-4 w-4 mt-0.5 shrink-0 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </VendorPortalLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
