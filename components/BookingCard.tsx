"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InquiryFormModal from "@/components/InquiryFormModal";
import CustomDatePicker from "@/components/CustomDatePicker";
import CustomTimePicker from "@/components/CustomTimePicker";
import { useAuth } from "@/lib/auth";
import { useCreateBooking } from "@/hooks/use-bookings";

interface BookingCardProps {
  pricePerHour: number;
  currency: string;
  capacity: number;
  halalVerified: boolean;
  eventTypes: string[];
  venueId: string;
  venueTitle: string;
}

export default function BookingCard({
  pricePerHour,
  currency,
  capacity,
  halalVerified,
  eventTypes,
  venueTitle,
  venueId,
}: BookingCardProps) {
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [guestCount, setGuestCount] = useState(50);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const router = useRouter();
  const { user } = useAuth();
  const createBooking = useCreateBooking();
  const bookingLoading = createBooking.isPending;

  const startHour = parseInt(startTime.split(":")[0], 10);
  const endHour = parseInt(endTime.split(":")[0], 10);
  const duration = endHour - startHour || 3;
  const totalPrice = duration * pricePerHour;

  const handleConfirmBooking = async () => {
    setBookingError(null);
    if (!user) {
      router.push("/sign-in");
      return;
    }
    if (!eventDate) {
      setBookingError("Please pick an event date first.");
      return;
    }
    try {
      await createBooking.mutateAsync({
        listingId: venueId,
        eventDate,
        startTime,
        endTime,
        guestCount,
        totalAmount: totalPrice,
      });
      setIsBookingOpen(false);
      router.push("/dashboard");
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Booking failed");
    }
  };

  return (
    <>
      <div className="sticky top-24 space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-[#EB4D4B]">
            {currency} {pricePerHour}
          </span>
          <span className="text-sm text-gray-400">/hour</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {halalVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EB4D4B]/10 px-2.5 py-1 text-xs font-semibold text-[#EB4D4B]">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Halal Verified
            </span>
          )}
          {eventTypes.map((type) => (
            <span key={type} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              {type}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900">Book This Venue</h3>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Event Date
            </label>
            <CustomDatePicker
              value={eventDate}
              onChange={setEventDate}
              placeholder="Pick a date"
              minDate={new Date().toISOString().split("T")[0]}
              id="booking-date"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Start Time
              </label>
              <CustomTimePicker
                value={startTime}
                onChange={setStartTime}
                id="start-time"
                startHour={8}
                endHour={22}
                interval={60}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                End Time
              </label>
              <CustomTimePicker
                value={endTime}
                onChange={setEndTime}
                id="end-time"
                startHour={9}
                endHour={23}
                interval={60}
              />
            </div>
          </div>

          <div>
            <label htmlFor="guest-count" className="mb-1 block text-xs font-medium text-gray-500">
              Guests (max {capacity})
            </label>
            <input
              id="guest-count"
              type="number"
              min={1}
              max={capacity}
              value={guestCount}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > 0 && val <= capacity) setGuestCount(val);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
            />
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{currency} {pricePerHour}/hour &times; {duration} hours</span>
              <span>{currency} {totalPrice.toLocaleString()}</span>
            </div>
            <div className="mt-2 border-t border-gray-200 pt-2">
              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Total</span>
                <span className="text-[#EB4D4B]">{currency} {totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsInquiryOpen(true)}
            className="w-full rounded-xl border-2 border-[#EB4D4B] bg-white px-6 py-3.5 text-sm font-bold text-[#EB4D4B] transition-all hover:bg-[#EB4D4B]/5"
          >
            Send Inquiry
          </button>

          <button
            type="button"
            onClick={() => setIsBookingOpen(true)}
            className="w-full rounded-xl bg-[#EB4D4B] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] hover:shadow-lg hover:shadow-[#EB4D4B]/30 active:scale-[0.98]"
          >
            Book Now
          </button>

          <p className="text-center text-xs text-gray-400">
            Free cancellation up to 7 days before your event
          </p>
        </div>
      </div>

      </div>

      {isBookingOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setIsBookingOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {bookingLoading ? (
              <div className="py-8">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#EB4D4B]" />
                <p className="mt-4 text-sm text-gray-500">Processing booking...</p>
              </div>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Confirm Booking</h2>
                <p className="mt-2 text-sm text-gray-500">
                  You are about to book <span className="font-semibold text-gray-700">{venueTitle}</span> for{" "}
                  <span className="font-semibold text-[#EB4D4B]">{currency} {totalPrice.toLocaleString()}</span>.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {eventDate && `Event date: ${new Date(eventDate).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}`}
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setIsBookingOpen(false)}
                    className="flex-1 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    className="flex-1 rounded-xl bg-[#EB4D4B] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626]"
                  >
                    Confirm
                  </button>
                </div>
                {bookingError && (
                  <p className="mt-3 text-xs text-red-600">{bookingError}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <InquiryFormModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        venueTitle={venueTitle}
        venueId={venueId}
        capacity={capacity}
        pricePerHour={pricePerHour}
        currency={currency}
      />
    </>
  );
}
