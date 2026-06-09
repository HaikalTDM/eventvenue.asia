"use client";

import { useMemo, useState } from "react";

import { useListings } from "@/hooks/use-listings";
import type { ApiListing } from "@/lib/api";
import ServiceCard, { type ServiceCardData } from "@/components/ServiceCard";

/**
 * Browsable services section for the homepage. Mirrors VenueGridWithFilters but
 * for `listing_type = "service"`, with a category chip filter instead of the
 * venue sidebar. Category metadata is kept in sync with the ServiceCategory
 * union in lib/types.ts and the label maps in the planner components.
 */

const CATEGORY_LABELS: Record<string, string> = {
  catering: "Catering",
  photography: "Photography",
  videography: "Videography",
  dj_entertainment: "DJ & Entertainment",
  decoration: "Decoration",
  makeup: "Makeup & Styling",
  planning: "Event Planning",
  photobooth: "Photobooth Rental",
  ice_cream: "Ice Cream Catering",
  florist: "Florist & Bouquets",
  cake: "Cake & Desserts",
  transport: "Bridal Car & Transport",
  emcee: "Emcee / Host",
  live_band: "Live Band",
  lighting: "Lighting & Sound",
  bridal: "Bridal Wear & Rental",
  henna: "Henna / Inai Art",
};

function labelFor(category: string | null): string {
  if (!category) return "Service";
  return CATEGORY_LABELS[category] ?? "Service";
}

function mapToServiceCard(item: ApiListing): ServiceCardData {
  const category = item.serviceCategory ?? null;
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    location: item.location ?? "",
    category,
    categoryLabel: labelFor(category),
    rating: Number(item.averageRating) || 0,
    reviewCount: item.reviewCount ?? 0,
    halalCertified: item.halalCertified,
    thumbnailUrl: item.primaryPhoto?.url ?? "",
    providerName: item.vendor?.businessName ?? "",
  };
}

export default function ServicesSection() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useListings({
    type: "service",
    limit: 50,
  });

  const services = useMemo(
    () => (data?.data ?? []).map(mapToServiceCard),
    [data]
  );

  // Build the category chip list from the categories that actually have
  // services, so the demo never shows an empty filter.
  const availableCategories = useMemo(() => {
    const present = new Set<string>();
    for (const s of services) {
      if (s.category) present.add(s.category);
    }
    return Array.from(present).sort((a, b) =>
      labelFor(a).localeCompare(labelFor(b))
    );
  }, [services]);

  const filtered = useMemo(
    () =>
      activeCategory
        ? services.filter((s) => s.category === activeCategory)
        : services,
    [services, activeCategory]
  );

  if (error) {
    return (
      <section id="services" className="bg-gray-50 py-16 lg:py-24">
        <div className="container-custom">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Wedding & Event Services
            </h2>
            <p className="mt-2 text-gray-500">
              Vendors to complete your event — catering, photography, and more.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 py-16 text-center">
            <p className="text-gray-600">{error.message}</p>
            <button
              onClick={() => refetch()}
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
    <section id="services" className="bg-gray-50 py-16 lg:py-24">
      <div className="container-custom">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Wedding & Event Services
          </h2>
          <p className="mt-2 text-gray-500">
            Vendors to complete your event — from catering and photography to
            photobooths, ice cream carts, and more.
          </p>
        </div>

        {availableCategories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === null
                  ? "bg-[#EB4D4B] text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-[#EB4D4B] hover:text-[#EB4D4B]"
              }`}
            >
              All Services
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-[#EB4D4B] text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-[#EB4D4B] hover:text-[#EB4D4B]"
                }`}
              >
                {labelFor(cat)}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <p className="text-lg font-semibold text-gray-600">No services found</p>
            <p className="mt-1 text-sm text-gray-400">
              {activeCategory
                ? "Try a different category."
                : "Check back soon — vendors are being added."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
