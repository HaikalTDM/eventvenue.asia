"use client";

import { useState, useEffect } from "react";

interface AvailabilityCalendarProps {
  blockedDates: string[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toIsoDate(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Fixed reference date used for SSR/SSG to avoid hydration mismatch.
// After mount, we swap in the real "today".
const SSR_DATE = new Date(2026, 0, 1);

export default function AvailabilityCalendar({
  blockedDates,
}: AvailabilityCalendarProps) {
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState(startOfDay(SSR_DATE));
  const [viewYear, setViewYear] = useState(SSR_DATE.getFullYear());
  const [viewMonth, setViewMonth] = useState(SSR_DATE.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const now = startOfDay(new Date());
    setToday(now);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Availability</h2>
            <p className="mt-1 text-sm text-gray-500">
              Browse open dates. Greyed dates are unavailable.
            </p>
          </div>
        </div>
        <div className="mt-4 h-[380px] animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
      </section>
    );
  }

  const blockedSet = new Set(blockedDates);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Build day cells with leading empties for alignment
  const cells: Array<{ day: number | null; iso: string | null }> = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ day: null, iso: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, iso: toIsoDate(viewYear, viewMonth, d) });
  }

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDate(null);
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDate(null);
  };

  const isPastMonth =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth <= today.getMonth());

  const handleSelect = (iso: string, isPast: boolean, isBlocked: boolean) => {
    if (isPast || isBlocked) return;
    setSelectedDate((prev) => (prev === iso ? null : iso));
  };

  const blockedThisMonth = cells.filter(
    (c) => c.iso && blockedSet.has(c.iso),
  ).length;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Availability</h2>
          <p className="mt-1 text-sm text-gray-500">
            Browse open dates. Greyed dates are unavailable.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-gray-500">
            <span className="h-3 w-3 rounded-full bg-white border border-gray-200" />
            Available
          </span>
          <span className="inline-flex items-center gap-1.5 text-gray-500">
            <span className="h-3 w-3 rounded-full bg-gray-200" />
            Booked
          </span>
          <span className="inline-flex items-center gap-1.5 text-gray-500">
            <span className="h-3 w-3 rounded-full bg-[#EB4D4B]" />
            Selected
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {/* Month controls */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={isPastMonth}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous month"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-base font-bold text-gray-900">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          <button
            type="button"
            onClick={goNext}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50"
            aria-label="Next month"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekday header */}
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="py-2">
              {wd}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => {
            if (!cell.iso || cell.day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }
            const cellDate = new Date(viewYear, viewMonth, cell.day);
            const isPast = cellDate < today;
            const isBlocked = blockedSet.has(cell.iso);
            const isSelected = selectedDate === cell.iso;
            const isToday = cellDate.getTime() === today.getTime();

            const base =
              "relative flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition-colors";

            let cls = base;
            if (isSelected) {
              cls += " bg-[#EB4D4B] text-white shadow-md";
            } else if (isPast) {
              cls += " text-gray-300 cursor-not-allowed";
            } else if (isBlocked) {
              cls += " bg-gray-100 text-gray-400 line-through cursor-not-allowed";
            } else {
              cls +=
                " text-gray-700 hover:bg-[#EB4D4B]/10 hover:text-[#EB4D4B] cursor-pointer";
            }

            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => handleSelect(cell.iso!, isPast, isBlocked)}
                disabled={isPast || isBlocked}
                aria-label={`${cell.iso}${isBlocked ? " (booked)" : ""}`}
                aria-pressed={isSelected}
                className={cls}
              >
                {cell.day}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#EB4D4B]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm">
          <p className="text-gray-500">
            {blockedThisMonth} {blockedThisMonth === 1 ? "date" : "dates"} booked this month
          </p>
          {selectedDate ? (
            <p className="font-semibold text-gray-900">
              Selected:{" "}
              <span className="text-[#EB4D4B]">
                {new Date(selectedDate).toLocaleDateString("en-MY", {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
          ) : (
            <p className="text-gray-400">Pick a date to check availability</p>
          )}
        </div>
      </div>
    </section>
  );
}
