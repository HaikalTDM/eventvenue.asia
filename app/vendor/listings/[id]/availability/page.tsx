"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getListingDetail, type ApiListingDetail } from "@/lib/api";
import type { VendorAppointment, BlockedDateEntry } from "@/lib/types";
import VendorPortalLayout from "@/components/VendorPortalLayout";

function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

type CalendarAppointment = {
  id: string;
  date: string;
  label: string;
  color: "green" | "amber" | "red";
};

function mapApiAppointments(
  listingId: string,
  apiAppts: ApiListingDetail["availability"]["appointments"]
): VendorAppointment[] {
  const dateMap = new Map<string, VendorAppointment[]>();
  for (const a of apiAppts) {
    const dateStr = a.startTime.slice(0, 10);
    const apt: VendorAppointment = {
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
      status: a.label ? "confirmed" : "inquiry",
    };
    const existing = dateMap.get(dateStr) ?? [];
    existing.push(apt);
    dateMap.set(dateStr, existing);
  }
  return Array.from(dateMap.values()).flat();
}

export default function ManageAvailabilityPage() {
  const params = useParams();
  const listingId = params.id as string;

  const [listingTitle, setListingTitle] = useState("");
  const [blockedDates, setBlockedDates] = useState<BlockedDateEntry[]>([]);
  const [appointments, setAppointments] = useState<VendorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [saved, setSaved] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  const [newAppointment, setNewAppointment] = useState({
    date: "",
    startTime: "09:00",
    endTime: "12:00",
    customerName: "",
    customerPhone: "",
    eventType: "Wedding",
    guestCount: 50,
    notes: "",
    status: "confirmed" as "confirmed" | "inquiry",
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const result = await getListingDetail(listingId);
        const data = result.data;
        setListingTitle(data.title);
        setBlockedDates(
          (data.availability?.blockedDates ?? []).map((d) => ({
            date: d,
            reason: "",
          }))
        );
        if (data.availability?.appointments?.length) {
          setAppointments(
            mapApiAppointments(data.id, data.availability.appointments)
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load listing"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [listingId]);

  if (loading) {
    return (
      <VendorPortalLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#EB4D4B]" />
        </div>
      </VendorPortalLayout>
    );
  }

  if (error) {
    return (
      <VendorPortalLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-xl font-bold text-gray-900">Error</h2>
          <p className="mt-2 text-sm text-red-500">{error}</p>
          <Link
            href="/vendor/listings"
            className="mt-6 rounded-xl bg-[#EB4D4B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#dc2626]"
          >
            Back to Listings
          </Link>
        </div>
      </VendorPortalLayout>
    );
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const blockedDateSet = new Set(blockedDates.map((b) => b.date));
  const appointmentDateMap = new Map<string, CalendarAppointment[]>();
  for (const apt of appointments) {
    const entry: CalendarAppointment = {
      id: apt.id,
      date: apt.date,
      label: apt.customerName,
      color: apt.status === "confirmed" ? "green" : "amber",
    };
    const arr = appointmentDateMap.get(apt.date) ?? [];
    arr.push(entry);
    appointmentDateMap.set(apt.date, arr);
  }

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const isPast = (day: number) => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const toggleBlockDate = (day: number) => {
    const dateStr = formatDate(year, month, day);
    if (appointmentDateMap.has(dateStr)) return;
    if (blockedDateSet.has(dateStr)) {
      setBlockedDates((prev) => prev.filter((b) => b.date !== dateStr));
    } else {
      setBlockedDates((prev) => [...prev, { date: dateStr, reason: "" }]);
    }
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddAppointment = () => {
    const apt: VendorAppointment = {
      id: `apt-${Date.now()}`,
      venueId: listingId,
      ...newAppointment,
    };
    setAppointments((prev) => [apt, ...prev]);
    setBlockedDates((prev) =>
      prev.filter((b) => b.date !== newAppointment.date)
    );
    setShowAddModal(false);
    setNewAppointment({
      date: "",
      startTime: "09:00",
      endTime: "12:00",
      customerName: "",
      customerPhone: "",
      eventType: "Wedding",
      guestCount: 50,
      notes: "",
      status: "confirmed",
    });
  };

  const blockedThisMonth = blockedDates.filter((b) => {
    const d = new Date(b.date);
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;

  const aptsThisMonth = appointments.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const sortedApts = [...appointments].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const upcomingApts = sortedApts
    .filter((a) => a.date >= new Date().toISOString().split("T")[0])
    .slice(0, 5);

  return (
    <VendorPortalLayout>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vendor/listings"
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
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Availability Calendar
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">{listingTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-xl bg-[#EB4D4B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#dc2626]"
          >
            + Add Appointment
          </button>
          {saved && (
            <span className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 shadow-lg animate-bounce">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Saved
            </span>
          )}
        </div>
      </div>

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
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = formatDate(year, month, day);
                const past = isPast(day);
                const blocked = blockedDateSet.has(dateStr);
                const dayApts = appointmentDateMap.get(dateStr) ?? [];
                const hasConfirmed = dayApts.some((a) => a.color === "green");
                const hasInquiry = dayApts.some((a) => a.color === "amber");

                let cellClass =
                  "relative flex h-12 flex-col items-center justify-center rounded-lg text-sm font-medium transition-all ";
                if (past) cellClass += "cursor-not-allowed text-gray-300 ";
                else if (hasConfirmed)
                  cellClass +=
                    "bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200 hover:bg-emerald-100 ";
                else if (hasInquiry)
                  cellClass +=
                    "bg-amber-50 text-amber-700 ring-2 ring-amber-200 hover:bg-amber-100 ";
                else if (blocked)
                  cellClass +=
                    "bg-red-50 text-red-700 ring-2 ring-red-200 hover:bg-red-100 ";
                else cellClass += "text-gray-700 hover:bg-gray-100 ";

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={past}
                    onClick={() => toggleBlockDate(day)}
                    className={cellClass}
                    title={
                      hasConfirmed
                        ? dayApts
                            .filter((a) => a.color === "green")
                            .map((a) => a.label)
                            .join(", ")
                        : hasInquiry
                        ? dayApts.map((a) => a.label).join(", ")
                        : blocked
                        ? blockedDates.find((b) => b.date === dateStr)
                            ?.reason || "Blocked"
                        : "Available"
                    }
                  >
                    <span>{day}</span>
                    <div className="mt-0.5 flex gap-0.5">
                      {hasConfirmed && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                      {hasInquiry && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-50 ring-1 ring-emerald-200" />{" "}
                Confirmed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-amber-50 ring-1 ring-amber-200" />{" "}
                Inquiry
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-red-50 ring-1 ring-red-200" />{" "}
                Blocked
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-gray-200" />{" "}
                Available
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">This Month</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs text-emerald-600 font-medium">
                  Confirmed
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-700">
                  {
                    aptsThisMonth.filter((a) => a.status === "confirmed")
                      .length
                  }
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-xs text-amber-600 font-medium">Inquiries</p>
                <p className="mt-1 text-xl font-bold text-amber-700">
                  {
                    aptsThisMonth.filter((a) => a.status === "inquiry").length
                  }
                </p>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <p className="text-xs text-red-600 font-medium">Blocked</p>
                <p className="mt-1 text-xl font-bold text-red-700">
                  {blockedThisMonth}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500 font-medium">Available</p>
                <p className="mt-1 text-xl font-bold text-gray-700">
                  {daysInMonth - aptsThisMonth.length - blockedThisMonth}
                </p>
              </div>
            </div>
          </div>

          {upcomingApts.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">
                Upcoming Appointments
              </h3>
              <div className="mt-3 space-y-3">
                {upcomingApts.map((apt) => (
                  <div
                    key={apt.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          apt.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {apt.status === "confirmed" ? "Confirmed" : "Inquiry"}
                      </span>
                      <span className="text-xs text-gray-400">{apt.date}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-gray-900">
                      {apt.eventType} — {apt.guestCount} guests
                    </p>
                    <p className="text-xs text-gray-500">
                      {apt.customerName} · {apt.customerPhone}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {apt.startTime}–{apt.endTime}
                    </p>
                    {apt.notes && (
                      <p className="mt-1 text-xs text-gray-400 italic">
                        {apt.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-sm font-semibold text-amber-800">
              How it works
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-amber-700">
              <li>• Click an available date to block it</li>
              <li>
                • Use <strong>+ Add Appointment</strong> to schedule a new
                booking
              </li>
              <li>
                • Blocked dates won&apos;t appear as available to customers
              </li>
              <li>• Confirmed appointments auto-block their date</li>
            </ul>
          </div>

          <button
            onClick={handleSave}
            className="w-full rounded-xl bg-[#EB4D4B] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626]"
          >
            Save Availability
          </button>
        </div>
      </div>

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                Add Appointment
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddAppointment();
              }}
              className="space-y-5 px-6 py-5"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date <span className="text-[#EB4D4B]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={newAppointment.date}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      date: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newAppointment.startTime}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newAppointment.endTime}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Customer Name{" "}
                  <span className="text-[#EB4D4B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAppointment.customerName}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      customerName: e.target.value,
                    })
                  }
                  placeholder="Full name"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newAppointment.customerPhone}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      customerPhone: e.target.value,
                    })
                  }
                  placeholder="+60 12 345 6789"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Event Type
                  </label>
                  <select
                    value={newAppointment.eventType}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        eventType: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                  >
                    <option>Wedding</option>
                    <option>Corporate</option>
                    <option>Private Party</option>
                    <option>Birthday</option>
                    <option>Launch</option>
                    <option>Seminar</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Guests
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newAppointment.guestCount}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        guestCount: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNewAppointment({
                        ...newAppointment,
                        status: "confirmed",
                      })
                    }
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      newAppointment.status === "confirmed"
                        ? "bg-emerald-500 text-white"
                        : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Confirmed
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewAppointment({
                        ...newAppointment,
                        status: "inquiry",
                      })
                    }
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      newAppointment.status === "inquiry"
                        ? "bg-amber-500 text-white"
                        : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Inquiry
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={newAppointment.notes}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Catering preferences, AV requirements, setup details..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
              <div className="flex gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#EB4D4B] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#dc2626]"
                >
                  Add Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </VendorPortalLayout>
  );
}
