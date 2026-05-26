"use client";

import { useState, useRef, useEffect } from "react";

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string;
  id?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseIso(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(iso: string): string {
  const date = parseIso(iso);
  if (!date) return "";
  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  minDate,
  id,
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Use a stable initial value for SSR; real "today" is set after mount
  const [today, setTodayState] = useState<Date>(new Date(2026, 0, 1));

  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setTodayState(now);
    setMounted(true);
  }, []);

  const minDateObj = minDate ? parseIso(minDate) : today;

  // Initialize view to selected date or today
  const initial = parseIso(value) || today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // Sync view when mounted with real today
  useEffect(() => {
    if (mounted && !value) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
  }, [mounted, value]);

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

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: Array<{ day: number | null; iso: string }> = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, iso: "" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, iso: toIso(viewYear, viewMonth, d) });
  }

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const canGoPrev = (): boolean => {
    if (!minDateObj) return true;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const lastDayOfPrev = new Date(prevYear, prevMonth + 1, 0);
    return lastDayOfPrev >= minDateObj;
  };

  const isDisabled = (iso: string): boolean => {
    if (!iso || !minDateObj) return false;
    const d = parseIso(iso);
    return d ? d < minDateObj : false;
  };

  const handleSelect = (iso: string) => {
    if (isDisabled(iso)) return;
    onChange(iso);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="flex-1 truncate">
          {value ? formatDisplay(value) : placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div className="absolute left-0 top-full z-[60] mt-2 w-[300px] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canGoPrev()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous month"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-bold text-gray-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
              aria-label="Next month"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="mt-3 grid grid-cols-7 text-center text-xs font-semibold text-gray-400">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="py-1.5">{wd}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {cells.map((cell, idx) => {
              if (cell.day === null) {
                return <div key={`e-${idx}`} className="h-9" />;
              }

              const disabled = isDisabled(cell.iso);
              const selected = cell.iso === value;
              const isToday = cell.iso === toIso(today.getFullYear(), today.getMonth(), today.getDate());

              let cls =
                "relative flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-all";

              if (selected) {
                cls += " bg-[#EB4D4B] text-white shadow-sm";
              } else if (disabled) {
                cls += " text-gray-300 cursor-not-allowed";
              } else {
                cls += " text-gray-700 hover:bg-[#EB4D4B]/10 hover:text-[#EB4D4B] cursor-pointer";
              }

              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => handleSelect(cell.iso)}
                  disabled={disabled}
                  className={cls}
                >
                  {cell.day}
                  {isToday && !selected && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#EB4D4B]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => {
                const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());
                if (!isDisabled(todayIso)) {
                  onChange(todayIso);
                  setOpen(false);
                }
              }}
              className="text-xs font-semibold text-[#EB4D4B] hover:underline"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-xs font-medium text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
