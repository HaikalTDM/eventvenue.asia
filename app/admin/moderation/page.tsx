"use client";

import { useState } from "react";

type FlaggedItem = {
  id: string;
  type: "review" | "listing" | "message";
  content: string;
  reportedBy: string;
  reason: string;
  target: string;
  reportedAt: string;
  status: "pending" | "removed" | "dismissed";
};

const mockFlagged: FlaggedItem[] = [
  { id: "f-1", type: "review", content: "This place is terrible, worst experience ever. The staff were completely incompetent and rude...", reportedBy: "System (auto-flagged)", reason: "Potentially abusive language", target: "Skyline Rooftop Lounge", reportedAt: "1 hour ago", status: "pending" },
  { id: "f-2", type: "review", content: "SCAM! Don't book here. They took my deposit and cancelled last minute with no refund.", reportedBy: "Aisha Rahman (Vendor)", reason: "False claims / defamation", target: "Grand Ballroom at The Majestic KL", reportedAt: "3 hours ago", status: "pending" },
  { id: "f-3", type: "listing", content: "Venue listing with misleading photos (stock images used instead of actual venue)", reportedBy: "ahmad.razak@company.com", reason: "Misleading content", target: "Paradise Garden Venue", reportedAt: "1 day ago", status: "pending" },
  { id: "f-4", type: "review", content: "Great venue but overpriced for what you get. Food was mediocre at best.", reportedBy: "Hassan Catering (Vendor)", reason: "Competitor review", target: "Heritage Hall JB", reportedAt: "2 days ago", status: "dismissed" },
  { id: "f-5", type: "message", content: "User sending promotional spam messages to multiple vendors", reportedBy: "System (auto-flagged)", reason: "Spam / unsolicited promotion", target: "Multiple vendors", reportedAt: "3 days ago", status: "removed" },
];

export default function AdminModerationPage() {
  const [items, setItems] = useState(mockFlagged);
  const [filter, setFilter] = useState<"all" | "pending" | "removed" | "dismissed">("pending");

  const handleRemove = (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "removed" as const } : i));
  };

  const handleDismiss = (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "dismissed" as const } : i));
  };

  const filtered = items.filter((i) => filter === "all" ? true : i.status === filter);

  const typeColors = {
    review: "bg-amber-500/10 text-amber-400",
    listing: "bg-blue-500/10 text-blue-400",
    message: "bg-purple-500/10 text-purple-400",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
          <p className="mt-1 text-sm text-gray-400">Review flagged content and take action</p>
        </div>
        <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-400">
          {items.filter((i) => i.status === "pending").length} pending review
        </span>
      </div>

      {/* Filters */}
      <div className="mt-6 flex gap-2">
        {(["pending", "removed", "dismissed", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${filter === f ? "bg-[#EB4D4B] text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Flagged Items */}
      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 py-12 text-center">
            <p className="text-sm text-gray-400">No items match this filter.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[item.type]}`}>
                      {item.type}
                    </span>
                    <span className="text-xs text-gray-500">on {item.target}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-200 line-clamp-2">&ldquo;{item.content}&rdquo;</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                    <span>Reported by: {item.reportedBy}</span>
                    <span>Reason: {item.reason}</span>
                    <span>{item.reportedAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.status === "pending" ? (
                    <>
                      <button onClick={() => handleRemove(item.id)} className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500">
                        Remove
                      </button>
                      <button onClick={() => handleDismiss(item.id)} className="rounded-lg border border-gray-600 px-3.5 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700">
                        Dismiss
                      </button>
                    </>
                  ) : (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "removed" ? "bg-red-500/10 text-red-400" : "bg-gray-600 text-gray-300"
                    }`}>
                      {item.status === "removed" ? "Removed" : "Dismissed"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
