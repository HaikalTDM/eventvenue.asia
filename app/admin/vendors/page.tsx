"use client";

import { useState } from "react";

type VendorStatus = "pending" | "approved" | "rejected";

type PendingVendor = {
  id: string;
  name: string;
  businessName: string;
  type: "venue" | "service";
  category?: string;
  location: string;
  email: string;
  phone: string;
  appliedAt: string;
  documents: string[];
  status: VendorStatus;
};

const mockPendingVendors: PendingVendor[] = [
  { id: "pv-1", name: "Farah Lim", businessName: "Elegant Events Hall", type: "venue", location: "Penang, Malaysia", email: "farah@elegantevents.my", phone: "+60 12-456 7890", appliedAt: "2 hours ago", documents: ["SSM Certificate", "Halal Cert (JAKIM)"], status: "pending" },
  { id: "pv-2", name: "Raj Kumar", businessName: "Raj's Premium Catering", type: "service", category: "Catering", location: "Kuala Lumpur", email: "raj@rajcatering.com", phone: "+60 11-234 5678", appliedAt: "5 hours ago", documents: ["SSM Certificate", "Food Handler License"], status: "pending" },
  { id: "pv-3", name: "Mei Ling", businessName: "Blossom Decoration Studio", type: "service", category: "Decoration", location: "Johor Bahru", email: "meiling@blossom.my", phone: "+60 17-890 1234", appliedAt: "1 day ago", documents: ["SSM Certificate"], status: "pending" },
  { id: "pv-4", name: "Azman Ismail", businessName: "Skyview Rooftop KL", type: "venue", location: "Kuala Lumpur", email: "azman@skyview.my", phone: "+60 13-567 8901", appliedAt: "2 days ago", documents: ["SSM Certificate", "Premises License", "Halal Cert (JAKIM)"], status: "pending" },
  { id: "pv-5", name: "Priya Nair", businessName: "Priya Makeup Artistry", type: "service", category: "Makeup & Styling", location: "Selangor", email: "priya@priyamakeup.com", phone: "+60 16-345 6789", appliedAt: "3 days ago", documents: ["SSM Certificate", "Portfolio"], status: "pending" },
];

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState(mockPendingVendors);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setVendors((prev) => prev.map((v) => v.id === id ? { ...v, status: "approved" as VendorStatus } : v));
  };

  const handleReject = (id: string) => {
    setVendors((prev) => prev.map((v) => v.id === id ? { ...v, status: "rejected" as VendorStatus } : v));
  };

  const filtered = vendors.filter((v) => {
    if (filter === "all") return true;
    return v.status === filter;
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendor Approval</h1>
          <p className="mt-1 text-sm text-gray-400">Review and approve vendor applications</p>
        </div>
        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-400">
          {vendors.filter((v) => v.status === "pending").length} pending
        </span>
      </div>

      {/* Filters */}
      <div className="mt-6 flex gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              filter === f ? "bg-[#EB4D4B] text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Vendor List */}
      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 py-12 text-center">
            <p className="text-sm text-gray-400">No vendors match this filter.</p>
          </div>
        ) : (
          filtered.map((vendor) => (
            <div key={vendor.id} className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-700 text-sm font-bold text-white">
                    {vendor.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{vendor.businessName}</h3>
                    <p className="mt-0.5 text-xs text-gray-400">{vendor.name} · {vendor.location}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-300">
                        {vendor.type === "venue" ? "Venue" : vendor.category}
                      </span>
                      <span className="text-xs text-gray-500">Applied {vendor.appliedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {vendor.status === "pending" ? (
                    <>
                      <button onClick={() => handleApprove(vendor.id)} className="rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-green-500">
                        Approve
                      </button>
                      <button onClick={() => handleReject(vendor.id)} className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500">
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      vendor.status === "approved" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {vendor.status === "approved" ? "Approved" : "Rejected"}
                    </span>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === vendor.id ? null : vendor.id)}
                    className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700"
                  >
                    {expandedId === vendor.id ? "Less" : "Details"}
                  </button>
                </div>
              </div>

              {expandedId === vendor.id && (
                <div className="mt-4 grid gap-4 border-t border-gray-700 pt-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="mt-0.5 text-sm text-gray-200">{vendor.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="mt-0.5 text-sm text-gray-200">{vendor.phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500">Documents Submitted</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {vendor.documents.map((doc) => (
                        <span key={doc} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-700 px-3 py-1.5 text-xs text-gray-300">
                          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
