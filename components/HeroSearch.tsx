"use client";

import { useState, useRef, useEffect } from "react";
import type { SearchState } from "@/lib/types";
import CustomDatePicker from "@/components/CustomDatePicker";

const locationOptions = [
  { label: "All Locations", key: "" },
  { label: "Kuala Lumpur", key: "kl" },
  { label: "Petaling Jaya", key: "pj" },
  { label: "Johor Bahru", key: "johor" },
  { label: "Penang", key: "penang" },
  { label: "Singapore", key: "singapore" },
  { label: "Bangkok", key: "bangkok" },
  { label: "Jakarta", key: "jakarta" },
];

const uniqueCountries = 4;

interface HeroSearchProps {
  search: SearchState;
  onSearchChange: (search: SearchState) => void;
}

export default function HeroSearch({ search, onSearchChange }: HeroSearchProps) {
  const [locationOpen, setLocationOpen] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const selectedLoc =
    locationOptions.find((o) => o.key === search.location) ||
    locationOptions[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        locationRef.current &&
        !locationRef.current.contains(e.target as Node)
      ) {
        setLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="relative bg-gradient-to-b from-white to-gray-50 py-16 lg:py-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#EB4D4B] opacity-5 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-[#EB4D4B] opacity-5 blur-3xl" />
      </div>

      <div className="container-custom relative">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Find & Book Premium Event Venues in{" "}
            <span className="text-[#EB4D4B]">Southeast Asia</span>
          </h1>
          <p className="mt-4 text-base text-gray-500 sm:text-lg">
            Discover verified, high-quality spaces for weddings, corporate
            gatherings, and private celebrations across the region.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-lg sm:p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative" ref={locationRef}>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Location
                </label>
                <button
                  type="button"
                  onClick={() => setLocationOpen(!locationOpen)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 outline-none transition hover:border-gray-300 focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                >
                  <span className="truncate">{selectedLoc.label}</span>
                  <svg
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                      locationOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {locationOpen && (
                  <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                    <ul className="max-h-56 overflow-y-auto">
                      {locationOptions.map((opt) => (
                        <li key={opt.key}>
                          <button
                            type="button"
                            onClick={() => {
                              onSearchChange({ ...search, location: opt.key });
                              setLocationOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                              opt.key === search.location
                                ? "bg-red-50 font-semibold text-[#EB4D4B]"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Event Date
                </label>
                <CustomDatePicker
                  value={search.eventDate}
                  onChange={(val) =>
                    onSearchChange({ ...search, eventDate: val })
                  }
                  placeholder="Pick a date"
                  minDate={new Date().toISOString().split("T")[0]}
                  id="event-date"
                />
              </div>

              <div>
                <label
                  htmlFor="guests"
                  className="mb-1 block text-xs font-medium text-gray-500"
                >
                  Guest Capacity
                </label>
                <input
                  id="guests"
                  type="number"
                  min={1}
                  placeholder="e.g. 200"
                  value={search.guestCapacity || ""}
                  onChange={(e) =>
                    onSearchChange({
                      ...search,
                      guestCapacity: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>

              <div className="flex items-end">
                <a
                  href="#venues"
                  className="w-full rounded-xl bg-[#EB4D4B] px-6 py-3 text-center text-sm font-semibold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] hover:shadow-lg hover:shadow-[#EB4D4B]/30 active:scale-[0.98]"
                >
                  Search Venues
                </a>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center border-t border-gray-100 pt-4">
              <button
                onClick={() =>
                  onSearchChange({ ...search, halalOnly: !search.halalOnly })
                }
                className={`inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  search.halalOnly
                    ? "bg-[#EB4D4B] text-white shadow-md shadow-[#EB4D4B]/25"
                    : "border border-gray-200 bg-gray-50 text-gray-600 hover:border-[#EB4D4B] hover:text-[#EB4D4B]"
                }`}
                aria-pressed={search.halalOnly}
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Halal Certified Verification
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex items-center justify-center gap-6 text-sm text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <svg
              className="h-4 w-4 text-[#EB4D4B]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Top Rated
          </span>
          <span className="h-4 w-px bg-gray-200" />
          <span>100+ Venues</span>
          <span className="h-4 w-px bg-gray-200" />
          <span>{uniqueCountries} SEA Countries</span>
        </div>
      </div>
    </section>
  );
}
