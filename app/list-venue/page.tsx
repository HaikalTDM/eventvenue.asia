"use client";

import { useState } from "react";
import Link from "next/link";
import StickyNav from "@/components/StickyNav";
import Footer from "@/components/Footer";

export default function ListVenuePage() {
  const [venueName, setVenueName] = useState("");
  const [venueType, setVenueType] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [hasHalal, setHasHalal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StickyNav />
        <main className="container-custom py-16">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Application Submitted!</h1>
            <p className="mt-3 text-sm text-gray-500">
              Thank you for listing your venue on EventVenue.Asia. Our team will review your application within 2-3 business days. You will receive an email confirmation once your venue is live.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#EB4D4B] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#dc2626]"
            >
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StickyNav />
      <main className="container-custom py-8 lg:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">List Your Venue</h1>
            <p className="mt-2 text-sm text-gray-500">
              Join hundreds of venue owners on EventVenue.Asia and reach thousands of event planners across Southeast Asia.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="venue-name" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Venue Name <span className="text-[#EB4D4B]">*</span>
                </label>
                <input
                  id="venue-name"
                  type="text"
                  required
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Grand Ballroom at The Majestic"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="venue-type" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Venue Type <span className="text-[#EB4D4B]">*</span>
                  </label>
                  <select
                    id="venue-type"
                    required
                    value={venueType}
                    onChange={(e) => setVenueType(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                  >
                    <option value="">Select type</option>
                    <option value="ballroom">Ballroom</option>
                    <option value="rooftop">Rooftop</option>
                    <option value="garden">Garden / Outdoor</option>
                    <option value="loft">Loft / Industrial</option>
                    <option value="hall">Hall / Convention</option>
                    <option value="restaurant">Restaurant / Private Dining</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-gray-700">
                    City <span className="text-[#EB4D4B]">*</span>
                  </label>
                  <select
                    id="location"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                  >
                    <option value="">Select city</option>
                    <option value="kl">Kuala Lumpur</option>
                    <option value="pj">Petaling Jaya</option>
                    <option value="johor">Johor Bahru</option>
                    <option value="penang">Penang</option>
                    <option value="singapore">Singapore</option>
                    <option value="bangkok">Bangkok</option>
                    <option value="jakarta">Jakarta</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="capacity" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Maximum Capacity <span className="text-[#EB4D4B]">*</span>
                </label>
                <input
                  id="capacity"
                  type="number"
                  required
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>

              <div>
                <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Venue Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your venue, its unique features, and what makes it special for events..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <label className="inline-flex cursor-pointer items-center gap-3">
                  <div
                    role="checkbox"
                    tabIndex={0}
                    aria-checked={hasHalal}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setHasHalal(!hasHalal);
                    }}
                    onClick={() => setHasHalal(!hasHalal)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                      hasHalal
                        ? "border-[#EB4D4B] bg-[#EB4D4B]"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {hasHalal && (
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    My venue offers halal-certified catering
                  </span>
                </label>
                {hasHalal && (
                  <p className="mt-2 text-xs text-amber-700">
                    You will need to provide your halal certification during the verification process.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#EB4D4B] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Venue Application"}
              </button>

              <p className="text-center text-xs text-gray-400">
                By submitting, you agree to our terms of service and venue listing policy.
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
