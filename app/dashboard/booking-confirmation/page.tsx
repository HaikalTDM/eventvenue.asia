"use client";

import { useState } from "react";
import Link from "next/link";

type BookingStep = "review" | "confirming" | "services" | "confirmed";

const suggestedServices = [
  { id: "svc-1", name: "Hassan Premium Catering", category: "Catering", price: "RM 95/pax", description: "Halal fusion menu, live cooking stations", avatar: "H", selected: false },
  { id: "svc-2", name: "Lisa Creative Photography", category: "Photography", price: "From RM 3,500", description: "Full-day coverage, 2 photographers", avatar: "L", selected: false },
  { id: "svc-3", name: "DJ Rizal Entertainment", category: "DJ & Entertainment", price: "From RM 2,000", description: "Sound system, lighting, MC services", avatar: "R", selected: false },
  { id: "svc-4", name: "Blossom Decoration Studio", category: "Decoration", price: "From RM 4,500", description: "Floral arrangements, stage decor, table settings", avatar: "B", selected: false },
];

export default function BookingConfirmationPage() {
  const [step, setStep] = useState<BookingStep>("review");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const quote = {
    id: "quote-001",
    venueName: "Grand Ballroom at The Majestic KL",
    vendorName: "Aisha Rahman",
    eventType: "Wedding Reception",
    eventDate: "March 15, 2025",
    startTime: "6:00 PM",
    endTime: "11:00 PM",
    guestCount: 250,
    items: [
      { label: "Venue rental (5 hours)", amount: 5000 },
      { label: "AV system & lighting", amount: 1500 },
      { label: "Stage setup", amount: 800 },
      { label: "Dressing room access", amount: 500 },
      { label: "Valet parking (50 cars)", amount: 750 },
    ],
    currency: "MYR",
    total: 8550,
    validUntil: "January 30, 2025",
    notes: "Price includes setup and teardown. Catering is separate. 50% deposit required to confirm booking.",
  };

  const handleConfirm = () => {
    setStep("confirming");
    setTimeout(() => setStep("services"), 1500);
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const handleFinalize = () => {
    setStep("confirmed");
  };

  const BackButton = () => (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <Link href="/dashboard/inquiries" className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Inquiries
      </Link>
    </div>
  );

  // Step: Add Services
  if (step === "services") {
    return (
      <div className="min-h-screen bg-gray-50">
        <BackButton />
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Venue Confirmed!</h1>
            <p className="mt-2 text-sm text-gray-500">Complete your event with recommended services</p>
          </div>
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Recommended Services</h2>
            <p className="mt-1 text-sm text-gray-500">Based on your {quote.eventType.toLowerCase()} at {quote.venueName}</p>
            <div className="mt-5 space-y-3">
              {suggestedServices.map((svc) => {
                const isSelected = selectedServices.includes(svc.id);
                return (
                  <button key={svc.id} type="button" onClick={() => toggleService(svc.id)} className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${isSelected ? "border-[#EB4D4B] bg-red-50/50" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${isSelected ? "bg-[#EB4D4B]" : "bg-gray-400"}`}>{svc.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">{svc.category}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{svc.description}</p>
                      <p className="mt-1 text-xs font-medium text-[#EB4D4B]">{svc.price}</p>
                    </div>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${isSelected ? "border-[#EB4D4B] bg-[#EB4D4B]" : "border-gray-300"}`}>
                      {isSelected && <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-gray-400">Selected services will receive your event brief automatically. You can chat with them to finalize details.</p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button onClick={handleFinalize} className="text-sm font-medium text-gray-500 hover:text-gray-700">Skip for now</button>
            <button onClick={handleFinalize} disabled={selectedServices.length === 0} className="rounded-xl bg-[#EB4D4B] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 hover:bg-[#dc2626] disabled:opacity-40">
              {selectedServices.length > 0 ? `Continue with ${selectedServices.length} service${selectedServices.length > 1 ? "s" : ""}` : "Select services to continue"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step: Confirmed
  if (step === "confirmed") {
    const selectedNames = suggestedServices.filter((s) => selectedServices.includes(s.id)).map((s) => s.name);
    return (
      <div className="min-h-screen bg-gray-50">
        <BackButton />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Booking Confirmed!</h1>
          <p className="mt-3 text-gray-500">The vendor has been notified and will contact you shortly.</p>
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm">
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-gray-500">Venue</span><span className="text-sm font-medium text-gray-900">{quote.venueName}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Event</span><span className="text-sm font-medium text-gray-900">{quote.eventType}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Date</span><span className="text-sm font-medium text-gray-900">{quote.eventDate}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Guests</span><span className="text-sm font-medium text-gray-900">{quote.guestCount}</span></div>
              {selectedNames.length > 0 && (<div className="flex justify-between border-t border-gray-100 pt-3"><span className="text-sm text-gray-500">Services</span><span className="text-sm font-medium text-gray-900 text-right">{selectedNames.join(", ")}</span></div>)}
              <div className="flex justify-between border-t border-gray-100 pt-3"><span className="text-sm font-bold text-gray-900">Venue Total</span><span className="text-sm font-bold text-gray-900">{quote.currency} {quote.total.toLocaleString()}</span></div>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left">
            <h3 className="text-sm font-semibold text-amber-800">What happens next?</h3>
            <ol className="mt-2 space-y-1.5 text-sm text-amber-700">
              <li>1. The vendor will contact you to finalize details</li>
              <li>2. Pay the 50% deposit to secure your booking</li>
              <li>3. Remaining balance due 7 days before the event</li>
            </ol>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/dashboard" className="rounded-xl bg-[#EB4D4B] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 hover:bg-[#dc2626]">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  // Step: Review Quote (default)
  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Event Details</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400">Venue</p><p className="mt-0.5 text-sm font-medium text-gray-900">{quote.venueName}</p></div>
                <div><p className="text-xs text-gray-400">Event Type</p><p className="mt-0.5 text-sm font-medium text-gray-900">{quote.eventType}</p></div>
                <div><p className="text-xs text-gray-400">Date</p><p className="mt-0.5 text-sm font-medium text-gray-900">{quote.eventDate}</p></div>
                <div><p className="text-xs text-gray-400">Time</p><p className="mt-0.5 text-sm font-medium text-gray-900">{quote.startTime} – {quote.endTime}</p></div>
                <div><p className="text-xs text-gray-400">Guests</p><p className="mt-0.5 text-sm font-medium text-gray-900">{quote.guestCount} pax</p></div>
                <div><p className="text-xs text-gray-400">Valid Until</p><p className="mt-0.5 text-sm font-medium text-gray-900">{quote.validUntil}</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Price Breakdown</h2>
              <div className="mt-4 space-y-3">
                {quote.items.map((item, i) => (<div key={i} className="flex justify-between"><span className="text-sm text-gray-600">{item.label}</span><span className="text-sm font-medium text-gray-900">{quote.currency} {item.amount.toLocaleString()}</span></div>))}
                <div className="flex justify-between border-t border-gray-100 pt-3"><span className="text-sm font-bold text-gray-900">Total</span><span className="text-lg font-bold text-gray-900">{quote.currency} {quote.total.toLocaleString()}</span></div>
              </div>
              {quote.notes && <div className="mt-4 rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">{quote.notes}</p></div>}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-center text-2xl font-bold text-gray-900">{quote.currency} {quote.total.toLocaleString()}</p>
              <p className="mt-1 text-center text-xs text-gray-400">Total quoted amount</p>
              <button onClick={handleConfirm} disabled={step === "confirming"} className="mt-5 w-full rounded-xl bg-[#EB4D4B] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 hover:bg-[#dc2626] disabled:opacity-60">
                {step === "confirming" ? <span className="inline-flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Confirming...</span> : "Accept & Confirm Booking"}
              </button>
              <Link href="/dashboard/inquiries" className="mt-3 block w-full rounded-xl border border-gray-200 px-6 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">Decline</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
