"use client";

import { useState, useMemo, useCallback } from "react";
import type { PlanResponse } from "@/lib/types";
import PlanExtractionChips from "@/components/PlanExtractionChips";
import BudgetSummaryBar from "@/components/BudgetSummaryBar";
import VenueRecommendationCard from "@/components/VenueRecommendationCard";
import ServiceRecommendationCard from "@/components/ServiceRecommendationCard";

interface PlanResultsProps {
  data: PlanResponse;
}

const SERVICE_LABELS: Record<string, string> = {
  catering: "Catering",
  photography: "Photography",
  videography: "Videography",
  dj_entertainment: "DJ & Entertainment",
  decoration: "Decoration",
  makeup: "Makeup & Styling",
  planning: "Event Planning",
};

export default function PlanResults({ data }: PlanResultsProps) {
  const { extraction, plan } = data;

  const [selectedVenueIds, setSelectedVenueIds] = useState<Set<string>>(new Set());
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [contactSent, setContactSent] = useState(false);

  const selectedCount = selectedVenueIds.size + selectedServiceIds.size;

  const allRecommendationIds = useMemo(() => {
    const ids: { venueIds: string[]; serviceIds: string[] } = { venueIds: [], serviceIds: [] };
    ids.venueIds = plan.venues.map((sv) => sv.venue.id);
    Object.values(plan.serviceRecommendations).forEach((scored) => {
      scored.slice(0, 2).forEach((s) => {
        if (s.service) ids.serviceIds.push(s.service.id);
      });
    });
    return ids;
  }, [plan]);

  const totalSelectable = allRecommendationIds.venueIds.length + allRecommendationIds.serviceIds.length;

  const handleToggleVenue = useCallback((venueId: string) => {
    setSelectedVenueIds((prev) => {
      const next = new Set(prev);
      if (next.has(venueId)) {
        next.delete(venueId);
      } else {
        next.add(venueId);
      }
      return next;
    });
  }, []);

  const handleToggleService = useCallback((serviceId: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = () => {
    if (selectedCount === totalSelectable) {
      setSelectedVenueIds(new Set());
      setSelectedServiceIds(new Set());
    } else {
      setSelectedVenueIds(new Set(allRecommendationIds.venueIds));
      setSelectedServiceIds(new Set(allRecommendationIds.serviceIds));
    }
  };

  const handleContactSelected = () => {
    if (selectedCount === 0) return;
    setContactSent(true);
    setTimeout(() => setContactSent(false), 3000);
  };

  const topVenue = plan.venues[0];

  const serviceBreakdown = Object.entries(plan.serviceRecommendations)
    .map(([cat, scored]) => ({
      category: cat,
      cost: scored.length > 0 ? scored[0].estimatedCost : 0,
    }))
    .filter((s) => s.cost > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PlanExtractionChips extraction={extraction} />

      {plan.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm font-semibold text-amber-700">Notes</span>
          </div>
          <ul className="space-y-1">
            {plan.warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-600">{w}</li>
            ))}
          </ul>
        </div>
      )}

      <BudgetSummaryBar
        totalEstimate={plan.totalEstimate}
        currency={plan.currency}
        budgetUtilization={plan.budgetUtilization}
        venueCost={topVenue ? topVenue.estimatedCost : 0}
        serviceBreakdown={serviceBreakdown}
      />

      {plan.budgetGaps.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm font-semibold text-red-700">Over Budget</span>
          </div>
          <p className="text-xs text-red-600">
            Your plan exceeds your budget by{" "}
            {plan.currency} {Math.abs(plan.budgetGaps[0]?.remainingBudget ?? 0).toLocaleString()}.
            Consider selecting smaller packages or expanding your budget.
          </p>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Recommended Venues ({plan.venues.length})
          </h2>
        </div>
        <div className="space-y-4">
          {plan.venues.map((sv) => (
            <VenueRecommendationCard
              key={sv.venue.id}
              scoredVenue={sv}
              isSelected={selectedVenueIds.has(sv.venue.id)}
              onToggleSelect={handleToggleVenue}
            />
          ))}
        </div>
      </section>

      {Object.keys(plan.serviceRecommendations).length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Recommended Services
          </h2>
          <div className="space-y-4">
            {Object.entries(plan.serviceRecommendations).map(([category, scored]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500">
                  {SERVICE_LABELS[category] || category}
                </h3>
                {scored.length > 0 ? (
                  scored.slice(0, 2).map((s) => (
                    <ServiceRecommendationCard
                      key={s.service.id}
                      scoredService={s}
                      isSelected={selectedServiceIds.has(s.service.id)}
                      onToggleSelect={handleToggleService}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No matching providers found</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col items-center gap-3 pb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 underline"
          >
            {selectedCount === totalSelectable && totalSelectable > 0 ? "Deselect All" : `Select All (${totalSelectable})`}
          </button>
        </div>
        <button
          type="button"
          onClick={handleContactSelected}
          disabled={selectedCount === 0 || contactSent}
          className={`rounded-xl px-6 py-3 text-sm font-bold shadow-md transition-all ${
            contactSent
              ? "bg-emerald-500 text-white shadow-emerald-500/25"
              : selectedCount > 0
              ? "bg-[#EB4D4B] text-white shadow-[#EB4D4B]/25 hover:bg-[#dc2626] hover:shadow-lg"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {contactSent
            ? "Inquiries Sent!"
            : selectedCount > 0
            ? `Contact Selected (${selectedCount})`
            : "Select venues & services above"}
        </button>
        {selectedCount === 0 && !contactSent && (
          <p className="text-xs text-gray-400">
            Click any venue or service card to select it, then send inquiries only to those providers.
          </p>
        )}
      </div>
    </div>
  );
}
