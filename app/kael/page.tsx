"use client";

import { usePageVisibility, allPages, type PageKey } from "@/lib/page-visibility";
import Link from "next/link";

export default function KaelControlPanel() {
  const { visibility, setPageVisibility, setAllVisibility } = usePageVisibility();
  // The data-mode toggle is no longer relevant — Phase 1 made the data
  // layer real, so the app always reads from the live database.
  const mode: "live" = "live";

  const groups = ["Customer", "Vendor", "Auth", "Admin"] as const;

  const visibleCount = Object.values(visibility).filter(Boolean).length;
  const totalCount = allPages.length;

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-800 px-4 py-1.5 text-xs font-medium text-gray-400">
            <span className={`h-2 w-2 rounded-full ${mode === "live" ? "bg-green-400" : "bg-amber-400"} animate-pulse`} />
            Demo Control Panel
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white">Page Visibility</h1>
          <p className="mt-2 text-sm text-gray-400">
            Toggle pages on/off to control what&apos;s visible during demonstrations.
            <br />
            <span className="text-gray-500">{visibleCount}/{totalCount} pages visible</span>
          </p>
        </div>

        {/* Data Mode Toggle (deprecated — Phase 1 removed mock mode) */}
        <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Data Source</h3>
              <p className="mt-1 text-xs text-gray-400">
                Connected to live API &amp; Supabase database
              </p>
            </div>
            <span
              className={`rounded-lg border border-gray-700 px-4 py-2 text-xs font-semibold ${
                mode === "live" ? "bg-green-700 text-white" : "bg-gray-800 text-gray-400"
              }`}
            >
              Live
            </span>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            The mock-data toggle was removed in Phase 1. The app now always reads from the live Supabase database.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => setAllVisibility(true)}
            className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-500"
          >
            Show All
          </button>
          <button
            onClick={() => setAllVisibility(false)}
            className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            Hide All
          </button>
          <Link
            href="/"
            className="rounded-xl border border-gray-700 px-5 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
          >
            View Site →
          </Link>
        </div>

        {/* Page Groups */}
        <div className="mt-10 space-y-6">
          {groups.map((group) => {
            const pages = allPages.filter((p) => p.group === group);
            const groupVisible = pages.every((p) => visibility[p.key]);
            const groupPartial = pages.some((p) => visibility[p.key]) && !groupVisible;

            return (
              <div key={group} className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
                {/* Group Header */}
                <div className="flex items-center justify-between border-b border-gray-800 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold text-white">{group}</h2>
                    <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                      {pages.filter((p) => visibility[p.key]).length}/{pages.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const newState = !groupVisible;
                      pages.forEach((p) => setPageVisibility(p.key, newState));
                    }}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      groupVisible ? "bg-green-500" : groupPartial ? "bg-amber-500" : "bg-gray-600"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      groupVisible ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>

                {/* Page Items */}
                <div className="divide-y divide-gray-800/50">
                  {pages.map((page) => (
                    <div key={page.key} className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/30">
                      <div>
                        <p className="text-sm font-medium text-gray-200">{page.label}</p>
                        <p className="text-xs text-gray-500">{page.route}</p>
                      </div>
                      <button
                        onClick={() => setPageVisibility(page.key as PageKey, !visibility[page.key])}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          visibility[page.key] ? "bg-green-500" : "bg-gray-600"
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          visibility[page.key] ? "translate-x-5" : ""
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-600">
          This page is hidden from navigation. Access it directly at <code className="text-gray-400">/kael</code>
        </p>
      </div>
    </div>
  );
}
