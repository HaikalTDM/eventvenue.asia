"use client";

import { useVendorAuth } from "@/lib/vendor-auth";
import VendorPortalLayout from "@/components/VendorPortalLayout";

export default function VendorAnalyticsPage() {
  const { vendor } = useVendorAuth();
  if (!vendor) return null;

  return (
    <VendorPortalLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Performance overview for your listings
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-gray-600">
          Analytics coming soon
        </h3>
        <p className="mt-2 max-w-md mx-auto text-sm text-gray-400">
          View counts, inquiry rates, conversion, and revenue trends will be
          published here once the analytics pipeline is wired up.
        </p>
      </div>
    </VendorPortalLayout>
  );
}
