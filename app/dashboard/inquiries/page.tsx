"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMyInquiries } from "@/hooks/use-inquiries";
import type { ApiInquiry } from "@/lib/api";
import type { InquiryStatus, Inquiry } from "@/lib/types";

const statusLabels: Record<InquiryStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  accepted: { label: "Accepted", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

const allStatuses: InquiryStatus[] = [
  "pending",
  "accepted",
  "completed",
  "cancelled",
];

function apiToInquiry(api: ApiInquiry): Inquiry {
  return {
    id: api.id,
    venueId: api.listingId,
    venueTitle: api.listing?.title ?? "Unknown Venue",
    venueThumbnailUrl: api.listing?.primaryPhoto?.url ?? "",
    eventDate: api.eventDate,
    startTime: api.eventTime,
    endTime: api.eventTime,
    guestCount: api.guestCount,
    eventType: api.eventType ?? "",
    specialRequirements: api.specialRequirements ?? "",
    status: api.status as InquiryStatus,
    createdAt: api.createdAt,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerWhatsapp: "",
  };
}

function getVenueSlugById(
  listingId: string,
  rawInquiries: ApiInquiry[]
): string {
  const found = rawInquiries.find((i) => i.listingId === listingId);
  return found?.listing?.slug ?? listingId;
}

export default function InquiriesPage() {
  const [activeFilter, setActiveFilter] = useState<InquiryStatus | "all">("all");

  const { data: rawInquiries = [], isLoading: loading, error, refetch } =
    useMyInquiries();

  const inquiries = useMemo<Inquiry[]>(
    () => rawInquiries.map(apiToInquiry),
    [rawInquiries]
  );

  const filtered =
    activeFilter === "all"
      ? inquiries
      : inquiries.filter((i) => i.status === activeFilter);

  const statusCounts = allStatuses.reduce(
    (acc, status) => {
      acc[status] = inquiries.filter((i) => i.status === status).length;
      return acc;
    },
    {} as Record<InquiryStatus, number>
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const hour = parseInt(time.split(":")[0], 10);
    return hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
  };

  if (error) {
    return (
      <div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <svg className="mx-auto h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-3 text-sm font-semibold text-red-700">Failed to load inquiries</h3>
          <p className="mt-1 text-xs text-red-500">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div className="animate-pulse">
          <div className="h-8 w-40 rounded-lg bg-gray-200" />
          <div className="mt-2 h-4 w-80 rounded-lg bg-gray-200" />
      <div className="mt-6 grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="mx-auto h-6 w-8 rounded bg-gray-200" />
                <div className="mx-auto mt-1 h-3 w-14 rounded bg-gray-200" />
              </div>
            ))}
          </div>
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex gap-4">
                  <div className="h-20 w-28 shrink-0 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-gray-200" />
                    <div className="h-3 w-64 rounded bg-gray-200" />
                    <div className="h-3 w-40 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Inquiries</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your venue inquiries. Vendors will contact you via email or WhatsApp.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#EB4D4B] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#dc2626]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Browse Venues
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-5 gap-3">
        <button
          onClick={() => setActiveFilter("all")}
          className={`rounded-xl p-3 text-center transition-all ${
            activeFilter === "all"
              ? "bg-gray-900 text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <p className="text-xl font-bold">{inquiries.length}</p>
          <p className="mt-0.5 text-xs font-medium">All</p>
        </button>
        {allStatuses.map((status) => (
          <button
            key={status}
            onClick={() => setActiveFilter(status)}
            className={`rounded-xl p-3 text-center transition-all ${
              activeFilter === status
                ? `${statusLabels[status].color} shadow-md ring-2 ring-offset-1 ring-current`
                : "bg-white hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <p className="text-xl font-bold">{statusCounts[status]}</p>
            <p className="mt-0.5 text-xs font-medium">{statusLabels[status].label}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-600">No inquiries found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {activeFilter === "all"
                ? "Start by sending an inquiry to a venue."
                : `No ${statusLabels[activeFilter].label.toLowerCase()} inquiries yet.`}
            </p>
            <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#EB4D4B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#dc2626]">
              Browse Venues
            </Link>
          </div>
        ) : (
          filtered.map((inquiry) => (
            <div key={inquiry.id} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-200">
                  <Image src={inquiry.venueThumbnailUrl} alt={inquiry.venueTitle} fill className="object-cover" sizes="112px" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{inquiry.venueTitle}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(inquiry.eventDate)}
                        </span>
                        <span>{formatTime(inquiry.startTime)} – {formatTime(inquiry.endTime)}</span>
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {inquiry.guestCount} guests
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{inquiry.eventType}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusLabels[inquiry.status].color}`}>
                      {statusLabels[inquiry.status].label}
                    </span>
                  </div>
                  {inquiry.specialRequirements && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-400">{inquiry.specialRequirements}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-xs text-gray-400">Inquiry sent on {formatDate(inquiry.createdAt)}</span>
                    <div className="flex items-center gap-2">
                      <Link href={`/venues/${getVenueSlugById(inquiry.venueId, rawInquiries)}`} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
                        View Venue
                      </Link>
                      {inquiry.status === "cancelled" && (
                        <span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
