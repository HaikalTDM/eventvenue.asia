"use client";

import { useState } from "react";
import { useVendorAuth } from "@/lib/vendor-auth";
import VendorPortalLayout from "@/components/VendorPortalLayout";

export default function VendorSettingsPage() {
  const { vendor } = useVendorAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "password" | "notifications">("profile");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Profile fields
  const [businessName, setBusinessName] = useState(vendor?.vendorName ?? "");
  const [name, setName] = useState(vendor?.name ?? "");
  const [email, setEmail] = useState(vendor?.email ?? "");
  const [phone, setPhone] = useState(vendor?.phone ?? "");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState({
    newInquiry: true,
    quoteAccepted: true,
    bookingConfirmed: true,
    reviewReceived: true,
    marketing: false,
  });
  const [smsNotifs, setSmsNotifs] = useState({
    newInquiry: true,
    quoteAccepted: true,
    bookingConfirmed: false,
    reviewReceived: false,
    marketing: false,
  });

  if (!vendor) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    }, 800);
  };

  const handleSaveNotifications = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  const tabs = [
    { id: "profile" as const, label: "Business Profile" },
    { id: "password" as const, label: "Password" },
    { id: "notifications" as const, label: "Notifications" },
  ];

  return (
    <VendorPortalLayout>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage your account and preferences</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Changes saved
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="mt-6 space-y-6">
          {/* Avatar / Logo */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Profile Photo</h3>
            <div className="mt-4 flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500">
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <button type="button" className="rounded-xl bg-[#EB4D4B] px-4 py-2 text-sm font-medium text-white hover:bg-[#dc2626]">
                  Upload Photo
                </button>
                <p className="mt-1.5 text-xs text-gray-400">JPG, PNG. Max 2MB. Recommended 200x200px.</p>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Business Information</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="businessName" className="mb-1.5 block text-sm font-medium text-gray-700">Business Name</label>
                <input id="businessName" type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20" />
              </div>
              <div>
                <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-gray-700">Bio / About</label>
                <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell customers about your business..." className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="website" className="mb-1.5 block text-sm font-medium text-gray-700">Website</label>
                  <input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourbusiness.com" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20" />
                </div>
                <div>
                  <label htmlFor="settingsLocation" className="mb-1.5 block text-sm font-medium text-gray-700">Location</label>
                  <input id="settingsLocation" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Kuala Lumpur, Malaysia" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20" />
                </div>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Personal Information</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="settingsName" className="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
                <input id="settingsName" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20" />
              </div>
              <div>
                <label htmlFor="settingsEmail" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                <input id="settingsEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20" />
              </div>
              <div>
                <label htmlFor="settingsPhone" className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
                <input id="settingsPhone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Vendor Type</label>
                <div className="flex h-[46px] items-center rounded-xl border border-gray-200 bg-gray-100 px-4 text-sm text-gray-500">
                  {vendor.vendorType === "venue" || vendor.vendorType === "venue_owner" ? "Venue Owner" : "Service Provider"}
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#EB4D4B] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] disabled:opacity-60">
              {loading ? (<><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving...</>) : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <form onSubmit={handleChangePassword} className="mt-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
            <div className="mt-4 max-w-md space-y-4">
              <div>
                <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-gray-700">Current Password</label>
                <input id="currentPassword" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20" />
              </div>
              <div>
                <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-gray-700">New Password</label>
                <input id="newPassword" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20" />
              </div>
              <div>
                <label htmlFor="confirmNewPassword" className="mb-1.5 block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input id="confirmNewPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20" />
              </div>

              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
              {passwordSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Password updated successfully
                </div>
              )}

              <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#EB4D4B] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] disabled:opacity-60">
                {loading ? (<><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Updating...</>) : "Update Password"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="mt-6 space-y-6">
          {/* Email Notifications */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Email Notifications</h3>
            <p className="mt-1 text-xs text-gray-500">Choose what emails you receive</p>
            <div className="mt-4 space-y-3">
              {([
                { key: "newInquiry", label: "New inquiry received", desc: "When a customer sends you an inquiry" },
                { key: "quoteAccepted", label: "Quote accepted", desc: "When a customer accepts your quote" },
                { key: "bookingConfirmed", label: "Booking confirmed", desc: "When a booking is confirmed" },
                { key: "reviewReceived", label: "New review", desc: "When a customer leaves a review" },
                { key: "marketing", label: "Tips & updates", desc: "Platform news, tips to grow your business" },
              ] as const).map((item) => (
                <label key={item.key} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifs[item.key]}
                    onChange={(e) => setEmailNotifs((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-[#EB4D4B] focus:ring-[#EB4D4B]"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">SMS Notifications</h3>
            <p className="mt-1 text-xs text-gray-500">Choose what SMS alerts you receive</p>
            <div className="mt-4 space-y-3">
              {([
                { key: "newInquiry", label: "New inquiry received" },
                { key: "quoteAccepted", label: "Quote accepted" },
                { key: "bookingConfirmed", label: "Booking confirmed" },
                { key: "reviewReceived", label: "New review" },
                { key: "marketing", label: "Promotions" },
              ] as const).map((item) => (
                <label key={item.key} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 hover:bg-gray-50 cursor-pointer">
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                  <input
                    type="checkbox"
                    checked={smsNotifs[item.key]}
                    onChange={(e) => setSmsNotifs((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-[#EB4D4B] focus:ring-[#EB4D4B]"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={handleSaveNotifications} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#EB4D4B] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] disabled:opacity-60">
              {loading ? (<><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving...</>) : "Save Preferences"}
            </button>
          </div>
        </div>
      )}
    </VendorPortalLayout>
  );
}
