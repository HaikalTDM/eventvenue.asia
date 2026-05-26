"use client";

import Link from "next/link";
import Image from "next/image";
import type { ScoredVenue } from "@/lib/types";

interface VenueRecommendationCardProps {
  scoredVenue: ScoredVenue;
  isSelected: boolean;
  onToggleSelect: (venueId: string) => void;
}

export default function VenueRecommendationCard({ scoredVenue, isSelected, onToggleSelect }: VenueRecommendationCardProps) {
  const { venue, score, matchReasons, estimatedCost, isBestMatch } = scoredVenue;

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 cursor-pointer ${
        isSelected
          ? "border-[#EB4D4B] ring-2 ring-[#EB4D4B]/30 shadow-md"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
      onClick={() => onToggleSelect(venue.id)}
    >
      <div className="absolute right-4 top-4 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(venue.id);
          }}
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
            isSelected
              ? "border-[#EB4D4B] bg-[#EB4D4B] text-white"
              : "border-gray-300 bg-white hover:border-[#EB4D4B]"
          }`}
          aria-label={isSelected ? "Deselect venue" : "Select venue"}
        >
          {isSelected && (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>
      {isBestMatch && (
        <div className="absolute left-0 top-0 z-10 flex items-center gap-1 rounded-br-xl bg-[#EB4D4B] px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Best Match
        </div>
      )}

      <div className="flex gap-5 p-5 pr-12">
        <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-gray-200">
          <Image
            src={venue.thumbnailUrl}
            alt={venue.title}
            fill
            className="object-cover"
            sizes="112px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-base font-bold text-gray-900 line-clamp-1">{venue.title}</h4>
              <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <svg className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{venue.location}</span>
              </div>
            </div>
            <span className="flex-shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
              {Math.round(score)}% match
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-sm">
              <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold">{venue.rating}</span>
              <span className="text-gray-400">({venue.reviewCount})</span>
            </span>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm text-gray-600">{venue.capacity.toLocaleString()} guests</span>
            {venue.halalVerified && (
              <>
                <span className="text-sm text-gray-400">|</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Halal
                </span>
              </>
            )}
          </div>

          {matchReasons.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {matchReasons.map((reason, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    reason.type === "positive"
                      ? "bg-emerald-50 text-emerald-700"
                      : reason.type === "warning"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {reason.type === "positive" && (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {reason.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3">
        <div>
          <span className="text-lg font-bold text-[#EB4D4B]">
            {venue.currency} {venue.pricePerHour}
          </span>
          <span className="ml-1 text-xs text-gray-400">/hour</span>
          <span className="ml-2 text-xs text-gray-400">
            ~{venue.currency} {estimatedCost.toLocaleString()} est.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/venues/${venue.slug}`}
            className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-all hover:border-[#EB4D4B] hover:text-[#EB4D4B]"
          >
            View Details
          </Link>
          {isSelected && (
            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              Selected
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
