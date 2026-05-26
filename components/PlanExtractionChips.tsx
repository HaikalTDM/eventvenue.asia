"use client";

import type { PlanExtraction } from "@/lib/types";

interface PlanExtractionChipsProps {
  extraction: PlanExtraction;
}

const EVENT_TYPE_ICON: Record<string, string> = {
  Wedding: "\uD83D\uDC92",
  Corporate: "\uD83C\uDFE2",
  "Private Party": "\uD83C\uDF89",
  Birthday: "\uD83C\uDF82",
  Launch: "\uD83D\uDE80",
  Seminar: "\uD83C\uDF93",
};

export default function PlanExtractionChips({ extraction }: PlanExtractionChipsProps) {
  const chips: { label: string; icon: string; value: string }[] = [];

  if (extraction.eventType) {
    chips.push({
      label: "Event",
      icon: EVENT_TYPE_ICON[extraction.eventType] || "\uD83D\uDCCB",
      value: extraction.eventType,
    });
  }

  if (extraction.guestCount) {
    const value = extraction.guestCount.max > 0
      ? `${extraction.guestCount.min}\u2013${extraction.guestCount.max} guests`
      : `${extraction.guestCount.min}+ guests`;
    chips.push({ label: "Guests", icon: "\uD83D\uDC65", value });
  }

  if (extraction.location) {
    chips.push({ label: "Location", icon: "\uD83D\uDCCD", value: extraction.location });
  }

  if (extraction.budget) {
    chips.push({
      label: "Budget",
      icon: "\uD83D\uDCB0",
      value: `${extraction.budget.currency} ${extraction.budget.amount.toLocaleString()}`,
    });
  }

  if (extraction.halalRequired) {
    chips.push({ label: "Halal", icon: "\u2714\uFE0F", value: "Halal Required" });
  }

  if (extraction.services.length > 0) {
    chips.push({
      label: "Services",
      icon: "\uD83D\uDD27",
      value: extraction.services.map((s) => s.replace(/_/g, " ")).join(", "),
    });
  }

  if (extraction.amenities.length > 0) {
    chips.push({
      label: "Amenities",
      icon: "\u2728",
      value: extraction.amenities.join(", "),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mx-auto mt-6 max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          We understood
        </span>
        {chips.map((chip) => (
          <span
            key={chip.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700"
          >
            <span>{chip.icon}</span>
            <span className="text-gray-400">{chip.label}:</span>
            <span>{chip.value}</span>
          </span>
        ))}
        {extraction.confidence.overall < 0.5 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Some details unclear
          </span>
        )}
      </div>
    </div>
  );
}
