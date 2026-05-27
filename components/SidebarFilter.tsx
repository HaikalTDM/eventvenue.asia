"use client";

import { useState } from "react";
import type { FilterState, FilterOption } from "@/lib/types";

interface SidebarFilterProps {
  amenities: FilterOption[];
  eventTypes: FilterOption[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

type FilterGroupKey = "amenities" | "eventTypes";

export default function SidebarFilter({
  amenities,
  eventTypes,
  filters,
  onFiltersChange,
}: SidebarFilterProps) {
  const handleToggle = (
    group: FilterGroupKey | "halalOnly",
    value: string
  ) => {
    if (group === "halalOnly") {
      onFiltersChange({ ...filters, showHalalOnly: !filters.showHalalOnly });
      return;
    }

    const currentValues = filters[group];
    const updated = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFiltersChange({ ...filters, [group]: updated });
  };

  return (
    <aside className="w-full lg:w-72 xl:w-80">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Filters</h3>
          <button
            onClick={() =>
              onFiltersChange({
                amenities: [],
                eventTypes: [],
                showHalalOnly: false,
              })
            }
            className="text-xs font-medium text-[#EB4D4B] hover:underline"
          >
            Reset All
          </button>
        </div>

        <div className="mb-6 rounded-xl bg-gray-50 p-4">
          <label className="inline-flex cursor-pointer items-center gap-3">
            <div
              role="checkbox"
              tabIndex={0}
              aria-checked={filters.showHalalOnly}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleToggle("halalOnly", "");
              }}
              onClick={() => handleToggle("halalOnly", "")}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                filters.showHalalOnly
                  ? "border-[#EB4D4B] bg-[#EB4D4B]"
                  : "border-gray-300 bg-white"
              }`}
            >
              {filters.showHalalOnly && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-semibold text-gray-800">
              Halal Verified Only
            </span>
          </label>
        </div>

        <FilterGroup
          title="Amenities"
          options={amenities}
          selected={filters.amenities}
          onToggle={(key) => handleToggle("amenities", key)}
        />

        <FilterGroup
          title="Event Types"
          options={eventTypes}
          selected={filters.eventTypes}
          onToggle={(key) => handleToggle("eventTypes", key)}
        />
      </div>
    </aside>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_VISIBLE = 3;

  // Selected options always render first so a 4th selection never
  // disappears when the group collapses. Order within each bucket is
  // preserved from the parent's options array.
  const selectedOptions = options.filter((o) => selected.includes(o.key));
  const unselectedOptions = options.filter((o) => !selected.includes(o.key));
  const ordered = [...selectedOptions, ...unselectedOptions];

  const visible = expanded ? ordered : ordered.slice(0, INITIAL_VISIBLE);
  const hiddenCount = ordered.length - visible.length;
  const selectedCount = selected.length;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          {title}
        </h4>
        {selectedCount > 0 && (
          <span className="rounded-full bg-[#EB4D4B]/10 px-2 py-0.5 text-xs font-semibold text-[#EB4D4B]">
            {selectedCount}
          </span>
        )}
      </div>
      <ul className="space-y-2.5">
        {visible.map((option) => (
          <li key={option.key}>
            <label className="inline-flex cursor-pointer items-center gap-3">
              <div
                role="checkbox"
                tabIndex={0}
                aria-checked={selected.includes(option.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onToggle(option.key);
                }}
                onClick={() => onToggle(option.key)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  selected.includes(option.key)
                    ? "border-[#EB4D4B] bg-[#EB4D4B]"
                    : "border-gray-300 bg-white"
                }`}
              >
                {selected.includes(option.key) && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          </li>
        ))}
      </ul>
      {ordered.length > INITIAL_VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#EB4D4B] hover:underline"
        >
          {expanded ? "Show less" : `Show all (${hiddenCount} more)`}
          <svg
            className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
