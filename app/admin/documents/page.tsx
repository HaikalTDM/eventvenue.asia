"use client";

import { useState } from "react";

import {
  useAdminDocuments,
  useReviewDocument,
  type ApiDocument,
} from "@/hooks/use-admin";

type DocType = "business_license" | "halal_cert" | "identity" | "other";

const docTypeLabels: Record<DocType, string> = {
  business_license: "SSM Business Registration",
  halal_cert: "Halal Certificate (JAKIM)",
  identity: "Identity Document",
  other: "Other",
};

const docTypeColors: Record<DocType, string> = {
  business_license: "bg-blue-500/10 text-blue-400",
  halal_cert: "bg-green-500/10 text-green-400",
  identity: "bg-purple-500/10 text-purple-400",
  other: "bg-gray-500/10 text-gray-300",
};

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

export default function AdminDocumentsPage() {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: documents = [], isLoading: loading, error } = useAdminDocuments(filter);
  const review = useReviewDocument();

  const handleApprove = (id: string) => {
    review.mutate({ docId: id, action: "approve" });
  };

  const handleReject = (id: string) => {
    review.mutate(
      { docId: id, action: "reject", reason: rejectReason || "Document rejected" },
      {
        onSuccess: () => {
          setRejectingId(null);
          setRejectReason("");
        },
      }
    );
  };

  const busyId = review.isPending ? review.variables?.docId ?? null : null;
  const errorMessage = error?.message ?? null;

  const pendingCount = documents.filter((d) => d.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Document Verification</h1>
          <p className="mt-1 text-sm text-gray-400">
            Review and verify vendor documents
          </p>
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

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 py-12 text-center text-sm text-gray-400">
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 py-12 text-center">
            <p className="text-sm text-gray-400">
              No documents match this filter.
            </p>
          </div>
        ) : (
          documents.map((doc) => {
            const isBusy = busyId === doc.id;
            return (
              <div
                key={doc.id}
                className="rounded-2xl border border-gray-700 bg-gray-800 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-700">
                      <svg
                        className="h-5 w-5 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${docTypeColors[doc.docType as DocType] ?? docTypeColors.other}`}
                        >
                          {docTypeLabels[doc.docType as DocType] ?? docTypeLabels.other}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-white">
                        {doc.vendor?.businessName ?? "Unknown vendor"}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {doc.vendor?.ownerName ?? "Owner"} ·{" "}
                        Uploaded {relativeTime(doc.createdAt)}
                      </p>
                      {doc.rejectReason && (
                        <p className="mt-1 text-xs italic text-red-300">
                          Reason: {doc.rejectReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleApprove(doc.id)}
                          disabled={isBusy}
                          className="rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                        >
                          {isBusy ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => setRejectingId(doc.id)}
                          disabled={isBusy}
                          className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-gray-600 px-3.5 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700"
                        >
                          View
                        </a>
                      </>
                    ) : (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          doc.status === "approved"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {doc.status === "approved" ? "Approved" : "Rejected"}
                      </span>
                    )}
                  </div>
                </div>

                {rejectingId === doc.id && (
                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <label className="block text-xs font-medium text-gray-300">
                      Reason for rejection
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Document expired, image unclear, wrong document type..."
                      rows={2}
                      className="mt-1.5 w-full resize-none rounded-xl border border-gray-600 bg-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-400 outline-none focus:border-[#EB4D4B] focus:ring-2 focus:ring-[#EB4D4B]/20"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleReject(doc.id)}
                        disabled={isBusy}
                        className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        {isBusy ? "..." : "Confirm Reject"}
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                        className="rounded-lg border border-gray-600 px-3.5 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700"
                      >
                        Cancel
                      </button>
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
