"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getVendorInquiries, type ApiInquiry } from "@/lib/api";
import type { InquiryStatus } from "@/lib/types";
import VendorPortalLayout from "@/components/VendorPortalLayout";

const statusLabels: Record<
  InquiryStatus,
  { label: string; color: string }
> = {
  accept: { label: "Accepted", color: "bg-blue-100 text-blue-700" },
  approve: { label: "Approved", color: "bg-indigo-100 text-indigo-700" },
  proceed: { label: "In Progress", color: "bg-purple-100 text-purple-700" },
  ongoing: {
    label: "Ongoing",
    color: "bg-orange-100 text-orange-700",
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-100 text-emerald-700",
  },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

const STATUS_FLOW: Record<InquiryStatus, InquiryStatus[]> = {
  accept: ["approve", "cancelled"],
  approve: ["proceed", "cancelled"],
  proceed: ["ongoing", "cancelled"],
  ongoing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function mapApiStatus(apiStatus: string): InquiryStatus {
  const mapping: Record<string, InquiryStatus> = {
    pending: "accept",
    accepted: "accept",
    approved: "approve",
    in_progress: "proceed",
    ongoing: "ongoing",
    completed: "completed",
    cancelled: "cancelled",
  };
  return mapping[apiStatus] ?? "accept";
}

function mapApiToInquiryStatus(status: string): InquiryStatus {
  return mapApiStatus(status);
}

type FilterType =
  | "all"
  | "accept"
  | "approve"
  | "proceed"
  | "ongoing"
  | "completed"
  | "cancelled";

export default function VendorInquiriesPage() {
  const [inquiries, setInquiries] = useState<ApiInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, InquiryStatus>>({});
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const result = await getVendorInquiries();
        setInquiries(result.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load inquiries"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  const advanceStatus = (id: string, newStatus: InquiryStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: newStatus }));
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
            "accept",
            "approve",
            "proceed",
            "ongoing",
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

      {loading ? (
        <div className="mt-12 flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#EB4D4B]" />
        </div>
      ) : error ? (
        <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 py-16 text-center">
          <p className="font-medium text-red-600">{error}</p>
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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {inq.eventType || "Event"} — {inq.guestCount} guests
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDate(inq.eventDate)}
                      {inq.eventTime && ` · ${inq.eventTime}`}
                    </p>
                    {inq.specialRequirements && (
                      <p className="mt-2 text-sm text-gray-400">
                        &ldquo;{inq.specialRequirements}&rdquo;
                      </p>
                    )}
                    {inq.listing && (
                      <p className="mt-1 text-xs text-gray-400">
                        Listing: {inq.listing.title}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusLabels[status].color}`}
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
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                          ns === "cancelled"
                            ? "border border-red-200 text-red-600 hover:bg-red-50"
                            : "bg-[#EB4D4B] text-white hover:bg-[#dc2626]"
                        }`}
                      >
                        {statusLabels[ns].label}
                      </button>
                    ))}
                  </div>
                )}

                {status === "completed" && (
                  <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                    <Link
                      href={`/venues/${listingSlug}`}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      View Listing
                    </Link>
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-50 border border-green-200 px-4 py-2 text-sm font-medium text-green-700">
                      <svg
                        className="h-4 w-4"
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
                      Completed
                    </span>
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
