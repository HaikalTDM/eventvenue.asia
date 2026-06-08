"use client";

import { useState } from "react";

import { useAdminFlags, useResolveFlag, type ApiFlag } from "@/hooks/use-admin";

type FlagType = "review" | "listing" | "message";

const typeColors: Record<FlagType, string> = {
  review: "bg-amber-500/10 text-amber-400",
  listing: "bg-blue-500/10 text-blue-400",
  message: "bg-purple-500/10 text-purple-400",
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

export default function AdminModerationPage() {
  const [filter, setFilter] = useState<"pending" | "resolved" | "all">("pending");

  const { data: items = [], isLoading: loading, error } = useAdminFlags(filter);
  const resolve = useResolveFlag();

  const handleAction = (flagId: string, action: "resolve" | "dismiss") => {
    resolve.mutate({ flagId, action });
  };

  const busyId = resolve.isPending ? resolve.variables?.flagId ?? null : null;
  const errorMessage = error?.message ?? null;

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
          <p className="mt-1 text-sm text-gray-400">
            Review flagged content and take action
          </p>
        </div>
        <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-400">
          {pendingCount} pending review
        </span>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 flex gap-2">
        {(["pending", "resolved", "all"] as const).map((f) => (
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
            Loading flagged content...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 py-12 text-center">
            <p className="text-sm text-gray-400">No items match this filter.</p>
          </div>
        ) : (
          items.map((item) => {
            const isBusy = busyId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-700 bg-gray-800 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[item.type]}`}
                      >
                        {item.type}
                      </span>
                      {item.targetTitle && (
                        <span className="text-xs text-gray-500">
                          on {item.targetTitle}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-200 line-clamp-2">
                      &ldquo;{item.targetPreview}&rdquo;
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                      <span>Reported by: {item.flaggedBy.name}</span>
                      <span>Reason: {item.flagReason}</span>
                      <span>{relativeTime(item.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleAction(item.id, "resolve")}
                          disabled={isBusy}
                          className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                        >
                          {isBusy ? "..." : "Remove"}
                        </button>
                        <button
                          onClick={() => handleAction(item.id, "dismiss")}
                          disabled={isBusy}
                          className="rounded-lg border border-gray-600 px-3.5 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                        >
                          Dismiss
                        </button>
                      </>
                    ) : (
                      <span className="rounded-full bg-gray-600 px-3 py-1 text-xs font-semibold text-gray-300">
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
