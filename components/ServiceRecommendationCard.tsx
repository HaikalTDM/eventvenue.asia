"use client";

import Image from "next/image";
import type { ScoredService } from "@/lib/types";

interface ServiceRecommendationCardProps {
  scoredService: ScoredService;
  isSelected: boolean;
  onToggleSelect: (serviceId: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  catering: "\uD83C\uDF7D\uFE0F",
  photography: "\uD83D\uDCF7",
  videography: "\uD83C\uDFAC",
  dj_entertainment: "\uD83C\uDFB5",
  decoration: "\uD83C\uDFA8",
  makeup: "\uD83D\uDC84",
  planning: "\uD83D\uDCCB",
  photobooth: "\uD83D\uDCF8",
  ice_cream: "\uD83C\uDF66",
  florist: "\uD83D\uDC90",
  cake: "\uD83C\uDF82",
  transport: "\uD83D\uDE97",
  emcee: "\uD83C\uDFA4",
  live_band: "\uD83C\uDFB8",
  lighting: "\uD83D\uDCA1",
  bridal: "\uD83D\uDC70",
  henna: "\u270B",
};

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

export default function ServiceRecommendationCard({ scoredService, isSelected, onToggleSelect }: ServiceRecommendationCardProps) {
  const { service, package: pkg, score, matchReasons, estimatedCost } = scoredService;
  const categoryLabel = CATEGORY_LABELS[service.category] || service.category;
  const categoryIcon = CATEGORY_ICONS[service.category] || "\uD83D\uDD27";

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 cursor-pointer ${
        isSelected
          ? "border-[#EB4D4B] ring-2 ring-[#EB4D4B]/30 shadow-md"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
      onClick={() => onToggleSelect(service.id)}
    >
      <div className="absolute right-4 top-4 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(service.id);
          }}
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
            isSelected
              ? "border-[#EB4D4B] bg-[#EB4D4B] text-white"
              : "border-gray-300 bg-white hover:border-[#EB4D4B]"
          }`}
          aria-label={isSelected ? "Deselect service" : "Select service"}
        >
          {isSelected && (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex gap-5 p-5">
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-200">
          <Image
            src={service.thumbnailUrl}
            alt={service.title}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                <span>{categoryIcon}</span>
                <span>{categoryLabel}</span>
              </div>
              <h4 className="mt-0.5 text-sm font-bold text-gray-900 line-clamp-1">{service.title}</h4>
            </div>
            <span className="flex-shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
              {Math.round(score)}% match
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-sm">
              <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold">{service.rating}</span>
              <span className="text-gray-400">({service.reviewCount})</span>
            </span>
            {service.halalCertified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Halal
              </span>
            )}
          </div>

          {pkg && (
            <p className="mt-1.5 text-xs text-gray-500">
              <span className="font-semibold text-gray-700">{pkg.name}:</span>{" "}
              {pkg.description}
            </p>
          )}

          {matchReasons.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {matchReasons.slice(0, 3).map((reason, i) => (
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
          {pkg ? (
            <>
              <span className="text-lg font-bold text-[#EB4D4B]">
                {pkg.currency} {pkg.price.toLocaleString()}
              </span>
              <span className="ml-1 text-xs text-gray-400">{pkg.unit === "per_event" ? "/event" : pkg.unit === "hourly" ? "/hr" : "/package"}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400">Contact for pricing</span>
          )}
        </div>
        {isSelected ? (
          <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            Selected
          </span>
        ) : (
          <span className="text-xs text-gray-400">Click card to select</span>
        )}
      </div>
    </article>
  );
}
