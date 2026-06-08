"use client";

import { useState } from "react";

import { useAdminVendors, useVendorVerification } from "@/hooks/use-admin";

type VendorStatus = "pending" | "approved" | "rejected";

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}

export default function AdminVendorsPage() {
  const [filter, setFilter] = useState<"all" | VendorStatus>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: vendors = [], isLoading: loading, error } = useAdminVendors({
    status: filter,
  });
  const verify = useVendorVerification();

  const handleAction = (vendorId: string, action: "approve" | "reject") => {
    verify.mutate({ vendorId, action });
  };

  const actionInFlight = verify.isPending ? verify.variables?.vendorId ?? null : null;
  const errorMessage = error?.message ?? null;

  const filtered = vendors.filter((v) => {
    if (filter === "all") return true;
    return v.verificationStatus === filter;
  });

  const pendingCount = vendors.filter((v) => v.verificationStatus === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendor Approval</h1>
          <p className="mt-1 text-sm text-gray-400">Review and approve vendor applications</p>
        </div>
        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-400">
          {pendingCount} pending
        </span>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 flex gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              filter === f
                ? "bg-[#EB4D4B] text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 py-12 text-center text-sm text-gray-400">
            Loading vendors...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 py-12 text-center">
            <p className="text-sm text-gray-400">No vendors match this filter.</p>
          </div>
        ) : (
          filtered.map((vendor) => {
            const isExpanded = expandedId === vendor.id;
            const isBusy = actionInFlight === vendor.id;
            return (
              <div
                key={vendor.id}
                className="rounded-2xl border border-gray-700 bg-gray-800 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-700 text-sm font-bold text-white">
                      {vendor.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{vendor.businessName}</h3>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {vendor.userName} · {vendor.businessLocation || "Location not set"}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-300">
                          {vendor.vendorType === "venue_owner" ? "Venue" : "Service"}
                        </span>
                        <span className="text-xs text-gray-500">
                          Applied {relativeTime(vendor.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {vendor.verificationStatus === "pending" ? (
                      <>
                        <button
                          onClick={() => handleAction(vendor.id, "approve")}
                          disabled={isBusy}
                          className="rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                        >
                          {isBusy ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleAction(vendor.id, "reject")}
                          disabled={isBusy}
                          className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          vendor.verificationStatus === "approved"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {vendor.verificationStatus === "approved" ? "Approved" : "Rejected"}
                      </span>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : vendor.id)}
                      className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700"
                    >
                      {isExpanded ? "Less" : "Details"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 grid gap-4 border-t border-gray-700 pt-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="mt-0.5 text-sm text-gray-200">{vendor.userEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Vendor ID</p>
                      <p className="mt-0.5 break-all font-mono text-xs text-gray-300">
                        {vendor.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Verification badge</p>
                      <p className="mt-0.5 text-sm text-gray-200 capitalize">
                        {vendor.verificationBadge}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="mt-0.5 text-sm text-gray-200 capitalize">
                        {vendor.verificationStatus}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
