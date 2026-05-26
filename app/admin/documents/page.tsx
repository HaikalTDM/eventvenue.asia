"use client";

import { useState } from "react";

type DocStatus = "pending" | "approved" | "rejected";

type Document = {
  id: string;
  vendorName: string;
  businessName: string;
  docType: string;
  fileName: string;
  uploadedAt: string;
  status: DocStatus;
  notes?: string;
};

const mockDocuments: Document[] = [
  { id: "d-1", vendorName: "Farah Lim", businessName: "Elegant Events Hall", docType: "Halal Certificate (JAKIM)", fileName: "halal-cert-2025.pdf", uploadedAt: "2 hours ago", status: "pending" },
  { id: "d-2", vendorName: "Farah Lim", businessName: "Elegant Events Hall", docType: "SSM Business Registration", fileName: "ssm-registration.pdf", uploadedAt: "2 hours ago", status: "pending" },
  { id: "d-3", vendorName: "Raj Kumar", businessName: "Raj's Premium Catering", docType: "SSM Business Registration", fileName: "raj-ssm-cert.pdf", uploadedAt: "5 hours ago", status: "pending" },
  { id: "d-4", vendorName: "Raj Kumar", businessName: "Raj's Premium Catering", docType: "Food Handler License", fileName: "food-handler-license.jpg", uploadedAt: "5 hours ago", status: "pending" },
  { id: "d-5", vendorName: "Azman Ismail", businessName: "Skyview Rooftop KL", docType: "Premises License", fileName: "premises-license-2025.pdf", uploadedAt: "2 days ago", status: "pending" },
  { id: "d-6", vendorName: "Azman Ismail", businessName: "Skyview Rooftop KL", docType: "Halal Certificate (JAKIM)", fileName: "jakim-halal.pdf", uploadedAt: "2 days ago", status: "pending" },
  { id: "d-7", vendorName: "Hassan Catering", businessName: "Hassan Premium Catering", docType: "Halal Certificate (JAKIM)", fileName: "hassan-halal-renewal.pdf", uploadedAt: "4 days ago", status: "approved", notes: "Verified — valid until Dec 2025" },
  { id: "d-8", vendorName: "Aisha Rahman", businessName: "The Majestic KL", docType: "SSM Business Registration", fileName: "majestic-ssm.pdf", uploadedAt: "1 week ago", status: "approved", notes: "Verified" },
];

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState(mockDocuments);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = (id: string) => {
    setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, status: "approved" as DocStatus, notes: "Verified" } : d));
  };

  const handleReject = (id: string) => {
    setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, status: "rejected" as DocStatus, notes: rejectReason || "Document rejected" } : d));
    setRejectingId(null);
    setRejectReason("");
  };

  const filtered = documents.filter((d) => filter === "all" ? true : d.status === filter);

  const docTypeIcons: Record<string, string> = {
    "Halal Certificate (JAKIM)": "bg-green-500/10 text-green-400",
    "SSM Business Registration": "bg-blue-500/10 text-blue-400",
    "Premises License": "bg-purple-500/10 text-purple-400",
    "Food Handler License": "bg-amber-500/10 text-amber-400",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Document Verification</h1>
          <p className="mt-1 text-sm text-gray-400">Review and verify vendor documents</p>
        </div>
        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-400">
          {documents.filter((d) => d.status === "pending").length} pending
        </span>
      </div>

      {/* Filters */}
      <div className="mt-6 flex gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${filter === f ? "bg-[#EB4D4B] text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Documents List */}
      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 py-12 text-center">
            <p className="text-sm text-gray-400">No documents match this filter.</p>
          </div>
        ) : (
          filtered.map((doc) => (
            <div key={doc.id} className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-700">
                    <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${docTypeIcons[doc.docType] ?? "bg-gray-600 text-gray-300"}`}>
                        {doc.docType}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-white">{doc.businessName}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{doc.vendorName} · Uploaded {doc.uploadedAt}</p>
                    <p className="mt-1 text-xs text-gray-500">File: {doc.fileName}</p>
                    {doc.notes && (
                      <p className="mt-1 text-xs text-gray-400 italic">{doc.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {doc.status === "pending" ? (
                    <>
                      <button onClick={() => handleApprove(doc.id)} className="rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-green-500">
                        Approve
                      </button>
                      <button onClick={() => setRejectingId(doc.id)} className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500">
                        Reject
                      </button>
                      <button className="rounded-lg border border-gray-600 px-3.5 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700">
                        View
                      </button>
                    </>
                  ) : (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      doc.status === "approved" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {doc.status === "approved" ? "Approved" : "Rejected"}
                    </span>
                  )}
                </div>
              </div>

              {/* Reject Form */}
              {rejectingId === doc.id && (
                <div className="mt-4 border-t border-gray-700 pt-4">
                  <label className="block text-xs font-medium text-gray-300">Reason for rejection</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Document expired, image unclear, wrong document type..."
                    rows={2}
                    className="mt-1.5 w-full resize-none rounded-xl border border-gray-600 bg-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-400 outline-none focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                  />
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => handleReject(doc.id)} className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500">
                      Confirm Reject
                    </button>
                    <button onClick={() => { setRejectingId(null); setRejectReason(""); }} className="rounded-lg border border-gray-600 px-3.5 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700">
                      Cancel
                    </button>
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
