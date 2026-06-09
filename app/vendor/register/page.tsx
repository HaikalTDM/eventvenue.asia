"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { VendorType, ServiceCategory } from "@/lib/types";

type Step = 1 | 2 | 3 | 4;

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

export default function VendorRegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  // Form state
  const [vendorType, setVendorType] = useState<VendorType | "">("");
  const [businessName, setBusinessName] = useState("");
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory | "">("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [documents, setDocuments] = useState<{ name: string; type: string }[]>([]);

  const [locationOpen, setLocationOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  const malaysiaLocations = [
    "Kuala Lumpur", "Petaling Jaya", "Subang Jaya", "Shah Alam",
    "Klang", "Johor Bahru", "Penang", "Ipoh", "Malacca",
    "Kota Kinabalu", "Kuching", "Putrajaya", "Cyberjaya",
    "Seremban", "Kuantan", "Alor Setar", "Kota Bharu",
    "Kuala Terengganu", "George Town", "Miri",
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!vendorType) newErrors.vendorType = "Please select an account type";
    }

    if (currentStep === 2) {
      if (!businessName.trim()) newErrors.businessName = "Business name is required";
      if (vendorType === "service" && !serviceCategory) newErrors.serviceCategory = "Please select a service category";
      if (!location.trim()) newErrors.location = "Location is required";
    }

    if (currentStep === 3) {
      if (!name.trim()) newErrors.name = "Full name is required";
      if (!email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email format";
      if (!phone.trim()) newErrors.phone = "Phone number is required";
      if (!password) newErrors.password = "Password is required";
      else if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
      if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
      if (!agreeTerms) newErrors.agreeTerms = "You must agree to the terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((step + 1) as Step);
    }
  };

  const prevStep = () => {
    setStep((step - 1) as Step);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Map UI vendorType ("venue" | "service") to the schema enum
      // ("venue_owner" | "service_provider") expected by the API.
      const apiVendorType =
        vendorType === "venue" ? "venue_owner" : "service_provider";

      const res = await fetch("/api/v1/vendors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorType: apiVendorType,
          businessName,
          businessDescription: description || undefined,
          businessLocation: location,
          serviceCategory: vendorType === "service" ? serviceCategory || null : null,
          user: { name, email, phone, password },
          // documents excluded for now: the vendor_documents.fileUrl is
          // required and must be a real URL. R2 upload comes in Phase C.
        }),
      });
      if (res.ok) {
        router.push("/vendor/dashboard");
      } else {
        const err = await res.json().catch(() => null);
        const detail = err?.error?.details?.[0]?.message;
        alert(detail || err?.error?.message || "Registration failed");
      }
    } catch {
      alert("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newDocs = Array.from(files).map((f) => ({ name: f.name, type: f.type }));
      setDocuments((prev) => [...prev, ...newDocs]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EB4D4B] text-sm font-bold text-white">
              EV
            </span>
            EventVenue<span className="text-[#EB4D4B]">.Asia</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Become a Vendor</h1>
          <p className="mt-2 text-sm text-gray-500">
            Join our marketplace and reach thousands of event planners
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  s < step
                    ? "bg-[#EB4D4B] text-white"
                    : s === step
                    ? "bg-[#EB4D4B] text-white ring-4 ring-[#EB4D4B]/20"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s < step ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              {s < 4 && (
                <div className={`h-0.5 w-8 rounded-full transition-all ${s < step ? "bg-[#EB4D4B]" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-center">
          <p className="text-xs text-gray-400">
            {step === 1 && "Account Type"}
            {step === 2 && "Business Info"}
            {step === 3 && "Personal Details"}
            {step === 4 && "Documents"}
          </p>
        </div>

        {/* Form Card */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Step 1: Account Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">What type of vendor are you?</h2>
              <p className="text-sm text-gray-500">Choose the option that best describes your business</p>

              <div className="mt-4 grid gap-4">
                <button
                  type="button"
                  onClick={() => setVendorType("venue")}
                  className={`flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all ${
                    vendorType === "venue"
                      ? "border-[#EB4D4B] bg-red-50/50 ring-2 ring-[#EB4D4B]/20"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${vendorType === "venue" ? "bg-[#EB4D4B] text-white" : "bg-gray-100 text-gray-500"}`}>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 22h20M6 18V8l6-4 6 4v10M9 22v-4a3 3 0 016 0v4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Venue Owner</p>
                    <p className="mt-1 text-sm text-gray-500">
                      I own or manage event spaces — ballrooms, rooftops, gardens, conference halls, etc.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVendorType("service")}
                  className={`flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all ${
                    vendorType === "service"
                      ? "border-[#EB4D4B] bg-red-50/50 ring-2 ring-[#EB4D4B]/20"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${vendorType === "service" ? "bg-[#EB4D4B] text-white" : "bg-gray-100 text-gray-500"}`}>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17l-5.1-5.1a2.5 2.5 0 010-3.54l.7-.7a2.5 2.5 0 013.54 0l5.1 5.1m-4.24 4.24l4.24-4.24m0 0l5.1 5.1a2.5 2.5 0 010 3.54l-.7.7a2.5 2.5 0 01-3.54 0l-5.1-5.1" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Service Provider</p>
                    <p className="mt-1 text-sm text-gray-500">
                      I provide event services — catering, photography, DJ, decoration, makeup, planning, etc.
                    </p>
                  </div>
                </button>
              </div>

              {errors.vendorType && <p className="text-sm text-red-500">{errors.vendorType}</p>}
            </div>
          )}

          {/* Step 2: Business Information */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Tell us about your business</h2>

              <div>
                <label htmlFor="businessName" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={vendorType === "venue" ? "e.g. Grand Ballroom KL" : "e.g. Hassan Catering Services"}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
                {errors.businessName && <p className="mt-1 text-xs text-red-500">{errors.businessName}</p>}
              </div>

              {vendorType === "service" && (
                <div className="relative" ref={catRef}>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Service Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setCatOpen(!catOpen)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20 ${
                      serviceCategory ? "border-gray-200 bg-gray-50 text-gray-900" : "border-gray-200 bg-gray-50 text-gray-400"
                    }`}
                  >
                    <span>{serviceCategory ? serviceCategories.find((c) => c.value === serviceCategory)?.label : "Select a category"}</span>
                    <svg className={`h-4 w-4 text-gray-400 transition-transform ${catOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {catOpen && (
                    <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                      <ul className="max-h-56 overflow-y-auto">
                        {serviceCategories.map((cat) => (
                          <li key={cat.value}>
                            <button
                              type="button"
                              onClick={() => {
                                setServiceCategory(cat.value);
                                setCatOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                                cat.value === serviceCategory
                                  ? "bg-red-50 font-semibold text-[#EB4D4B]"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {cat.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {errors.serviceCategory && <p className="mt-1 text-xs text-red-500">{errors.serviceCategory}</p>}
                </div>
              )}

              <div className="relative" ref={locationRef}>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Business Location
                </label>
                <button
                  type="button"
                  onClick={() => setLocationOpen(!locationOpen)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20 ${
                    location ? "border-gray-200 bg-gray-50 text-gray-900" : "border-gray-200 bg-gray-50 text-gray-400"
                  }`}
                >
                  <span>{location || "e.g. Kuala Lumpur, Malaysia"}</span>
                  <svg className={`h-4 w-4 text-gray-400 transition-transform ${locationOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {locationOpen && (
                  <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                    <ul className="max-h-56 overflow-y-auto">
                      {malaysiaLocations.map((loc) => (
                        <li key={loc}>
                          <button
                            type="button"
                            onClick={() => {
                              setLocation(loc);
                              setLocationOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                              loc === location
                                ? "bg-red-50 font-semibold text-[#EB4D4B]"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {loc}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
              </div>

              <div>
                <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Brief Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell potential customers what makes your business special..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
              </div>
            </div>
          )}

          {/* Step 3: Personal Details */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Your account details</h2>

              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="regEmail" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="regEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+60 12-345 6789"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="regPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="regPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#EB4D4B] focus:ring-[#EB4D4B]"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{" "}
                  <Link href="#" className="text-[#EB4D4B] hover:underline">Terms of Service</Link>{" "}
                  and{" "}
                  <Link href="#" className="text-[#EB4D4B] hover:underline">Privacy Policy</Link>
                </span>
              </label>
              {errors.agreeTerms && <p className="text-xs text-red-500">{errors.agreeTerms}</p>}
            </div>
          )}

          {/* Step 4: Document Upload */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Upload verification documents</h2>
              <p className="text-sm text-gray-500">
                Help us verify your business. Upload relevant documents to get the verified badge faster.
              </p>

              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center transition-colors hover:border-[#EB4D4B]/40 hover:bg-red-50/30">
                <input
                  type="file"
                  id="docUpload"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="docUpload" className="cursor-pointer">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                    </svg>
                  </div>
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Click to upload or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-gray-400">PDF, JPG, PNG (max 10MB each)</p>
                </label>
              </div>

              {/* Document suggestions */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-sm font-medium text-amber-800">Recommended documents:</p>
                <ul className="mt-2 space-y-1 text-sm text-amber-700">
                  <li className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Business registration certificate (SSM)
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Halal certification (JAKIM/state authority)
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Premises license or operating permit
                  </li>
                </ul>
              </div>

              {/* Uploaded files list */}
              {documents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Uploaded files:</p>
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                          <svg className="h-4 w-4 text-[#EB4D4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700 truncate max-w-[200px]">{doc.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400">
                Documents are optional at this stage. You can upload them later from your vendor dashboard.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1 rounded-xl bg-[#EB4D4B] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626]"
              >
                Continue
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-[#EB4D4B] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating account...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sign in link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have a vendor account?{" "}
          <Link href="/vendor/login" className="font-medium text-[#EB4D4B] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
