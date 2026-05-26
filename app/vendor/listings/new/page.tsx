"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VendorPortalLayout from "@/components/VendorPortalLayout";

const eventTypeOptions = [
  "Wedding", "Corporate", "Private Party", "Birthday", "Seminar",
  "Launch", "Conference", "Exhibition", "Workshop", "Networking",
  "Gala Dinner", "Concert", "Team Building", "Religious Ceremony", "Graduation",
];

const amenityOptions = [
  "WiFi", "AV System", "Catering", "Free Parking", "Valet Parking",
  "Stage", "Dressing Room", "Garden", "Outdoor Lighting", "Bar Service",
  "Helipad Access", "Swimming Pool", "Prayer Room", "Bridal Suite",
  "Kitchen Access", "Air Conditioning", "Sound System", "Projector / Screen",
  "Wheelchair Access", "Elevator", "Security", "Cleaning Service",
  "Tables & Chairs", "Dance Floor", "Karaoke System", "Photo Booth",
  "Kids Play Area", "Smoking Area", "Green Room", "Loading Bay",
];

const currencyOptions = ["MYR", "SGD", "THB", "IDR", "USD"];

export default function AddVenuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [currency, setCurrency] = useState("MYR");

  // Event Types & Amenities
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Halal
  const [halalVerified, setHalalVerified] = useState(false);

  // Photos
  const [photos, setPhotos] = useState<{ name: string; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contact
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const toggleEventType = (type: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = Array.from(files).map((f) => ({
        name: f.name,
        preview: URL.createObjectURL(f),
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  if (success) {
    return (
      <VendorPortalLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Venue Listed Successfully!</h2>
          <p className="mt-2 text-sm text-gray-500">
            Your venue has been submitted and is now pending review. You&apos;ll be notified once it&apos;s approved.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/vendor/listings"
              className="rounded-xl bg-[#EB4D4B] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 hover:bg-[#dc2626]"
            >
              View Listings
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setTitle("");
                setDescription("");
                setAddress("");
                setLocation("");
                setCapacity("");
                setPricePerHour("");
                setSelectedEventTypes([]);
                setSelectedAmenities([]);
                setHalalVerified(false);
                setPhotos([]);
                setContactName("");
                setContactPhone("");
                setContactEmail("");
              }}
              className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add Another Venue
            </button>
          </div>
        </div>
      </VendorPortalLayout>
    );
  }

  return (
    <VendorPortalLayout>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/listings"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Venue</h1>
          <p className="mt-0.5 text-sm text-gray-500">Fill in the details to list your venue on EventVenue.Asia</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Section: Basic Information */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          <p className="mt-1 text-sm text-gray-500">Tell customers about your venue</p>

          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-gray-700">
                Venue Name <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grand Ballroom at The Majestic"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your venue — what makes it special, the atmosphere, ideal events..."
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
              />
              <p className="mt-1 text-xs text-gray-400">{description.length}/500 characters</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-gray-700">
                  City / Area <span className="text-red-400">*</span>
                </label>
                <input
                  id="location"
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kuala Lumpur, Malaysia"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
              <div>
                <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Full Address <span className="text-red-400">*</span>
                </label>
                <input
                  id="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 5 Jalan Sultan Hishamuddin, 50000 KL"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="capacity" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Max Capacity <span className="text-red-400">*</span>
                </label>
                <input
                  id="capacity"
                  type="number"
                  required
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 300"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
              <div>
                <label htmlFor="price" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Price per Hour <span className="text-red-400">*</span>
                </label>
                <input
                  id="price"
                  type="number"
                  required
                  min={0}
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
              <div>
                <label htmlFor="currency" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                >
                  {currencyOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Event Types */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Event Types</h2>
          <p className="mt-1 text-sm text-gray-500">What types of events is your venue suitable for?</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {eventTypeOptions.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleEventType(type)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  selectedEventTypes.includes(type)
                    ? "border-[#EB4D4B] bg-red-50 text-[#EB4D4B]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {selectedEventTypes.includes(type) && (
                  <svg className="mr-1.5 inline h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {type}
              </button>
            ))}
          </div>
        </section>

        {/* Section: Amenities */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Amenities</h2>
          <p className="mt-1 text-sm text-gray-500">Select all amenities available at your venue</p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {amenityOptions.map((amenity) => (
              <label
                key={amenity}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                  selectedAmenities.includes(amenity)
                    ? "border-[#EB4D4B] bg-red-50/50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                  className="h-4 w-4 rounded border-gray-300 text-[#EB4D4B] focus:ring-[#EB4D4B]"
                />
                <span className="text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>

          {/* Halal Verification */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={halalVerified}
                onChange={(e) => setHalalVerified(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#EB4D4B] focus:ring-[#EB4D4B]"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Halal Verified</span>
                <p className="text-xs text-gray-500">This venue has halal certification from JAKIM or state authority</p>
              </div>
            </label>
          </div>
        </section>

        {/* Section: Photos */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Photos</h2>
          <p className="mt-1 text-sm text-gray-500">Upload high-quality photos of your venue (minimum 3 recommended)</p>

          <div className="mt-4">
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center transition-colors hover:border-[#EB4D4B]/40 hover:bg-red-50/30">
              <input
                type="file"
                id="photoUpload"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <label htmlFor="photoUpload" className="cursor-pointer">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-gray-700">Click to upload photos</p>
                <p className="mt-1 text-xs text-gray-400">JPG, PNG, WebP (max 5MB each)</p>
              </label>
            </div>

            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {photos.map((photo, index) => (
                  <div key={index} className="group relative aspect-video overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                    <img src={photo.preview} alt={photo.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Section: Contact Information */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
          <p className="mt-1 text-sm text-gray-500">How can customers reach you about this venue?</p>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="contactName" className="mb-1.5 block text-sm font-medium text-gray-700">
                Contact Person
              </label>
              <input
                id="contactName"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
              />
            </div>
            <div>
              <label htmlFor="contactPhone" className="mb-1.5 block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+60 12-345 6789"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
              />
            </div>
            <div>
              <label htmlFor="contactEmail" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="venue@business.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
              />
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Your listing will be reviewed before going live.
          </p>
          <div className="flex gap-3">
            <Link
              href="/vendor/listings"
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#EB4D4B] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                "Submit Venue"
              )}
            </button>
          </div>
        </div>
      </form>
    </VendorPortalLayout>
  );
}
