"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useListings } from "@/hooks/use-listings";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/lib/auth";
import type { ApiListing } from "@/lib/api";
import StickyNav from "@/components/StickyNav";
import Footer from "@/components/Footer";
import type { Venue } from "@/lib/types";

function apiListingToVenue(api: ApiListing): Venue {
  return {
    id: api.id,
    title: api.title,
    slug: api.slug,
    location: api.location ?? "",
    pricePerHour: parseFloat(api.pricePerHour ?? "0"),
    currency: api.currency,
    capacity: api.capacity ?? 0,
    rating: parseFloat(api.averageRating ?? "0"),
    reviewCount: api.reviewCount,
    halalVerified: api.halalCertified,
    thumbnailUrl: api.primaryPhoto?.url ?? "",
    galleryUrls: [],
    eventTypes: api.eventTypes,
    amenities: api.amenities,
    description: "",
    hostName: api.vendor?.businessName ?? "",
    hostAvatar: undefined,
    hostResponseRate: 0,
    hostResponseTime: "",
    reviews: [],
    faqs: [],
    coordinates: { lat: 0, lng: 0 },
    address: "",
    blockedDates: [],
  };
}

export default function ComparePage() {
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const [didSeed, setDidSeed] = useState(false);

  const {
    data: listingsRes,
    isLoading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useListings({ limit: 50 });
  const { data: favRows = [] } = useFavorites({ enabled: Boolean(user) });

  const allVenues: Venue[] = (listingsRes?.data ?? []).map(apiListingToVenue);
  const loading = listingsLoading;
  const error = listingsError ? listingsError.message : null;

  // Seed the comparison slots once: prefer the locally-stored mock list,
  // then fall back to the user's server-side favorites. Only runs once
  // per page load — after that selection is user-driven.
  useEffect(() => {
    if (didSeed || allVenues.length === 0) return;
    let favIds: string[] = [];
    try {
      const stored = localStorage.getItem("ev_mock_favorites");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((v: unknown) => typeof v === "string")) {
          favIds = parsed;
        }
      }
    } catch {}
    if (favIds.length === 0 && favRows.length > 0) {
      favIds = favRows.map((f: ApiListing) => f.id);
    }
    const existingIds = new Set(allVenues.map((v) => v.id));
    const validFavIds = favIds.filter((id) => existingIds.has(id));
    setSelectedIds(validFavIds.slice(0, 3));
    setDidSeed(true);
  }, [allVenues, favRows, didSeed]);

  const loadData = useCallback(() => {
    refetchListings();
  }, [refetchListings]);

  const selectedVenues = selectedIds
    .map((id) => allVenues.find((v) => v.id === id))
    .filter(Boolean) as Venue[];

  const toggleVenue = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredVenues = allVenues.filter((v) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.title.toLowerCase().includes(q) ||
      v.location.toLowerCase().includes(q)
    );
  });

  const compareRows: {
    label: string;
    render: (venue: Venue) => React.ReactNode;
    highlight?: (venues: Venue[]) => number | null;
  }[] = [
    {
      label: "Price / Hour",
      render: (v) => (
        <span className="text-lg font-bold text-[#EB4D4B]">
          {v.currency} {v.pricePerHour}
        </span>
      ),
      highlight: (venues) => {
        const min = Math.min(...venues.map((v) => v.pricePerHour));
        return venues.findIndex((v) => v.pricePerHour === min);
      },
    },
    {
      label: "Max Capacity",
      render: (v) => (
        <span className="text-base font-semibold text-gray-900">
          {v.capacity.toLocaleString()} guests
        </span>
      ),
      highlight: (venues) => {
        const max = Math.max(...venues.map((v) => v.capacity));
        return venues.findIndex((v) => v.capacity === max);
      },
    },
    {
      label: "Rating",
      render: (v) => (
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-base font-semibold text-gray-900">{v.rating}</span>
          <span className="text-sm text-gray-400">({v.reviewCount})</span>
        </div>
      ),
      highlight: (venues) => {
        const max = Math.max(...venues.map((v) => v.rating));
        return venues.findIndex((v) => v.rating === max);
      },
    },
    {
      label: "Location",
      render: (v) => <span className="text-sm text-gray-600">{v.location}</span>,
    },
    {
      label: "Halal Verified",
      render: (v) =>
        v.halalVerified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#EB4D4B]/10 px-2.5 py-1 text-xs font-semibold text-[#EB4D4B]">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Halal Verified
          </span>
        ) : (
          <span className="text-sm text-gray-400">Not certified</span>
        ),
    },
    {
      label: "Event Types",
      render: (v) => (
        <div className="flex flex-wrap gap-1.5">
          {v.eventTypes.map((type) => (
            <span key={type} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              {type}
            </span>
          ))}
        </div>
      ),
    },
    {
      label: "Amenities",
      render: (v) => (
        <ul className="space-y-1.5">
          {v.amenities.map((a) => (
            <li key={a} className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {a}
            </li>
          ))}
        </ul>
      ),
    },
    {
      label: "Host Response",
      render: (v) => (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-900">{v.hostResponseRate}% response rate</p>
          <p className="text-xs text-gray-400">{v.hostResponseTime}</p>
        </div>
      ),
    },
  ];

  const getHighlightIndex = (rowIndex: number): number | null => {
    const row = compareRows[rowIndex];
    if (!row.highlight) return null;
    return row.highlight(selectedVenues);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StickyNav />
        <main>
          <div className="container-custom py-5">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <svg className="mx-auto h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="mt-3 text-sm font-semibold text-red-700">Failed to load venues</h3>
              <p className="mt-1 text-xs text-red-500">{error}</p>
              <button
                onClick={loadData}
                className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StickyNav />
        <main>
          <div className="container-custom py-5">
            <div className="animate-pulse">
              <div className="h-8 w-48 rounded-lg bg-gray-200" />
              <div className="mt-2 h-4 w-72 rounded-lg bg-gray-200" />
              <div className="mt-4 flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 w-36 rounded-full bg-gray-200" />
                ))}
              </div>
              <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2">
                <table className="w-full">
                  <thead>
                    <tr>
                      <td className="w-36 p-4">
                        <div className="h-4 w-16 rounded bg-gray-200" />
                      </td>
                      {[1, 2, 3].map((i) => (
                        <td key={i} className="p-4">
                          <div className="aspect-video w-full rounded-xl bg-gray-200" />
                          <div className="mt-3 h-4 w-32 rounded bg-gray-200" />
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((row) => (
                      <tr key={row} className="border-t border-gray-100">
                        <td className="p-4">
                          <div className="h-4 w-24 rounded bg-gray-200" />
                        </td>
                        {[1, 2, 3].map((col) => (
                          <td key={col} className="p-4">
                            <div className="h-4 w-20 rounded bg-gray-200" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StickyNav />

      <main>
        <div className="border-b border-gray-200 bg-white">
          <div className="container-custom py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compare Venues</h1>
              <p className="mt-1 text-sm text-gray-500">
                Select up to 3 venues to compare side by side
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#EB4D4B] hover:underline"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Browse more venues
            </Link>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {selectedVenues.map((venue) => (
                <span
                  key={venue.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#EB4D4B] px-4 py-2 text-sm font-medium text-white shadow-sm"
                >
                  {venue.title.length > 28
                    ? venue.title.substring(0, 28) + "..."
                    : venue.title}
                  <button
                    onClick={() => toggleVenue(venue.id)}
                    className="ml-1 rounded-full p-0.5 transition-colors hover:bg-white/20"
                    aria-label={`Remove ${venue.title}`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}

              {selectedIds.length < 3 && (
                <div ref={searchRef} className="relative">
                  <button
                    onClick={() => setSearchOpen(!searchOpen)}
                    className="inline-flex items-center gap-2 rounded-full border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-[#EB4D4B] hover:text-[#EB4D4B]"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add venue
                  </button>

                  {searchOpen && (
                    <div className="absolute left-0 top-full z-30 mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl">
                      <div className="border-b border-gray-100 p-3">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search venues..."
                          autoFocus
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                        />
                      </div>
                      <ul className="max-h-64 overflow-y-auto p-2">
                        {filteredVenues.length === 0 ? (
                          <li className="px-3 py-4 text-center text-sm text-gray-400">
                            No venues found
                          </li>
                        ) : (
                          filteredVenues.map((venue) => {
                            const isSelected = selectedIds.includes(venue.id);
                            return (
                              <li key={venue.id}>
                                <button
                                  onClick={() => {
                                    if (!isSelected) {
                                      toggleVenue(venue.id);
                                      if (selectedIds.length >= 2) setSearchOpen(false);
                                      setSearchQuery("");
                                    }
                                  }}
                                  disabled={isSelected}
                                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                                    isSelected
                                      ? "cursor-default bg-gray-50 text-gray-300"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                                    <Image
                                      src={venue.thumbnailUrl}
                                      alt=""
                                      width={56}
                                      height={40}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{venue.title}</p>
                                    <p className="text-xs text-gray-400">{venue.location} · {venue.currency} {venue.pricePerHour}/hr</p>
                                  </div>
                                  {isSelected && (
                                    <svg className="h-4 w-4 shrink-0 text-[#EB4D4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              </li>
                            );
                          })
                        )}
                      </ul>
                      <div className="border-t border-gray-100 px-4 py-2">
                        <p className="text-xs text-gray-400">
                          {3 - selectedIds.length} slot{3 - selectedIds.length !== 1 ? "s" : ""} remaining
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="container-custom py-8">
        {selectedVenues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-600">
              No venues selected
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Select up to 3 venues above to start comparing.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  <th className="w-36 p-4 text-left text-sm font-bold uppercase tracking-wider text-gray-400">
                    Feature
                  </th>
                  {selectedVenues.map((venue) => (
                    <th key={venue.id} className="w-1/3 p-4">
                      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="aspect-video w-full overflow-hidden rounded-xl bg-gray-200">
                          <Image
                            src={venue.thumbnailUrl}
                            alt={venue.title}
                            width={400}
                            height={225}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <h3 className="mt-3 line-clamp-2 text-base font-bold text-gray-900">
                          {venue.title}
                        </h3>
                        <Link
                          href={`/venues/${venue.slug}`}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#EB4D4B] hover:underline"
                        >
                          View Details
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {compareRows.map((row, rowIndex) => {
                  const highlightIdx = getHighlightIndex(rowIndex);
                  return (
                    <tr key={row.label} className="border-t border-gray-100">
                      <td className="p-4 text-sm font-semibold text-gray-500">
                        {row.label}
                      </td>
                      {selectedVenues.map((venue, colIdx) => (
                        <td
                          key={venue.id}
                          className={`p-4 ${
                            highlightIdx === colIdx
                              ? "rounded-xl bg-green-50/50"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {row.render(venue)}
                            {highlightIdx === colIdx && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                Best
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}

                <tr className="border-t border-gray-100">
                  <td className="p-4" />
                  {selectedVenues.map((venue) => (
                    <td key={venue.id} className="p-4">
                      <div className="space-y-2">
                        <Link
                          href={`/venues/${venue.slug}`}
                          className="block w-full rounded-xl border-2 border-[#EB4D4B] bg-white px-4 py-2.5 text-center text-sm font-bold text-[#EB4D4B] transition-colors hover:bg-[#EB4D4B]/5"
                        >
                          Send Inquiry
                        </Link>
                        <Link
                          href={`/venues/${venue.slug}`}
                          className="block w-full rounded-xl bg-[#EB4D4B] px-4 py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-[#dc2626]"
                        >
                          Book Now
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
      </main>

      <Footer />
    </div>
  );
}
