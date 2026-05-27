"use client";

import { useEffect, useRef, useState } from "react";
import {
  malaysiaLocations,
  getCities,
  getDistricts,
  type StateDef,
  type CityDef,
  type DistrictDef,
} from "@/lib/data/malaysia-locations";

export interface LocationSelection {
  state: string | null;
  city: string | null;
  district: string | null;
}

interface LocationCascadeProps {
  value: LocationSelection;
  onChange: (next: LocationSelection) => void;
  className?: string;
  /**
   * When true, only the State dropdown renders. City and District are
   * preserved in the value (cleared when state changes) but the user
   * cannot pick them through this component. Used by the search sidebar
   * and the vendor listing form when a flatter UI is preferred.
   */
  onlyState?: boolean;
}

/**
 * Three cascading dropdowns: State -> City -> District.
 *
 * Selecting a parent clears child selections. The City dropdown is disabled
 * until a state is picked. The District dropdown is disabled until a city
 * is picked. State stores the stable key (e.g. "selangor"); city and
 * district store the human-readable name as written in the data file
 * (e.g. "Petaling Jaya", "Damansara Utama") so they round-trip cleanly to
 * the listings.city / listings.district columns.
 */
export default function LocationCascade({
  value,
  onChange,
  className,
  onlyState = false,
}: LocationCascadeProps) {
  const cities = value.state ? getCities(value.state) : [];
  const districts = value.state && value.city ? getDistricts(value.state, value.city) : [];

  if (onlyState) {
    return (
      <div className={className}>
        <Dropdown
          label="State"
          placeholder="Any state"
          options={malaysiaLocations.map((s) => ({ key: s.key, label: s.name }))}
          selectedKey={value.state}
          onSelect={(stateKey) =>
            onChange({ state: stateKey, city: null, district: null })
          }
        />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 gap-2 sm:grid-cols-3 ${className ?? ""}`}>
      <Dropdown
        label="State"
        placeholder="Any state"
        options={malaysiaLocations.map((s) => ({ key: s.key, label: s.name }))}
        selectedKey={value.state}
        onSelect={(stateKey) =>
          onChange({ state: stateKey, city: null, district: null })
        }
      />
      <Dropdown
        label="City"
        placeholder={value.state ? "Any city" : "Select a state first"}
        disabled={!value.state}
        options={cities.map((c: CityDef) => ({ key: c.name, label: c.name }))}
        selectedKey={value.city}
        onSelect={(cityName) =>
          onChange({ state: value.state, city: cityName, district: null })
        }
      />
      <Dropdown
        label="District"
        placeholder={value.city ? "Any district" : "Select a city first"}
        disabled={!value.city}
        options={districts.map((d: DistrictDef) => ({ key: d.name, label: d.name }))}
        selectedKey={value.district}
        onSelect={(districtName) =>
          onChange({ state: value.state, city: value.city, district: districtName })
        }
      />
    </div>
  );
}

interface DropdownProps {
  label: string;
  placeholder: string;
  options: Array<{ key: string; label: string }>;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  disabled?: boolean;
}

function Dropdown({
  label,
  placeholder,
  options,
  selectedKey,
  onSelect,
  disabled,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.key === selectedKey);

  return (
    <div className="relative" ref={ref}>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium outline-none transition ${
          disabled
            ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
            : selected
            ? "border-gray-200 bg-gray-50 text-gray-900 hover:border-gray-300"
            : "border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300"
        } focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-full rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          <ul className="max-h-64 overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm italic text-gray-400 transition-colors hover:bg-gray-50 ${
                  selectedKey === null ? "bg-red-50/40" : ""
                }`}
              >
                {placeholder}
              </button>
            </li>
            {options.map((opt) => (
              <li key={opt.key}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(opt.key);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    opt.key === selectedKey
                      ? "bg-red-50 font-semibold text-[#EB4D4B]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-4 py-2.5 text-sm text-gray-400">No options</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// Type re-exports kept here so consumers don't need to import from the data file.
export type { StateDef, CityDef, DistrictDef };
