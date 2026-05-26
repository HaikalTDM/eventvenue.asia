"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import StickyNav from "@/components/StickyNav";
import HeroSearch from "@/components/HeroSearch";
import AIPlannerInput from "@/components/AIPlannerInput";
import PlanLoading from "@/components/PlanLoading";
import PlanResults from "@/components/PlanResults";
import VenueGridWithFilters from "@/components/VenueGridWithFilters";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import type { SearchState, PlanResponse } from "@/lib/types";

const defaultSearchState: SearchState = {
  location: "",
  eventDate: "",
  guestCapacity: 0,
  halalOnly: false,
};

type PlannerTab = "filters" | "ai";

export default function HomePage() {
  const { user, signIn, signOut } = useAuth();
  const [search, setSearch] = useState<SearchState>(defaultSearchState);
  const [activeTab, setActiveTab] = useState<PlannerTab>("filters");
  const [isLoading, setIsLoading] = useState(false);
  const [planResult, setPlanResult] = useState<PlanResponse | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const handlePlanRequest = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setPlanResult(null);
    setPlanError(null);
    setLoadingStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step = Math.min(step + 1, 3);
      setLoadingStep(step);
    }, 600);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        let apiError = "Failed to generate plan";
        try {
          const errBody = await res.json();
          apiError = errBody.error || apiError;
        } catch { /* ignore parse failure */ }
        throw new Error(apiError);
      }

      const data: PlanResponse = await res.json();
      clearInterval(interval);
      setLoadingStep(3);
      setTimeout(() => {
        setIsLoading(false);
        setPlanResult(data);
      }, 400);
    } catch (err) {
      clearInterval(interval);
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setPlanError(`${msg}. Please try again or use the manual search filters below.`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <StickyNav />
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom flex items-center justify-end py-2">
          <button
            type="button"
            onClick={() => {
              if (user) {
                signOut();
              } else {
                signIn("sarah@email.com", "Sarah Lim");
              }
            }}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              user
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-gray-100 text-gray-500 border border-gray-200"
            }`}
          >
            <span className="font-mono text-[10px]">🔬</span>
            Auth Test: {user ? "Signed In" : "Signed Out"}
            {user && <span className="text-blue-400">({user.name})</span>}
          </button>
        </div>
      </div>
      <main>
        {activeTab === "filters" ? (
          <>
            <div className="bg-white pt-10">
              <div className="container-custom">
                <div className="mx-auto flex justify-center">
                  <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setActiveTab("filters")}
                      className="rounded-lg bg-[#EB4D4B] px-5 py-2 text-sm font-semibold text-white shadow-sm"
                    >
                      Search Filters
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("ai");
                        setPlanResult(null);
                        setPlanError(null);
                      }}
                      className="rounded-lg px-5 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-all"
                    >
                      EventVenue Smart Planner
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <HeroSearch search={search} onSearchChange={setSearch} />
          </>
        ) : (
          <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 pb-16 pt-10 lg:pb-24">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#EB4D4B] opacity-5 blur-3xl" />
              <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-[#EB4D4B] opacity-5 blur-3xl" />
            </div>
            <div className="container-custom relative">
              <div className="mx-auto flex justify-center">
                <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("filters");
                      setPlanResult(null);
                      setPlanError(null);
                    }}
                    className="rounded-lg px-5 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-all"
                  >
                    Search Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("ai")}
                    className="rounded-lg bg-[#EB4D4B] px-5 py-2 text-sm font-semibold text-white shadow-sm"
                  >
                    EventVenue Smart Planner
                  </button>
                </div>
              </div>
              <div className="mx-auto mt-10 max-w-3xl text-center">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                  Find & Book Premium Event Venues in{" "}
                  <span className="text-[#EB4D4B]">Southeast Asia</span>
                </h1>
                <p className="mt-4 text-base text-gray-500 sm:text-lg">
                  Discover verified, high-quality spaces for weddings, corporate
                  gatherings, and private celebrations across the region.
                </p>
              </div>
              <div className="mx-auto mt-10 max-w-3xl relative">
                <AIPlannerInput onSubmit={handlePlanRequest} isLoading={isLoading} />

                {!user && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-2xl backdrop-blur-lg bg-white/60" />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EB4D4B]/10">
                        <svg className="h-7 w-7 text-[#EB4D4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Sign In Required</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        The EventVenue Smart Planner is available to registered users. Sign in to start planning your event.
                      </p>
                      <button
                        type="button"
                        onClick={() => signIn("sarah@email.com", "Sarah Lim")}
                        className="mt-5 w-full rounded-xl bg-[#EB4D4B] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#EB4D4B]/25 transition-all hover:bg-[#dc2626] hover:shadow-lg"
                      >
                        Sign In to Continue
                      </button>
                      <p className="mt-3 text-xs text-gray-400">
                        Demo account will be auto-filled
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {isLoading && <PlanLoading currentStep={loadingStep} />}

        {planError && (
          <div className="mx-auto mt-6 max-w-3xl">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-sm text-red-600">{planError}</p>
              <button
                type="button"
                onClick={() => setPlanError(null)}
                className="mt-2 text-sm font-semibold text-red-700 hover:text-red-800 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {planResult && !isLoading && (
          <div className="mt-6">
            <PlanResults data={planResult} />
          </div>
        )}

        <VenueGridWithFilters search={search} />

        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
