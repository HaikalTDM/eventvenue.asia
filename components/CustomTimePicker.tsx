"use client";

import { useState, useRef, useEffect } from "react";

interface CustomTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  startHour?: number;
  endHour?: number;
  interval?: number;
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const displayMin = minute === 0 ? "" : `:${String(minute).padStart(2, "0")}`;
  return `${displayHour}${displayMin} ${period}`;
}

function toValue(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function CustomTimePicker({
  value,
  onChange,
  id,
  startHour = 8,
  endHour = 23,
  interval = 30,
}: CustomTimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Generate time slots
  const slots: { display: string; value: string }[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      if (h === endHour && m > 0) break;
      slots.push({ display: formatTime(h, m), value: toValue(h, m) });
    }
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll to selected item within the dropdown only (not the page)
  useEffect(() => {
    if (open && listRef.current && value) {
      const selected = listRef.current.querySelector("[data-selected='true']") as HTMLElement | null;
      if (selected) {
        const container = listRef.current;
        const offsetTop = selected.offsetTop - container.offsetTop;
        container.scrollTop = offsetTop - container.clientHeight / 2 + selected.clientHeight / 2;
      }
    }
  }, [open, value]);

  const displayValue = value
    ? slots.find((s) => s.value === value)?.display || value
    : "Select time";

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-3 rounded-xl border bg-gray-50 px-4 py-3 text-left text-sm font-medium outline-none transition ${
          open
            ? "border-[#EB4D4B] ring-2 ring-[#EB4D4B]/20"
            : "border-gray-200 hover:border-gray-300"
        } ${value ? "text-gray-900" : "text-gray-400"}`}
      >
        <svg
          className="h-4 w-4 shrink-0 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="flex-1 truncate">{displayValue}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[160px] rounded-xl border border-gray-200 bg-white shadow-xl">
          <div
            ref={listRef}
            className="max-h-56 overflow-y-auto overscroll-contain p-1.5"
          >
            {slots.map((slot) => {
              const isSelected = slot.value === value;
              return (
                <button
                  key={slot.value}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => {
                    onChange(slot.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-[#EB4D4B] text-white"
                      : "text-gray-700 hover:bg-[#EB4D4B]/10 hover:text-[#EB4D4B]"
                  }`}
                >
                  {isSelected && (
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className={isSelected ? "" : "pl-5.5"}>{slot.display}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
