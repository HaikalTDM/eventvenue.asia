"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getListingDetail, type ApiListingDetail } from "@/lib/api";
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

export default function EditVenuePage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<ApiListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [currency, setCurrency] = useState("MYR");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [halalVerified, setHalalVerified] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const result = await getListingDetail(listingId);
        const data = result.data;
        setListing(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setAddress(data.address ?? "");
        setLocation(data.location ?? "");
        setCapacity(data.capacity != null ? String(data.capacity) : "");
        setPricePerHour(data.pricePerHour ?? "");
        setCurrency(data.currency);
        setSelectedEventTypes(
          data.eventTypes?.map((e) => e.name) ?? []
        );
        setSelectedAmenities(
          data.amenities?.map((a) => a.name) ?? []
        );
        setHalalVerified(data.halalCertified);
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

  const toggleEventType = (type: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

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

  const isService = listing?.listingType === "service";
  const listingTitle = listing?.title ?? "";
  const displayType = isService ? "Service" : "Venue";

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
              Edit {displayType}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">{listingTitle}</p>
          </div>
        </div>
        {saved && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-2.5 text-sm font-medium text-green-700 shadow-lg animate-bounce">
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
            Changes saved
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Basic Information
          </h2>
          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="title"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                {displayType} Name
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="location"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  City / Area
                </label>
                <input
                  id="location"
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Full Address
                </label>
                <input
                  id="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="capacity"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Max Capacity
                </label>
                <input
                  id="capacity"
                  type="number"
                  required
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
              <div>
                <label
                  htmlFor="price"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Price per Hour
                </label>
                <input
                  id="price"
                  type="number"
                  required
                  min={0}
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
              <div>
                <label
                  htmlFor="currency"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                >
                  {currencyOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Event Types</h2>
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
                  <svg
                    className="mr-1.5 inline h-3.5 w-3.5"
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
                )}
                {type}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Amenities</h2>
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
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={halalVerified}
                onChange={(e) => setHalalVerified(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#EB4D4B] focus:ring-[#EB4D4B]"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Halal Verified
                </span>
                <p className="text-xs text-gray-500">
                  This {displayType.toLowerCase()} has halal certification from
                  JAKIM or state authority
                </p>
              </div>
            </label>
          </div>
        </section>

        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <Link
            href="/vendor/listings"
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#EB4D4B] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] disabled:opacity-60"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </VendorPortalLayout>
  );
}
