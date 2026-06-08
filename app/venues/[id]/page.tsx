"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useListing, useListings, type ApiListingDetail } from "@/hooks/use-listings";
import type { Venue } from "@/lib/types";
import StickyNav from "@/components/StickyNav";
import ImageGallery from "@/components/ImageGallery";
import VenueHeader from "@/components/VenueHeader";
import VenueOverview from "@/components/VenueOverview";
import AmenitiesGrid from "@/components/AmenitiesGrid";
import ReviewsSection from "@/components/ReviewsSection";
import FAQSection from "@/components/FAQSection";
import BookingCard from "@/components/BookingCard";
import RelatedVenues from "@/components/RelatedVenues";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import LocationMap from "@/components/LocationMap";
import Footer from "@/components/Footer";

function mapDetailToVenue(data: ApiListingDetail): Venue {
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    location: data.location || "",
    pricePerHour: Number(data.pricePerHour),
    currency: data.currency,
    capacity: data.capacity || 0,
    rating: Number(data.averageRating),
    reviewCount: data.reviewCount,
    halalVerified: data.halalCertified,
    thumbnailUrl:
      (data.photos || []).find((p) => p.isPrimary)?.url ||
      (data.photos || [])[0]?.url ||
      "",
    galleryUrls: (data.photos || []).map((p) => p.url),
    eventTypes: (data.eventTypes || []).map((e) => e.name),
    amenities: (data.amenities || []).map((a) => a.name),
    description: data.description || "",
    hostName: data.vendor?.businessName || "",
    hostAvatar: undefined,
    hostResponseRate: 0,
    hostResponseTime: "",
    reviews: (data.reviews || []).map((r) => ({
      id: r.id,
      reviewerName: r.customer.name,
      reviewerAvatar: r.customer.avatarUrl || undefined,
      rating: r.rating,
      date: r.createdAt,
      text: r.comment || "",
    })),
    faqs: [],
    coordinates: {
      lat: data.latitude != null ? Number(data.latitude) : 0,
      lng: data.longitude != null ? Number(data.longitude) : 0,
    },
    address: data.address || "",
    blockedDates: data.availability?.blockedDates || [],
  };
}

export default function VenueDetailPage() {
  const params = useParams();
  const slug = params.id as string;

  const {
    data: detailData,
    isLoading: detailLoading,
    error: detailError,
    refetch: refetchDetail,
  } = useListing(slug);

  // Related-venues query stays cheap by limiting to 4. The hook returns the
  // discovery-list response shape, so we map the same way as the grid.
  const { data: relatedData } = useListings(
    { type: "venue", limit: 4 },
    { enabled: Boolean(detailData) }
  );

  const venue = useMemo<Venue | null>(
    () => (detailData ? mapDetailToVenue(detailData) : null),
    [detailData]
  );

  const relatedVenues = useMemo<Venue[]>(() => {
    if (!detailData || !relatedData) return [];
    return relatedData.data
      .filter((item) => item.id !== detailData.id)
      .slice(0, 3)
      .map((item): Venue => ({
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
      }));
  }, [detailData, relatedData]);

  // Update the document title once the detail row resolves. Kept as an effect
  // so it stays accurate on client-side route changes.
  useEffect(() => {
    if (venue) document.title = `${venue.title} | EventVenue.Asia`;
  }, [venue]);

  const loading = detailLoading;
  // The new /api/v1/listings/[id] route returns a 404 when the slug is unknown
  // — surface that as the "not found" UI instead of the generic error state.
  const notFoundResult = Boolean(
    detailError && /404|not_found/i.test(detailError.message)
  );
  const error = detailError && !notFoundResult ? detailError : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StickyNav />
        <main className="isolate">
          <section className="container-custom py-6">
            <div className="h-[28rem] animate-pulse rounded-2xl bg-gray-200 lg:h-[32rem]" />
          </section>
          <section className="container-custom pb-4">
            <div className="space-y-3">
              <div className="h-8 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
          </section>
          <section className="container-custom pb-16">
            <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1 space-y-6">
                <div className="h-6 w-1/4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-96 w-full animate-pulse rounded-2xl bg-gray-200 lg:w-80 xl:w-96" />
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StickyNav />
        <main className="isolate">
          <div className="container-custom flex flex-col items-center justify-center py-24 text-center">
            <svg
              className="mb-4 h-16 w-16 text-red-400"
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
            <h2 className="text-xl font-bold text-gray-900">
              Something went wrong
            </h2>
            <p className="mt-2 text-gray-500">{error.message}</p>
            <button
              onClick={() => refetchDetail()}
              className="mt-6 rounded-xl bg-[#EB4D4B] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#dc2626]"
            >
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFoundResult || !venue) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StickyNav />
        <main className="isolate">
          <div className="container-custom flex flex-col items-center justify-center py-24 text-center">
            <svg
              className="mb-4 h-16 w-16 text-gray-300"
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
            <h2 className="text-xl font-bold text-gray-900">Venue Not Found</h2>
            <p className="mt-2 text-gray-500">
              The venue you are looking for does not exist or has been removed.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StickyNav />
      <main className="isolate">
        <section className="container-custom py-6">
          <ImageGallery images={venue.galleryUrls} title={venue.title} />
        </section>

        <section className="container-custom pb-4">
          <VenueHeader venue={venue} />
        </section>

        <section className="container-custom pb-16">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1 space-y-12">
              <VenueOverview venue={venue} />
              <AmenitiesGrid amenities={venue.amenities} />
            </div>

            <div className="w-full lg:w-80 xl:w-96">
              <BookingCard
                pricePerHour={venue.pricePerHour}
                currency={venue.currency}
                capacity={venue.capacity}
                halalVerified={venue.halalVerified}
                eventTypes={venue.eventTypes}
                venueId={venue.id}
                venueTitle={venue.title}
              />
            </div>
          </div>
        </section>

        <section className="container-custom pb-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              {venue.coordinates.lat !== 0 || venue.coordinates.lng !== 0 ? (
                <LocationMap
                  coordinates={venue.coordinates}
                  address={venue.address}
                  venueTitle={venue.title}
                />
              ) : (
                <section>
                  <h2 className="text-xl font-bold text-gray-900">Location</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {venue.address || "Address not provided"}
                  </p>
                  <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                    <p className="text-sm text-gray-500">
                      The vendor hasn&apos;t pinned this venue on a map yet.
                    </p>
                  </div>
                </section>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <AvailabilityCalendar blockedDates={venue.blockedDates} />
            </div>
          </div>
        </section>

        <section className="container-custom pb-16">
          <div className="space-y-12">
            <ReviewsSection
              reviews={venue.reviews}
              averageRating={venue.rating}
              totalReviews={venue.reviewCount}
            />
            <FAQSection faqs={venue.faqs} />
          </div>
        </section>

        <RelatedVenues venues={relatedVenues} />
      </main>
      <Footer />
    </div>
  );
}
