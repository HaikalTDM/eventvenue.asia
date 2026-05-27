"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getVendorProfile, getListings, type ApiListing } from "@/lib/api";
import VendorPortalLayout from "@/components/VendorPortalLayout";

export default function VendorListingsPage() {
  const [pausedIds, setPausedIds] = useState<string[]>([]);
  const [listings, setListings] = useState<ApiListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendorType, setVendorType] = useState<"venue_owner" | "service_provider" | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const profile = (await getVendorProfile()) as {
          data?: { listingType?: string; vendorType?: string };
        };
        const raw =
          profile?.data?.vendorType || profile?.data?.listingType || "venue_owner";
        const normalizedType: "venue_owner" | "service_provider" =
          raw === "service" || raw === "service_provider"
            ? "service_provider"
            : "venue_owner";
        setVendorType(normalizedType);
        // Use ?mine=true so we get this vendor's listings regardless of
        // status (draft, paused, active). The public listings filter
        // status=active which would hide brand-new draft listings.
        const result = await getListings({
          mine: "true",
          listingType: normalizedType === "venue_owner" ? "venue" : "service",
        });
        setListings(result.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load listings"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const togglePause = (id: string) => {
    setPausedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const isVenue = vendorType === "venue_owner";
  const displayType = isVenue ? "Venue" : "Service";

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

      {loading ? (
        <div className="mt-12 flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#EB4D4B]" />
        </div>
      ) : error ? (
        <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 py-16 text-center">
          <p className="font-medium text-red-600">{error}</p>
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
            const isPaused = pausedIds.includes(id);
            const tags = listing.amenities ?? [];

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
                            isPaused
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isPaused ? "Paused" : "Active"}
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
                      <button
                        onClick={() => togglePause(id)}
                        className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                          isPaused
                            ? "border-green-200 text-green-600 hover:bg-green-50"
                            : "border-gray-200 text-gray-500 hover:border-red-200 hover:text-[#EB4D4B]"
                        }`}
                      >
                        {isPaused ? "Unpause" : "Pause"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </VendorPortalLayout>
  );
}
