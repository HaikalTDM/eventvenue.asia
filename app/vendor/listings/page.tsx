"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";

import { useVendorAuth } from "@/lib/vendor-auth";
import { useListings, listingKeys } from "@/hooks/use-listings";
import { updateListingStatusAction, deleteListingAction } from "@/lib/actions/listing";
import VendorPortalLayout from "@/components/VendorPortalLayout";

export default function VendorListingsPage() {
  const { vendor } = useVendorAuth();
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Vendor type is already on the session (joined into SessionUser by the
  // server's getSessionUser). Avoids the redundant /vendors/me round-trip
  // the legacy implementation needed to learn the listing type.
  const vendorType: "venue_owner" | "service_provider" =
    vendor?.vendorType === "service_provider" ? "service_provider" : "venue_owner";
  const isVenue = vendorType === "venue_owner";
  const displayType = isVenue ? "Venue" : "Service";

  const {
    data: response,
    isLoading: loading,
    error,
  } = useListings(
    { mine: true, type: isVenue ? "venue" : "service" },
    { enabled: Boolean(vendor) }
  );

  const listings = response?.data ?? [];

  const setListingStatus = async (
    id: string,
    newStatus: "active" | "paused" | "draft"
  ) => {
    setBusyId(id);
    setActionError(null);
    try {
      const result = await updateListingStatusAction({
        listingId: id,
        status: newStatus,
      });
      if (!result.ok) {
        setActionError(result.error || "Could not update listing.");
        return;
      }
      // Invalidate the vendor's listings cache so the new status reflects
      // here and on the dashboard's "Active Listings" stat.
      await qc.invalidateQueries({ queryKey: listingKeys.all });
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setBusyId(id);
    setActionError(null);
    try {
      const result = await deleteListingAction({ listingId: id });
      if (!result.ok) {
        setActionError(result.error || "Could not delete listing.");
        setDeleteTarget(null);
        return;
      }
      setDeleteTarget(null);
      await qc.invalidateQueries({ queryKey: listingKeys.all });
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <VendorPortalLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isVenue ? "Venue Listings" : "Service Listings"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading
              ? "Loading..."
              : `${listings.length} ${
                  isVenue ? "venue" : "service"
                }${listings.length !== 1 ? "s" : ""} listed`}
          </p>
        </div>
        <Link
          href={
            isVenue
              ? "/vendor/listings/new"
              : "/vendor/listings/new-service"
          }
          className="inline-flex items-center gap-2 rounded-xl bg-[#EB4D4B] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#dc2626]"
        >
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add {displayType}
        </Link>
      </div>

      {actionError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
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
      ) : listings.length === 0 ? (
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-600">
            No listings yet
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Create your first {isVenue ? "venue" : "service"} listing to start
            receiving bookings.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {listings.map((listing) => {
            const id = listing.id;
            const slug = listing.slug;
            const title = listing.title;
            const thumb = listing.primaryPhoto?.url ?? "";
            const location = listing.location ?? "";
            const rating = parseFloat(listing.averageRating) || 0;
            const reviewCount = listing.reviewCount;
            const status = (listing as { status?: string }).status ?? "draft";
            const isDraft = status === "draft";
            const isPaused = status === "paused";
            const isActive = status === "active";
            const tags = listing.amenities ?? [];
            const isBusy = busyId === id;

            return (
              <div
                key={id}
                className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                  isPaused
                    ? "border-amber-200 opacity-75"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative h-48 w-full sm:h-auto sm:w-56 shrink-0 overflow-hidden bg-gray-200">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 224px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <svg
                          className="h-12 w-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    {isPaused && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                          PAUSED
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {title}
                        </h3>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {location}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isDraft
                              ? "bg-gray-100 text-gray-600"
                              : isPaused
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isDraft ? "Draft" : isPaused ? "Paused" : "Active"}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <svg
                            className="h-4 w-4 text-amber-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {rating} ({reviewCount})
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.slice(0, 4).map((tag: string) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                      <Link
                        href={`/vendor/listings/${slug}/edit`}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </Link>
                      {isVenue && (
                        <Link
                          href={`/vendor/listings/${slug}/availability`}
                          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Manage Availability
                        </Link>
                      )}
                      {isDraft ? (
                        <button
                          onClick={() => setListingStatus(id, "active")}
                          disabled={isBusy}
                          className="rounded-xl bg-[#EB4D4B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#dc2626] disabled:opacity-50"
                        >
                          {isBusy ? "..." : "Publish"}
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setListingStatus(id, isPaused ? "active" : "paused")
                          }
                          disabled={isBusy}
                          className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                            isPaused
                              ? "border-green-200 text-green-600 hover:bg-green-50"
                              : "border-gray-200 text-gray-500 hover:border-red-200 hover:text-[#EB4D4B]"
                          }`}
                        >
                          {isBusy ? "..." : isPaused ? "Unpause" : "Pause"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(id, title)}
                        disabled={isBusy}
                        className="ml-auto rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                      >
                        {isBusy ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-center text-lg font-bold text-gray-900">Delete listing?</h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              This will permanently remove <span className="font-semibold text-gray-700">&ldquo;{deleteTarget.title}&rdquo;</span>{" "}
              and all its photos, availability data, and bookings. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={busyId === deleteTarget.id}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={busyId === deleteTarget.id}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-red-600/25 transition-all hover:bg-red-700 disabled:opacity-60"
              >
                {busyId === deleteTarget.id ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </VendorPortalLayout>
  );
}
