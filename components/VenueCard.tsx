"use client";

import { useState } from "react";
import { useFavorites } from "@/lib/favorites";
import { useAuth } from "@/lib/auth";
import type { Venue } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";

interface VenueCardProps {
  venue: Venue;
}

export default function VenueCard({ venue }: VenueCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const isFavorited = isFavorite(venue.id);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const handleFavoriteClick = () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    toggleFavorite(venue.id);
  };

  return (
    <>
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/50">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-200">
        <Image
          src={venue.thumbnailUrl}
          alt={venue.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Favorite Heart */}
        <button
          onClick={handleFavoriteClick}
          className="absolute left-3 bottom-3 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <svg
            className={`h-5 w-5 transition-colors ${
              isFavorited
                ? "fill-[#EB4D4B] text-[#EB4D4B]"
                : "text-gray-400 hover:text-[#EB4D4B]"
            }`}
            fill={isFavorited ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {/* Halal Verified Badge */}
        {venue.halalVerified && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#EB4D4B] px-2.5 py-1 text-xs font-semibold text-white shadow-md">
            <svg
              className="h-3.5 w-3.5"
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
            Halal Verified
          </div>
        )}

        {/* Capacity Badge */}
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">
          Up to {venue.capacity.toLocaleString()} guests
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="line-clamp-1 text-base font-bold text-gray-900 group-hover:text-[#EB4D4B]">
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
          <span>{venue.location}</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
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
            ({venue.reviewCount} reviews)
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <span className="text-xl font-bold text-[#EB4D4B]">
              {venue.currency} {venue.pricePerHour}
            </span>
            <span className="ml-1 text-sm text-gray-400">/hour</span>
          </div>
          <Link
            href={`/venues/${venue.slug}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all hover:border-[#EB4D4B] hover:bg-[#EB4D4B] hover:text-white group-hover:border-[#EB4D4B]"
            aria-label={`View details for ${venue.title}`}
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </article>

    {showAuthPrompt && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
        onClick={() => setShowAuthPrompt(false)}
      >
        <div
          className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-[#EB4D4B]">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Sign in to save venues</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create an account or sign in to save your favorite venues and access them anytime.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/sign-in"
              onClick={() => setShowAuthPrompt(false)}
              className="w-full rounded-xl bg-[#EB4D4B] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#dc2626]"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              onClick={() => setShowAuthPrompt(false)}
              className="w-full rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
