"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFavorites, useToggleFavorite } from "@/hooks/use-favorites";
import type { Venue } from "@/lib/types";

function favoriteToVenue(row: {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  capacity: number | null;
  pricePerHour: string | null;
  currency: string;
  halalCertified: boolean;
  averageRating: string;
  reviewCount: number;
  primaryPhoto?: { url: string; altText: string | null } | null;
  amenities?: string[];
  eventTypes?: string[];
}): Venue {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    location: row.location ?? "",
    pricePerHour: row.pricePerHour ? Number(row.pricePerHour) : 0,
    currency: row.currency,
    capacity: row.capacity ?? 0,
    rating: Number(row.averageRating) || 0,
    reviewCount: row.reviewCount,
    halalVerified: row.halalCertified,
    thumbnailUrl: row.primaryPhoto?.url ?? "",
    galleryUrls: row.primaryPhoto ? [row.primaryPhoto.url] : [],
    eventTypes: row.eventTypes ?? [],
    amenities: row.amenities ?? [],
    description: "",
    hostName: "",
    hostResponseRate: 0,
    hostResponseTime: "",
    reviews: [],
    faqs: [],
    coordinates: { lat: 0, lng: 0 },
    address: "",
    blockedDates: [],
  };
}

export default function FavoritesPage() {
  const { data: rows = [], isLoading } = useFavorites();
  const toggle = useToggleFavorite();

  const favorites = useMemo<Venue[]>(
    () => (rows as Parameters<typeof favoriteToVenue>[0][]).map(favoriteToVenue),
    [rows]
  );

  const handleRemove = (venueId: string) => {
    toggle.mutate({ listingId: venueId, currentlyFavorited: true });
  };

  if (isLoading) {
    return (
      <div>
        <div className="animate-pulse">
          <div className="h-8 w-40 rounded-lg bg-gray-200" />
          <div className="mt-2 h-4 w-64 rounded-lg bg-gray-200" />
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-gray-200 bg-white"
              />
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
          <h1 className="text-2xl font-bold text-gray-900">Saved Venues</h1>
          <p className="mt-1 text-sm text-gray-500">
            {favorites.length} venue{favorites.length !== 1 ? "s" : ""} in your
            wishlist
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#EB4D4B] hover:underline"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Browse more venues
        </Link>
      </div>

      {favorites.length === 0 ? (
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
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-600">
            No saved venues yet
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Heart a venue while browsing to save it here for later.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#EB4D4B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#dc2626]"
          >
            Browse Venues
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {favorites.map((venue) => (
            <div
              key={venue.id}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="relative h-48 w-full sm:h-auto sm:w-56 shrink-0 overflow-hidden bg-gray-200">
                  <Image
                    src={venue.thumbnailUrl}
                    alt={venue.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 224px"
                  />
                  {venue.halalVerified && (
                    <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#EB4D4B] px-2 py-0.5 text-xs font-semibold text-white">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      Halal
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#EB4D4B]">
                        {venue.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                        <svg
                          className="h-4 w-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {venue.location}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="h-4 w-4 text-amber-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">
                        {venue.rating}
                      </span>
                      <span className="text-sm text-gray-400">
                        ({venue.reviewCount})
                      </span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>
                      Up to {venue.capacity.toLocaleString()} guests
                    </span>
                    <span className="h-4 w-px bg-gray-200" />
                    <span>
                      {venue.eventTypes.join(", ")}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                    <span className="text-xl font-bold text-[#EB4D4B]">
                      {venue.currency} {venue.pricePerHour}
                      <span className="ml-1 text-sm font-normal text-gray-400">
                        /hour
                      </span>
                    </span>
                    <div className="flex-1" />
                    <Link
                      href={`/venues/${venue.slug}`}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/venues/${venue.slug}`}
                      className="rounded-xl bg-[#EB4D4B] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#dc2626]"
                    >
                      Book Now
                    </Link>
                    <button
                      onClick={() => handleRemove(venue.id)}
                      className="rounded-xl border border-gray-200 p-2 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-[#EB4D4B]"
                      aria-label={`Remove ${venue.title} from favorites`}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Quick Actions */}
          {favorites.length >= 2 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900">Quick Actions</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/compare"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#EB4D4B] bg-white px-5 py-2.5 text-sm font-bold text-[#EB4D4B] transition-colors hover:bg-[#EB4D4B]/5"
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
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                Compare Saved Venues
              </Link>
              <Link
                href="/dashboard/inquiries"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                View My Inquiries
              </Link>
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
