"use client";

import { useEffect, useState } from "react";

import { useListings } from "@/hooks/use-listings";
import type { ApiListingDetail } from "@/lib/api";
import type { VendorAppointment } from "@/lib/types";
import VendorPortalLayout from "@/components/VendorPortalLayout";

function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

const DOT_COLORS = [
  "bg-rose-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-indigo-500",
];

interface CalendarVenueInfo {
  id: string;
  title: string;
  dot: string;
  blockedDates: string[];
  appointments: Array<{
    startTime: string;
    endTime: string;
    label: string | null;
    source: string | null;
  }>;
}

function apiAppointmentToVendorApt(
  a: ApiListingDetail["availability"]["appointments"][number],
  listingId: string
): VendorAppointment {
  const dateStr = a.startTime.slice(0, 10);
  return {
    id: `${listingId}-${a.startTime}`,
    venueId: listingId,
    date: dateStr,
    startTime: a.startTime.slice(11, 16),
    endTime: a.endTime.slice(11, 16),
    customerName: a.label ?? "Appointment",
    customerPhone: "",
    eventType: a.source ?? "",
    guestCount: 0,
    notes: "",
    status: a.source === "inquiry" ? "inquiry" : "confirmed",
  };
}

export default function VendorCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [venueInfos, setVenueInfos] = useState<CalendarVenueInfo[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Pull the listing list through React Query so the calendar shares the
  // same cache as the rest of the vendor portal. Detail (availability) is
  // still fetched per-listing inline because there's no batched endpoint
  // for "all my availabilities" yet — when that lands, swap in a single
  // hook and drop the per-id fan-out below.
  const {
    data: listingsResponse,
    isLoading: listLoading,
    error: listError,
  } = useListings({ type: "venue" });

  useEffect(() => {
    if (!listingsResponse) return;
    let cancelled = false;
    (async () => {
      setDetailsLoading(true);
      setDetailsError(null);
      try {
        const listings = listingsResponse.data;
        const details = await Promise.all(
          listings.map(async (l) => {
            try {
              const res = await fetch(`/api/v1/listings/${l.id}`, {
                cache: "no-store",
              });
              if (!res.ok) return null;
              const body = (await res.json()) as { data: ApiListingDetail };
              return body.data;
            } catch {
              return null;
            }
          })
        );
        if (cancelled) return;
        const infos: CalendarVenueInfo[] = listings.map((l, i) => ({
          id: l.id,
          title: l.title,
          dot: DOT_COLORS[i % DOT_COLORS.length],
          blockedDates: details[i]?.availability?.blockedDates ?? [],
          appointments: details[i]?.availability?.appointments ?? [],
        }));
        setVenueInfos(infos);
      } catch (err) {
        if (!cancelled) {
          setDetailsError(
            err instanceof Error ? err.message : "Failed to load calendar data"
          );
        }
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listingsResponse]);

  const loading = listLoading || detailsLoading;
  const error = listError?.message ?? detailsError;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const isPast = (day: number) => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isToday = (day: number) => {
    const date = new Date(year, month, day);
    const t = new Date();
    return (
      date.getFullYear() === t.getFullYear() &&
      date.getMonth() === t.getMonth() &&
      date.getDate() === t.getDate()
    );
  };

  const allAppointments: VendorAppointment[] = [];
  for (const info of venueInfos) {
    for (const a of info.appointments) {
      allAppointments.push(apiAppointmentToVendorApt(a, info.id));
    }
  }

  const appointmentDateMap = new Map<string, VendorAppointment[]>();
  for (const apt of allAppointments) {
    const arr = appointmentDateMap.get(apt.date) ?? [];
    arr.push(apt);
    appointmentDateMap.set(apt.date, arr);
  }

  const blockedDateMap = new Map<string, { venueId: string; venueTitle: string }>();
  for (const info of venueInfos) {
    for (const d of info.blockedDates) {
      if (!appointmentDateMap.has(d)) {
        blockedDateMap.set(d, { venueId: info.id, venueTitle: info.title });
      }
    }
  }

  const aptsThisMonth = allAppointments.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const handleDateClick = (dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  };

  const selectedApts = selectedDate
    ? (appointmentDateMap.get(selectedDate) ?? [])
    : [];
  const selectedBlocked = selectedDate
    ? blockedDateMap.get(selectedDate)
    : null;
  const selectedDateFormatted = selectedDate
    ? new Date(selectedDate).toLocaleDateString("en-MY", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <VendorPortalLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of all appointments and blocked dates across your venues.
        </p>
      </div>

      {loading ? (
        <div className="mt-12 flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#EB4D4B]" />
        </div>
      ) : error ? (
        <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 py-16 text-center">
          <p className="font-medium text-red-600">{error}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <button
                  onClick={prevMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h2 className="text-lg font-semibold text-gray-900">
                  {monthName}
                </h2>
                <button
                  onClick={nextMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
              <div className="mt-6 grid grid-cols-7 text-center text-xs font-semibold text-gray-400">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (d) => (
                    <div key={d} className="py-2">
                      {d}
                    </div>
                  )
                )}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = formatDate(year, month, day);
                  const past = isPast(day);
                  const today = isToday(day);
                  const dayApts = appointmentDateMap.get(dateStr) ?? [];
                  const blocked = blockedDateMap.get(dateStr);
                  const hasContent = dayApts.length > 0 || !!blocked;
                  const isSelected = selectedDate === dateStr;

                  const uniqueVenueIds = [
                    ...new Set(dayApts.map((a) => a.venueId)),
                  ];
                  if (blocked && blocked.venueId)
                    uniqueVenueIds.push(blocked.venueId);

                  let cellCls =
                    "relative flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all h-14 ";
                  if (past) cellCls += "cursor-default text-gray-300 ";
                  else if (isSelected)
                    cellCls +=
                      "cursor-pointer bg-[#EB4D4B]/10 ring-2 ring-[#EB4D4B]/40 ";
                  else if (hasContent)
                    cellCls += "cursor-pointer bg-gray-50 hover:bg-gray-100 ";
                  else
                    cellCls +=
                      "cursor-pointer text-gray-600 hover:bg-gray-50 ";
                  if (today && !past) cellCls += "font-extrabold ";

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={past}
                      onClick={() => !past && handleDateClick(dateStr)}
                      className={cellCls}
                    >
                      <span className={isSelected ? "text-[#EB4D4B]" : ""}>
                        {day}
                      </span>
                      {hasContent && !past && (
                        <div className="mt-0.5 flex items-center gap-0.5">
                          {uniqueVenueIds.map((vid) => {
                            const info = venueInfos.find(
                              (v) => v.id === vid
                            );
                            if (!info) return null;
                            const isBlockedDot = blocked?.venueId === vid;
                            return (
                              <span
                                key={vid}
                                className={`inline-block h-1.5 w-1.5 rounded-full ${
                                  info.dot
                                } ${isBlockedDot ? "opacity-40" : ""}`}
                                title={`${info.title}${
                                  isBlockedDot ? " (Blocked)" : ""
                                }`}
                              />
                            );
                          })}
                        </div>
                      )}
                      {!hasContent && today && !past && (
                        <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#EB4D4B]" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
                {venueInfos.map((info) => (
                  <span
                    key={info.id}
                    className="inline-flex items-center gap-1.5"
                  >
                    <span
                      className={`h-3 w-3 rounded-full ${info.dot}`}
                    />{" "}
                    {info.title}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Legend</h3>
              <div className="mt-3 space-y-2">
                {venueInfos.map((info) => (
                  <div key={info.id} className="flex items-center gap-3">
                    <span
                      className={`h-3.5 w-3.5 rounded-full ${info.dot} flex-shrink-0`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {info.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {allAppointments.filter((a) => a.venueId === info.id).length}{" "}
                        appointment
                        {allAppointments.filter((a) => a.venueId === info.id)
                          .length !== 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                  <span className="h-3.5 w-3.5 rounded-full bg-rose-500 opacity-40 flex-shrink-0" />
                  <span className="text-sm text-gray-500">
                    Faded dot = blocked date
                  </span>
                </div>
              </div>
            </div>

            {selectedDate && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {selectedDateFormatted}
                  </h3>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {selectedApts.length === 0 && selectedBlocked && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                      <div className="flex items-center gap-2">
                        {selectedBlocked.venueId && (
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              venueInfos.find(
                                (v) => v.id === selectedBlocked.venueId
                              )?.dot ?? "bg-red-500"
                            } opacity-40`}
                          />
                        )}
                        <span className="text-sm font-semibold text-red-700">
                          {selectedBlocked.venueTitle}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-red-600">
                        This date is blocked — no bookings allowed.
                      </p>
                    </div>
                  )}
                  {selectedApts.length === 0 && !selectedBlocked && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No appointments on this date.
                    </p>
                  )}
                  {selectedApts.map((apt) => {
                    const info = venueInfos.find((v) => v.id === apt.venueId);
                    return (
                      <div
                        key={apt.id}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                      >
                        <div className="flex items-center gap-2">
                          {info && (
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${info.dot} flex-shrink-0`}
                            />
                          )}
                          <span className="text-xs text-gray-400">
                            {info?.title ?? apt.venueId}
                          </span>
                          <span
                            className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                              apt.status === "confirmed"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {apt.status === "confirmed"
                              ? "Confirmed"
                              : "Inquiry"}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-semibold text-gray-900">
                          {apt.eventType} — {apt.guestCount} guests
                        </p>
                        <p className="text-xs text-gray-500">
                          {apt.customerName} · {apt.customerPhone}
                        </p>
                        <p className="text-xs text-gray-400">
                          {apt.startTime}–{apt.endTime}
                        </p>
                        {apt.notes && (
                          <p className="mt-1 text-xs text-gray-400 italic">
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!selectedDate && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">
                  This Month
                </h3>
                <div className="mt-3 space-y-3">
                  {aptsThisMonth.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No appointments this month
                    </p>
                  ) : (
                    aptsThisMonth.slice(0, 5).map((apt) => {
                      const info = venueInfos.find(
                        (v) => v.id === apt.venueId
                      );
                      return (
                        <div
                          key={apt.id}
                          className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                        >
                          <span className="text-xs text-gray-400">
                            {apt.date}
                          </span>
                          <p className="text-sm font-semibold text-gray-900">
                            {apt.eventType} — {apt.guestCount} guests
                          </p>
                          <p className="text-xs text-gray-500">
                            {apt.customerName} · {apt.startTime}–{apt.endTime}
                          </p>
                          {info && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${info.dot}`}
                              />
                              {info.title}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedDateFormatted}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedApts.length} appointment
                  {selectedApts.length !== 1 ? "s" : ""}
                  {selectedBlocked && " · 1 blocked"}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto px-6 py-5 space-y-4">
              {selectedApts.length === 0 && selectedBlocked && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                  <div className="flex items-center gap-2">
                    {selectedBlocked.venueId && (
                      <span
                        className={`h-3 w-3 rounded-full ${
                          venueInfos.find(
                            (v) => v.id === selectedBlocked.venueId
                          )?.dot ?? "bg-red-500"
                        } opacity-40 flex-shrink-0`}
                      />
                    )}
                    <span className="font-semibold text-red-700">
                      {selectedBlocked.venueTitle}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-red-600">
                    This date is blocked — no bookings allowed.
                  </p>
                </div>
              )}

              {selectedApts.length === 0 && !selectedBlocked && (
                <div className="py-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-3 text-sm text-gray-500">
                    No appointments on this date.
                  </p>
                </div>
              )}

              {selectedApts.map((apt) => {
                const info = venueInfos.find((v) => v.id === apt.venueId);
                return (
                  <div
                    key={apt.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {info && (
                          <span
                            className={`h-3 w-3 rounded-full ${info.dot} flex-shrink-0`}
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {apt.eventType} · {apt.guestCount} guests
                          </p>
                          <p className="text-xs text-gray-400">
                            {info?.title ?? "Unknown venue"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0 ${
                          apt.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {apt.status === "confirmed" ? "Confirmed" : "Inquiry"}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                          Time
                        </p>
                        <p className="mt-0.5 font-semibold text-gray-900">
                          {apt.startTime} – {apt.endTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                          Booked By
                        </p>
                        <p className="mt-0.5 font-semibold text-gray-900">
                          {apt.customerName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                          Phone
                        </p>
                        <p className="mt-0.5 text-gray-700">
                          {apt.customerPhone}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                          Guests
                        </p>
                        <p className="mt-0.5 text-gray-700">
                          {apt.guestCount} guests
                        </p>
                      </div>
                    </div>

                    {apt.notes && (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                          Notes
                        </p>
                        <p className="text-sm text-gray-600">{apt.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedDate(null)}
                className="rounded-xl bg-[#EB4D4B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#dc2626]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </VendorPortalLayout>
  );
}
