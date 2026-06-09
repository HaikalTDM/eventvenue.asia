"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VendorPortalLayout from "@/components/VendorPortalLayout";
import type { ServiceCategory } from "@/lib/types";

const serviceCategories: { value: ServiceCategory; label: string }[] = [
  { value: "catering", label: "Catering" },
  { value: "photography", label: "Photography" },
  { value: "videography", label: "Videography" },
  { value: "decoration", label: "Decoration" },
  { value: "dj_entertainment", label: "DJ & Entertainment" },
  { value: "makeup", label: "Makeup & Styling" },
  { value: "planning", label: "Event Planning" },
  { value: "photobooth", label: "Photobooth Rental" },
  { value: "ice_cream", label: "Ice Cream Catering" },
  { value: "florist", label: "Florist & Bouquets" },
  { value: "cake", label: "Cake & Desserts" },
  { value: "transport", label: "Bridal Car & Transport" },
  { value: "emcee", label: "Emcee / Host" },
  { value: "live_band", label: "Live Band" },
  { value: "lighting", label: "Lighting & Sound" },
  { value: "bridal", label: "Bridal Wear & Rental" },
  { value: "henna", label: "Henna / Inai Art" },
];

const eventTypeOptions = [
  "Wedding", "Corporate", "Private Party", "Birthday", "Seminar",
  "Launch", "Conference", "Exhibition", "Workshop", "Networking",
];

export default function AddServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Basic Info
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [halalCertified, setHalalCertified] = useState(false);

  // Event Types
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);

  // Packages
  const [packages, setPackages] = useState<{ name: string; description: string; price: string; unit: string }[]>([
    { name: "", description: "", price: "", unit: "per_event" },
  ]);

  // Photos
  const [photos, setPhotos] = useState<{ name: string; preview: string }[]>([]);

  // Tags
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const toggleEventType = (type: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const addPackage = () => {
    setPackages((prev) => [...prev, { name: "", description: "", price: "", unit: "per_event" }]);
  };

  const removePackage = (index: number) => {
    setPackages((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePackage = (index: number, field: string, value: string) => {
    setPackages((prev) =>
      prev.map((pkg, i) => (i === index ? { ...pkg, [field]: value } : pkg))
    );
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
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
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!title.trim()) {
      setSubmitError("Service title is required.");
      return;
    }
    if (!category) {
      setSubmitError("Please pick a service category.");
      return;
    }

    // Pick the lowest-priced package as the listing's headline price.
    // The full package list will be persisted via service_packages once
    // the dedicated endpoint lands; for now we just surface a starting price.
    const numericPrices = packages
      .map((p) => parseFloat(p.price))
      .filter((n) => Number.isFinite(n) && n > 0);
    const headlinePrice = numericPrices.length > 0 ? Math.min(...numericPrices) : undefined;

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        listingType: "service",
        title,
        description: description || undefined,
        location: location || undefined,
        halalCertified,
        eventTypes: selectedEventTypes,
      };
      if (headlinePrice !== undefined) body.pricePerHour = headlinePrice;

      const res = await fetch("/api/v1/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const detail = err?.error?.details?.[0]?.message;
        setSubmitError(detail || err?.error?.message || "Could not create service listing.");
        return;
      }
      setSuccess(true);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
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
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Service Listed Successfully!</h2>
          <p className="mt-2 text-sm text-gray-500">
            Your service has been submitted and is now pending review.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/vendor/listings" className="rounded-xl bg-[#EB4D4B] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 hover:bg-[#dc2626]">
              View Listings
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setTitle("");
                setCategory("");
                setDescription("");
                setLocation("");
                setAvailability("");
                setHalalCertified(false);
                setSelectedEventTypes([]);
                setPackages([{ name: "", description: "", price: "", unit: "per_event" }]);
                setPhotos([]);
                setTags([]);
              }}
              className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add Another Service
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
        <Link href="/vendor/listings" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Service</h1>
          <p className="mt-0.5 text-sm text-gray-500">List your service on EventVenue.Asia</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Basic Information */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          <p className="mt-1 text-sm text-gray-500">Tell customers about your service</p>

          <div className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Service Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Premium Wedding Photography"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
              <div>
                <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  id="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                >
                  <option value="">Select a category</option>
                  {serviceCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
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
                placeholder="Describe your service — what you offer, your experience, what makes you stand out..."
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Service Area <span className="text-red-400">*</span>
                </label>
                <input
                  id="location"
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Klang Valley, Malaysia"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
              <div>
                <label htmlFor="availability" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Availability
                </label>
                <input
                  id="availability"
                  type="text"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="e.g. Weekends, Evenings, Flexible"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
            </div>

            {/* Halal */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={halalCertified} onChange={(e) => setHalalCertified(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#EB4D4B] focus:ring-[#EB4D4B]" />
                <div>
                  <span className="text-sm font-medium text-gray-900">Halal Certified</span>
                  <p className="text-xs text-gray-500">My service complies with halal requirements (applicable for catering)</p>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* Event Types */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Event Types</h2>
          <p className="mt-1 text-sm text-gray-500">What types of events do you serve?</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {eventTypeOptions.map((type) => (
              <button key={type} type="button" onClick={() => toggleEventType(type)} className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${selectedEventTypes.includes(type) ? "border-[#EB4D4B] bg-red-50 text-[#EB4D4B]" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
                {selectedEventTypes.includes(type) && (<svg className="mr-1.5 inline h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>)}
                {type}
              </button>
            ))}
          </div>
        </section>

        {/* Packages */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Packages</h2>
              <p className="mt-1 text-sm text-gray-500">Define your service packages and pricing</p>
            </div>
            <button type="button" onClick={addPackage} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Package
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {packages.map((pkg, index) => (
              <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Package {index + 1}</span>
                  {packages.length > 1 && (
                    <button type="button" onClick={() => removePackage(index)} className="text-gray-400 hover:text-red-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={pkg.name}
                    onChange={(e) => updatePackage(index, "name", e.target.value)}
                    placeholder="Package name (e.g. Basic, Premium)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={pkg.price}
                      onChange={(e) => updatePackage(index, "price", e.target.value)}
                      placeholder="Price (MYR)"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                    />
                    <select
                      value={pkg.unit}
                      onChange={(e) => updatePackage(index, "unit", e.target.value)}
                      className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                    >
                      <option value="per_event">Per Event</option>
                      <option value="hourly">Hourly</option>
                      <option value="per_package">Per Package</option>
                    </select>
                  </div>
                </div>
                <textarea
                  value={pkg.description}
                  onChange={(e) => updatePackage(index, "description", e.target.value)}
                  placeholder="What's included in this package..."
                  rows={2}
                  className="mt-3 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Tags */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
          <p className="mt-1 text-sm text-gray-500">Add keywords to help customers find your service</p>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Type a tag and press Enter"
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
            />
            <button type="button" onClick={addTag} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-500">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Photos / Portfolio */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Portfolio Photos</h2>
          <p className="mt-1 text-sm text-gray-500">Showcase your best work</p>

          <div className="mt-4">
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center transition-colors hover:border-[#EB4D4B]/40 hover:bg-red-50/30">
              <input type="file" id="servicePhotos" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <label htmlFor="servicePhotos" className="cursor-pointer">
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
                    <button type="button" onClick={() => removePhoto(index)} className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Your listing will be reviewed before going live.</p>
          <div className="flex gap-3">
            <Link href="/vendor/listings" className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#EB4D4B] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] disabled:opacity-60">
              {loading ? (<><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Submitting...</>) : "Submit Service"}
            </button>
          </div>
        </div>
      </form>
    </VendorPortalLayout>
  );
}
