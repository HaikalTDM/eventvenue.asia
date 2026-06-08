"use client";

import { useState } from "react";
import Link from "next/link";

import { useVendorInquiries, useUpdateInquiryStatus } from "@/hooks/use-inquiries";
import type { ApiInquiry } from "@/lib/api";
import type { InquiryStatus } from "@/lib/types";
import VendorPortalLayout from "@/components/VendorPortalLayout";

const statusLabels: Record<
  InquiryStatus,
  { label: string; color: string; actionLabel: string }
> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700", actionLabel: "Accept" },
  accepted: { label: "Accepted", color: "bg-blue-100 text-blue-700", actionLabel: "Complete" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", actionLabel: "" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", actionLabel: "" },
};

const STATUS_FLOW: Record<InquiryStatus, InquiryStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function mapApiToInquiryStatus(status: string): InquiryStatus {
  if (status === "pending") return "pending";
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "completed";
  return "accepted";
}

type FilterType =
  | "all"
  | "pending"
  | "accepted"
  | "completed"
  | "cancelled";

export default function VendorInquiriesPage() {
  const { data: inquiries = [], isLoading: loading, error } = useVendorInquiries();
  const updateStatus = useUpdateInquiryStatus();

  const [statuses, setStatuses] = useState<Record<string, InquiryStatus>>({});
  const [filter, setFilter] = useState<FilterType>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const getStatus = (inq: ApiInquiry): InquiryStatus =>
    statuses[inq.id] ?? mapApiToInquiryStatus(inq.status);

  const filteredInquiries = inquiries.filter((inq) => {
    const status = getStatus(inq);
    if (filter === "all") return true;
    return status === filter;
  });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const advanceStatus = async (id: string, newStatus: InquiryStatus) => {
    setBusyId(id);
    setActionError(null);
    // Optimistic update so the UI reacts instantly.
    const previous = statuses[id];
    setStatuses((prev) => ({ ...prev, [id]: newStatus }));
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
    } catch (err) {
      // Revert on failure.
      setStatuses((prev) => {
        const next = { ...prev };
        if (previous === undefined) delete next[id];
        else next[id] = previous;
        return next;
      });
      setActionError(
        err instanceof Error ? err.message : "Could not update inquiry status."
      );
    } finally {
      setBusyId(null);
    }
  };

  const countByStatus = (s: InquiryStatus) =>
    inquiries.filter((i) => getStatus(i) === s).length;

  return (
    <VendorPortalLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage incoming customer leads. Contact them via Email or WhatsApp.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            "all",
            "pending",
            "accepted",
            "completed",
            "cancelled",
          ] as const
        ).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              filter === f
                ? "bg-[#EB4D4B] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all"
              ? `All (${inquiries.length})`
              : `${statusLabels[f].label} (${countByStatus(f)})`}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="mt-12 flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#EB4D4B]" />
        </div>
      ) : error ? (
        <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 py-16 text-center">
          <p className="font-medium text-red-600">{error.message}</p>
        </div>
      ) : filteredInquiries.length === 0 ? (
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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-600">
            No inquiries
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {filter === "all"
              ? "Inquiries from customers will appear here."
              : "No inquiries match this filter."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredInquiries.map((inq) => {
            const status = getStatus(inq);
            const nextStatuses = STATUS_FLOW[status] ?? [];
            const listingSlug = inq.listing?.slug ?? inq.listingId;
            return (
              <div
                key={inq.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex gap-4">
                  {inq.listing?.primaryPhoto ? (
                    <img
                      src={inq.listing.primaryPhoto.url}
                      alt={inq.listing.title}
                      className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
                      <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    {inq.listing && (
                      <h3 className="text-base font-bold text-gray-900">
                        {inq.listing.title}
                      </h3>
                    )}
                    {inq.listing?.location && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {inq.listing.location}
                      </p>
                    )}

                    <p className="mt-1.5 text-sm text-gray-700">
                      {inq.eventType || "Event"} — {inq.guestCount} guests
                    </p>
                    {inq.totalPrice != null && (
                      <p className="mt-0.5 text-sm font-semibold text-gray-800">
                        RM {Number(inq.totalPrice).toLocaleString()}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatDate(inq.eventDate)}
                      {inq.eventTime && ` · ${inq.eventTime}`}
                    </p>

                    {inq.specialRequirements && (
                      <p className="mt-2 text-sm italic text-gray-400">
                        &ldquo;{inq.specialRequirements}&rdquo;
                      </p>
                    )}

                    {inq.customer && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="font-medium text-gray-600">{inq.customer.name}</span>
                        <a href={`mailto:${inq.customer.email}`} className="text-[#EB4D4B] hover:underline">
                          {inq.customer.email}
                        </a>
                        {inq.customer.phone && (
                          <a href={`https://wa.me/${inq.customer.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                            {inq.customer.phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <span
                    className={`inline-flex h-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${statusLabels[status].color}`}
                  >
                    {statusLabels[status].label}
                  </span>
                </div>

                {nextStatuses.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                    <Link
                      href={`/venues/${listingSlug}`}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      View Listing
                    </Link>
                    {nextStatuses.map((ns) => (
                      <button
                        key={ns}
                        onClick={() => advanceStatus(inq.id, ns)}
                        disabled={busyId === inq.id}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 ${
                          ns === "cancelled"
                            ? "border border-red-200 text-red-600 hover:bg-red-50"
                            : "bg-[#EB4D4B] text-white hover:bg-[#dc2626]"
                        }`}
                      >
                        {busyId === inq.id ? "..." : statusLabels[ns].label}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </VendorPortalLayout>
  );
}
