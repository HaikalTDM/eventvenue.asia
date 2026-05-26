"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getMyInquiries, getFavorites } from "@/lib/api";
import type { ApiInquiry } from "@/lib/api";
import type { InquiryStatus, Inquiry } from "@/lib/types";

const statusLabels: Record<InquiryStatus, { label: string; color: string }> = {
  accept: { label: "Accept", color: "bg-blue-100 text-blue-700" },
  approve: { label: "Approve", color: "bg-indigo-100 text-indigo-700" },
  proceed: { label: "Proceed", color: "bg-amber-100 text-amber-700" },
  ongoing: { label: "Ongoing", color: "bg-orange-100 text-orange-700" },
  completed: { label: "Complete", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inqRes, favRes] = await Promise.all([
        getMyInquiries(),
        getFavorites(),
      ]);
      setInquiries(inqRes.data.map(apiToInquiry));
      setFavoriteCount(favRes.data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const inquiryCounts = {
    total: inquiries.length,
    accept: inquiries.filter((i) => i.status === "accept").length,
    proceed: inquiries.filter((i) => i.status === "proceed").length,
    ongoing: inquiries.filter((i) => i.status === "ongoing").length,
    completed: inquiries.filter((i) => i.status === "completed").length,
    cancelled: inquiries.filter((i) => i.status === "cancelled").length,
  };

  const recentInquiries = [...inquiries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  if (error) {
    return (
      <div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <svg className="mx-auto h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-3 text-sm font-semibold text-red-700">Failed to load dashboard</h3>
          <p className="mt-1 text-xs text-red-500">{error}</p>
          <button
            onClick={fetchData}
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
          <div className="mt-2 h-4 w-64 rounded-lg bg-gray-200" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="mt-2 h-8 w-12 rounded bg-gray-200" />
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-5 w-32 rounded bg-gray-200" />
              <div className="mt-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-14 shrink-0 rounded-lg bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-40 rounded bg-gray-200" />
                      <div className="h-3 w-24 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-5 w-32 rounded bg-gray-200" />
              <div className="mt-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-gray-200" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here is your activity overview.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Inquiries</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{inquiryCounts.total}</p>
          <Link
            href="/dashboard/inquiries"
            className="mt-2 inline-flex text-xs font-semibold text-[#EB4D4B] hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">In Progress</p>
          <p className="mt-1 text-3xl font-bold text-orange-600">{inquiryCounts.ongoing}</p>
          <Link
            href="/dashboard/inquiries"
            className="mt-2 inline-flex text-xs font-semibold text-[#EB4D4B] hover:underline"
          >
            View active
          </Link>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Completed</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{inquiryCounts.completed}</p>
          <Link
            href="/dashboard/inquiries"
            className="mt-2 inline-flex text-xs font-semibold text-[#EB4D4B] hover:underline"
          >
            View completed
          </Link>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Saved Venues</p>
          <p className="mt-1 text-3xl font-bold text-[#EB4D4B]">{favoriteCount}</p>
          <Link
            href="/dashboard/favorites"
            className="mt-2 inline-flex text-xs font-semibold text-[#EB4D4B] hover:underline"
          >
            View favorites
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Recent Inquiries</h2>
          <div className="mt-4 space-y-4">
            {recentInquiries.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                No inquiries yet. Start by sending an inquiry to a venue.
              </p>
            ) : (
              recentInquiries.map((inq) => (
                <div key={inq.id} className="flex items-center gap-3">
                  <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                    <Image
                      src={inq.venueThumbnailUrl}
                      alt={inq.venueTitle}
                      width={56}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {inq.venueTitle}
                    </p>
                    <p className="text-xs text-gray-500">{inq.eventDate}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusLabels[inq.status].color}`}
                  >
                    {statusLabels[inq.status].label}
                  </span>
                </div>
              ))
            )}
          </div>
          <Link
            href="/dashboard/inquiries"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#EB4D4B] hover:underline"
          >
            View all inquiries
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-xl bg-[#EB4D4B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#dc2626]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Venues
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-3 rounded-xl border-2 border-[#EB4D4B] px-5 py-3 text-sm font-bold text-[#EB4D4B] transition-colors hover:bg-[#EB4D4B]/5"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              Compare Venues
            </Link>
            <Link
              href="/dashboard/favorites"
              className="inline-flex items-center gap-3 rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
               Saved Venues
              </Link>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-3 rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Profile Settings
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
