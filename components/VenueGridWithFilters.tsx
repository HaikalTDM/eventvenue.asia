"use client";

import { useState, useEffect, useCallback } from "react";
import type { FilterState, Venue, SearchState } from "@/lib/types";
import { getListings } from "@/lib/api";
import type { ApiListingsResponse, ApiListing } from "@/lib/api";
import { useDataMode } from "@/lib/data-mode";
import { mockVenues, amenityOptions, eventTypeOptions } from "@/lib/mock-data";
import SidebarFilter from "@/components/SidebarFilter";
import VenueGrid from "@/components/VenueGrid";

function mapListingToVenue(item: ApiListing): Venue {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    location: item.location || "",
    pricePerHour: Number(item.pricePerHour),
    currency: item.currency,
    capacity: item.capacity || 0,
    rating: Number(item.averageRating),
    reviewCount: item.reviewCount,
    halalVerified: item.halalCertified,
    thumbnailUrl: item.primaryPhoto?.url || "",
    galleryUrls: item.primaryPhoto ? [item.primaryPhoto.url] : [],
    eventTypes: item.eventTypes,
    amenities: item.amenities,
    description: "",
    hostName: item.vendor?.businessName || "",
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

interface VenueGridWithFiltersProps {
  search?: SearchState;
}

const defaultSearch: SearchState = {
  location: "",
  eventDate: "",
  guestCapacity: 0,
  halalOnly: false,
};

export default function VenueGridWithFilters({
  search = defaultSearch,
}: VenueGridWithFiltersProps) {
  const { mode } = useDataMode();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amenityFilterOptions, setAmenityFilterOptions] = useState<
    { label: string; key: string }[]
  >([]);
  const [eventTypeFilterOptions, setEventTypeFilterOptions] = useState<
    { label: string; key: string }[]
  >([]);
  const [filters, setFilters] = useState<FilterState>({
    amenities: [],
    eventTypes: [],
    showHalalOnly: false,
  });

  const locationKeyMap: Record<string, string> = {
    kl: "Kuala Lumpur",
    pj: "Petaling Jaya",
    johor: "Johor Bahru",
    penang: "Penang",
    singapore: "Singapore",
    bangkok: "Bangkok",
    jakarta: "Jakarta",
  };

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (mode === "mock") {
      let filtered = mockVenues;
      if (search.location) {
        const locationStr = locationKeyMap[search.location];
        if (locationStr) {
          filtered = filtered.filter((v) =>
            v.location.toLowerCase().includes(locationStr.toLowerCase())
          );
        }
      }
      if (search.halalOnly) {
        filtered = filtered.filter((v) => v.halalVerified);
      }
      if (search.guestCapacity > 0) {
        filtered = filtered.filter((v) => v.capacity >= search.guestCapacity);
      }
      setVenues(filtered);
      setAmenityFilterOptions(amenityOptions);
      setEventTypeFilterOptions(eventTypeOptions);
      setLoading(false);
      return;
    }

    try {
      const params: Record<string, string> = {
        type: "venue",
        limit: "20",
      };

      if (search.location) {
        const locationStr = locationKeyMap[search.location];
        if (locationStr) {
          params.location = locationStr;
        }
      }

      if (search.halalOnly) {
        params.halalCertified = "true";
      }

      if (search.guestCapacity > 0) {
        params.capacity = String(search.guestCapacity);
      }

      const response: ApiListingsResponse = await getListings(params);

      const mappedVenues = response.data.map(mapListingToVenue);
      setVenues(mappedVenues);

      if (response.filters) {
        const amenityOpts = (response.filters.amenities || []).map((a) => ({
          label: a.name,
          key: a.name.toLowerCase().replace(/\s+/g, "_"),
        }));
        const eventTypeOpts = (response.filters.eventTypes || []).map((e) => ({
          label: e.name,
          key: e.name.toLowerCase().replace(/\s+/g, "_"),
        }));
        setAmenityFilterOptions(amenityOpts);
        setEventTypeFilterOptions(eventTypeOpts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load venues");
    } finally {
      setLoading(false);
    }
  }, [search.location, search.halalOnly, search.guestCapacity]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const amenityKeys = filters.amenities;
  const eventTypeKeys = filters.eventTypes;

  const filteredVenues =
    amenityKeys.length === 0 &&
    eventTypeKeys.length === 0 &&
    !filters.showHalalOnly
      ? venues
      : venues.filter((venue) => {
          if (filters.showHalalOnly && !venue.halalVerified) {
            return false;
          }

          if (amenityKeys.length > 0) {
            const venueAmenitiesLower = venue.amenities.map((a) =>
              a.toLowerCase()
            );
            const hasAll = amenityKeys.every((filterKey) => {
              const matchOpt = amenityFilterOptions.find(
                (o) => o.key === filterKey
              );
              if (!matchOpt) return false;
              return venueAmenitiesLower.includes(matchOpt.label.toLowerCase());
            });
            if (!hasAll) return false;
          }

          if (eventTypeKeys.length > 0) {
            const venueTypesLower = venue.eventTypes.map((t) =>
              t.toLowerCase()
            );
            const hasMatch = eventTypeKeys.some((filterKey) => {
              const matchOpt = eventTypeFilterOptions.find(
                (o) => o.key === filterKey
              );
              if (!matchOpt) return false;
              return venueTypesLower.includes(matchOpt.label.toLowerCase());
            });
            if (!hasMatch) return false;
          }

          return true;
        });

  if (error) {
    return (
      <section id="venues" className="py-16 lg:py-24">
        <div className="container-custom">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Featured Venues
            </h2>
            <p className="mt-2 text-gray-500">
              Hand-picked event spaces verified for quality and compliance.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 py-16 text-center">
            <svg
              className="mb-4 h-12 w-12 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchVenues}
              className="mt-4 rounded-xl bg-[#EB4D4B] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#dc2626]"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="venues" className="py-16 lg:py-24">
      <div className="container-custom">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Featured Venues
          </h2>
          <p className="mt-2 text-gray-500">
            Hand-picked event spaces verified for quality and compliance.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <SidebarFilter
            amenities={amenityFilterOptions}
            eventTypes={eventTypeFilterOptions}
            filters={filters}
            onFiltersChange={setFilters}
          />
          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-80 animate-pulse rounded-2xl bg-gray-200"
                  />
                ))}
              </div>
            ) : filteredVenues.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
                <svg
                  className="mb-4 h-12 w-12 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-lg font-semibold text-gray-600">
                  No venues found
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <VenueGrid venues={filteredVenues} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
