"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useVendorAuth } from "@/lib/vendor-auth";
import { getVendorBookings } from "@/lib/api";
import VendorPortalLayout from "@/components/VendorPortalLayout";

const vendorBookingStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmed", color: "bg-emerald-100 text-emerald-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600" },
};

const statusOrder = ["confirmed", "in_progress", "pending", "completed", "cancelled"] as const;

export default function VendorBookingsPage() {
  const { vendor } = useVendorAuth();
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendor) return;
    getVendorBookings()
      .then((res) => {
        setBookings((res.data || []) as Array<Record<string, unknown>>);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load bookings");
        setLoading(false);
      });
  }, [vendor]);

  if (!vendor) return null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });

  if (loading) {
    return (
      <VendorPortalLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#EB4D4B]" />
        </div>
      </VendorPortalLayout>
    );
  }

  if (error) {
    return (
      <VendorPortalLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-red-600">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-[#EB4D4B] px-5 py-2.5 text-sm font-bold text-white">
            Retry
          </button>
        </div>
      </VendorPortalLayout>
    );
  }

  return (
    <VendorPortalLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-600">No bookings yet</h3>
          <p className="mt-1 text-sm text-gray-400">Confirmed bookings will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {statusOrder.map((status) => {
            const filtered = bookings.filter((b) => (b as Record<string, string>).status === status);
            if (filtered.length === 0) return null;
            const label = vendorBookingStatusLabels[status] || { label: status, color: "bg-gray-100 text-gray-600" };
            return (
              <div key={status}>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
                  {label.label} ({filtered.length})
                </h2>
                <div className="space-y-3">
                  {filtered.map((booking) => {
                    const b = booking as Record<string, unknown>;
                    return (
                      <div key={b.id as string} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-200">
                          <Image src={(b.listingThumbnailUrl as string) || ""} alt={b.listingTitle as string || ""} fill className="object-cover" sizes="96px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-gray-900">{b.listingTitle as string}</h3>
                          <p className="text-xs text-gray-500">{b.customerName as string} · {formatDate(b.eventDate as string)} · {b.guestCount as number} guests</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[#EB4D4B]">{b.currency as string} {(b.totalAmount as number)?.toLocaleString()}</span>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${label.color}`}>
                            {label.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </VendorPortalLayout>
  );
}
