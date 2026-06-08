"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useCreateInquiry } from "@/hooks/use-inquiries";
import CustomDatePicker from "@/components/CustomDatePicker";
import CustomTimePicker from "@/components/CustomTimePicker";

interface InquiryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueTitle: string;
  venueId: string;
  capacity: number;
  pricePerHour?: number;
  currency?: string;
}

export default function InquiryFormModal({
  isOpen,
  onClose,
  venueTitle,
  venueId,
  capacity,
  pricePerHour = 450,
  currency = "RM",
}: InquiryFormModalProps) {
  const { user } = useAuth();
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone ?? "");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [guestCount, setGuestCount] = useState(50);
  const [eventType, setEventType] = useState("");
  const [eventTypeOpen, setEventTypeOpen] = useState(false);
  const eventTypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (eventTypeRef.current && !eventTypeRef.current.contains(e.target as Node)) {
        setEventTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const eventTypeOptions = [
    { value: "Wedding", label: "Wedding" },
    { value: "Corporate", label: "Corporate" },
    { value: "Private Party", label: "Private Party" },
    { value: "Birthday", label: "Birthday" },
    { value: "Launch", label: "Product Launch" },
    { value: "Seminar", label: "Seminar / Workshop" },
    { value: "Other", label: "Other" },
  ];

  const selectedEventLabel = eventTypeOptions.find((o) => o.value === eventType)?.label || "Select event type";
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInquiry = useCreateInquiry();
  const loading = createInquiry.isPending;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Please sign in before sending an inquiry.");
      return;
    }

    const estimatedCost = Math.max(3, parseInt(endTime, 10) - parseInt(startTime, 10)) * pricePerHour;

    try {
      await createInquiry.mutateAsync({
        listingId: venueId,
        eventDate,
        eventTime: startTime,
        guestCount,
        eventType: eventType || undefined,
        specialRequirements: specialRequirements || undefined,
        totalPrice: estimatedCost,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (submitted) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
        onClick={() => {
          setSubmitted(false);
          onClose();
        }}
      >
        <div
          className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg
              className="h-8 w-8"
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
          </div>
          <h2 className="text-xl font-bold text-gray-900">Inquiry Sent!</h2>
          <p className="mt-2 text-sm text-gray-500">
            Your inquiry has been sent to the venue host. You can track its status
            in your{" "}
            <span className="font-semibold text-[#EB4D4B]">Dashboard</span>.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              onClose();
            }}
            className="mt-6 w-full rounded-xl bg-[#EB4D4B] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#dc2626]"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 pt-5 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Send Inquiry</h2>
            <p className="mt-0.5 text-sm text-gray-500">{venueTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
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

        {/* Scrollable Form Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <form id="inq-form" onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
            {isAuthenticated && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
                Signed in as <span className="font-semibold">{user.name}</span>. Your details are pre-filled below.
              </div>
            )}

            {/* Contact Details — fields sit directly on white, no inner gray container */}
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Your Details
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name <span className="text-[#EB4D4B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  readOnly={isAuthenticated}
                  placeholder="Full name"
                  className={`w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20 ${
                    isAuthenticated ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"
                  }`}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email <span className="text-[#EB4D4B]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  readOnly={isAuthenticated}
                  placeholder="you@email.com"
                  className={`w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20 ${
                    isAuthenticated ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"
                  }`}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+60 12 345 6789"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
            </div>

            {/* Event Date */}
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Event Date <span className="text-[#EB4D4B]">*</span>
              </label>
              <CustomDatePicker
                value={eventDate}
                onChange={setEventDate}
                placeholder="Pick your event date"
                minDate={new Date().toISOString().split("T")[0]}
                id="inq-date"
              />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Start Time
                </label>
                <CustomTimePicker
                  value={startTime}
                  onChange={setStartTime}
                  id="inq-start"
                  startHour={8}
                  endHour={21}
                  interval={60}
                />
              </div>
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  End Time
                </label>
                <CustomTimePicker
                  value={endTime}
                  onChange={setEndTime}
                  id="inq-end"
                  startHour={9}
                  endHour={22}
                  interval={60}
                />
              </div>
            </div>

            {/* Guest Count — constrained width */}
            <div>
              <label
                htmlFor="inq-guests"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Guest Count <span className="text-[#EB4D4B]">*</span>
              </label>
              <div className="max-w-[180px]">
                <input
                  id="inq-guests"
                  type="number"
                  min={1}
                  max={capacity}
                  value={guestCount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1 && val <= capacity) setGuestCount(val);
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Max capacity: {capacity} guests</p>
            </div>

            {/* Event Type */}
            <div className="relative" ref={eventTypeRef}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Event Type <span className="text-[#EB4D4B]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setEventTypeOpen(!eventTypeOpen)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20 ${
                  eventType ? "border-gray-200 bg-gray-50 text-gray-900" : "border-gray-200 bg-gray-50 text-gray-400"
                }`}
              >
                <span>{selectedEventLabel}</span>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${eventTypeOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {eventTypeOpen && (
                <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  <ul className="max-h-56 overflow-y-auto">
                    {eventTypeOptions.map((opt) => (
                      <li key={opt.value}>
                        <button
                          type="button"
                          onClick={() => {
                            setEventType(opt.value);
                            setEventTypeOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                            opt.value === eventType
                              ? "bg-red-50 font-semibold text-[#EB4D4B]"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Special Requirements */}
            <div>
              <label
                htmlFor="inq-requirements"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Special Requirements
              </label>
              <textarea
                id="inq-requirements"
                rows={4}
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="E.g., full halal catering for 300 pax, stage setup, AV system, parking requirements..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
              />
            </div>

            {/* Cost Estimate */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Estimated Cost
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {currency} {(Math.max(3, parseInt(endTime, 10) - parseInt(startTime, 10)) * pricePerHour).toLocaleString()}
                <span className="ml-1 text-sm font-normal text-gray-400">
                  depends on venue
                </span>
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Bottom spacer so content isn't hidden behind sticky footer */}
            <div className="h-2" />
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4">
          <button
            type="submit"
            form="inq-form"
            disabled={loading}
            className="w-full rounded-xl bg-[#EB4D4B] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#EB4D4B]/50 focus:ring-offset-2 focus:ring-offset-white"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </span>
            ) : (
              "Request Booking"
            )}
          </button>
          <p className="mt-2 text-center text-xs text-gray-400">
            You won&apos;t be charged yet. The venue host will respond with a quote.
          </p>
        </div>
      </div>
    </div>
  );
}
