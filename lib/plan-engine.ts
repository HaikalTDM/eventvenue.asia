import type {
  Venue,
  Service,
  ServicePackage,
  PlanExtraction,
  ScoredVenue,
  ScoredService,
  MatchReason,
  BudgetGap,
} from "@/lib/types";

function capacityScore(venueCapacity: number, guestMin: number, guestMax: number): number {
  const target = guestMax > 0 ? guestMax : guestMin * 1.1;
  if (venueCapacity < guestMin) return 0;
  if (venueCapacity >= guestMin && venueCapacity <= target) return 1.0;
  const ratio = target / venueCapacity;
  return Math.max(0.3, ratio);
}

function venueScore(
  venue: Venue,
  extraction: PlanExtraction
): { score: number; reasons: MatchReason[] } {
  const reasons: MatchReason[] = [];
  let total = 0;
  let totalWeight = 0;

  if (extraction.guestCount) {
    const capScore = capacityScore(
      venue.capacity,
      extraction.guestCount.min,
      extraction.guestCount.max
    );
    total += capScore * 0.3;
    totalWeight += 0.3;
    if (capScore >= 1.0) {
      reasons.push({
        text: `Capacity (${venue.capacity}) perfectly fits your ${extraction.guestCount.min}-guest requirement`,
        type: "positive",
      });
    } else if (capScore > 0) {
      reasons.push({
        text: `Capacity (${venue.capacity}) meets your ${extraction.guestCount.min}-guest requirement`,
        type: "positive",
      });
    } else {
      reasons.push({
        text: `Capacity (${venue.capacity}) is below your ${extraction.guestCount.min}-guest minimum`,
        type: "warning",
      });
    }
  }

  if (extraction.halalRequired) {
    totalWeight += 0.2;
    if (venue.halalVerified) {
      total += 0.2;
      reasons.push({ text: "JAKIM halal certified", type: "positive" });
    }
  }

  if (extraction.eventType) {
    totalWeight += 0.15;
    if (venue.eventTypes.includes(extraction.eventType)) {
      total += 0.15;
      reasons.push({ text: `Supports ${extraction.eventType} events`, type: "positive" });
    }
  }

  if (extraction.amenities.length > 0) {
    totalWeight += 0.15;
    const matched = extraction.amenities.filter((a) => venue.amenities.includes(a));
    const frac = matched.length / extraction.amenities.length;
    total += frac * 0.15;
    if (frac > 0) {
      reasons.push({
        text: `${matched.length}/${extraction.amenities.length} requested amenities available`,
        type: frac >= 0.6 ? "positive" : "warning",
      });
    }
  }

  if (extraction.location && extraction.location.length > 0) {
    totalWeight += 0.1;
    const venueLoc = venue.location.toLowerCase();
    const reqLoc = extraction.location.toLowerCase();
    if (venueLoc.includes(reqLoc) || reqLoc.includes(venueLoc.split(",")[0].trim())) {
      total += 0.1;
      reasons.push({ text: `Located in ${extraction.location}`, type: "positive" });
    }
  }

  if (extraction.preferredDate) {
    totalWeight += 0.05;
    if (!venue.blockedDates.includes(extraction.preferredDate)) {
      total += 0.05;
      reasons.push({ text: "Available on your preferred date", type: "positive" });
    } else {
      reasons.push({ text: "Not available on your preferred date", type: "warning" });
    }
  }

  const quality = Math.min(1, (venue.rating / 5) * 0.5 + Math.min(venue.reviewCount / 100, 1) * 0.5);
  total += quality * 0.05;
  totalWeight += 0.05;

  const score = totalWeight > 0 ? (total / totalWeight) * 100 : 50;
  return { score, reasons };
}

function serviceScore(
  service: Service,
  extraction: PlanExtraction
): { score: number; reasons: MatchReason[] } {
  const reasons: MatchReason[] = [];
  let total = 0;
  let totalWeight = 0;

  totalWeight += 0.35;
  total += 0.35;
  reasons.push({ text: `Matches requested ${service.category.replace(/_/g, " ")} service`, type: "positive" });

  if (extraction.halalRequired) {
    totalWeight += 0.25;
    if (service.halalCertified) {
      total += 0.25;
      reasons.push({ text: "Halal certified provider", type: "positive" });
    } else {
      reasons.push({ text: "Not halal certified", type: "warning" });
    }
  }

  if (extraction.guestCount) {
    totalWeight += 0.2;
    const maxPkgGuests = Math.max(...service.packages.map(() => extraction.guestCount?.max || extraction.guestCount?.min || 50));
    const supportsCapacity = service.packages.some(() => true);
    total += supportsCapacity ? 0.2 : 0;
  }

  const quality = Math.min(1, (service.rating / 5) * 0.5 + Math.min(service.reviewCount / 100, 1) * 0.5);
  total += quality * 0.1;
  totalWeight += 0.1;

  if (extraction.location && extraction.location.length > 0) {
    totalWeight += 0.1;
    const sLoc = service.location.toLowerCase();
    const rLoc = extraction.location.toLowerCase();
    if (sLoc.includes(rLoc) || rLoc.includes(sLoc.split(",")[0].trim())) {
      total += 0.1;
      reasons.push({ text: `Serves ${extraction.location}`, type: "positive" });
    }
  }

  const score = totalWeight > 0 ? (total / totalWeight) * 100 : 50;
  return { score, reasons };
}

function selectBestPackage(
  service: Service,
  extraction: PlanExtraction,
  remainingBudget: number | null
): ServicePackage | null {
  if (service.packages.length === 0) return null;

  const sorted = [...service.packages].sort((a, b) => a.price - b.price);

  if (remainingBudget === null || remainingBudget <= 0) return sorted[0];

  const affordable = sorted.filter((p) => p.price <= remainingBudget);
  if (affordable.length > 0) return affordable[affordable.length - 1];

  return sorted[0];
}

function estimateVenueCost(venue: Venue): number {
  return Math.round(venue.pricePerHour * 6 * 1.1);
}

function generateWarnings(
  venues: ScoredVenue[],
  serviceRecs: Record<string, ScoredService[]>
): string[] {
  const warnings: string[] = [];

  if (venues.length === 0) {
    warnings.push("No venues match your requirements. Try expanding your guest count or location.");
  }

  const emptyServiceCategories = Object.entries(serviceRecs).filter(
    ([, services]) => services.length === 0
  );

  for (const [cat] of emptyServiceCategories) {
    warnings.push(`No ${cat.replace(/_/g, " ")} providers found. Try expanding your location.`);
  }

  return warnings;
}

function findBudgetGaps(
  totalEstimate: number,
  budget: { amount: number; currency: string }
): BudgetGap[] {
  if (totalEstimate <= budget.amount) return [];
  return [
    {
      itemType: "venue",
      itemName: "Total Plan",
      estimatedCost: totalEstimate,
      remainingBudget: budget.amount - totalEstimate,
    },
  ];
}

function normalizeLocation(location: string | null): string | null {
  if (!location) return null;
  return location;
}

export function generatePlan(
  extraction: PlanExtraction,
  venues: Venue[],
  services: Service[]
): {
  totalEstimate: number;
  currency: string;
  budgetUtilization: number | null;
  venues: ScoredVenue[];
  serviceRecommendations: Record<string, ScoredService[]>;
  warnings: string[];
  budgetGaps: BudgetGap[];
} {
  const normLocation = normalizeLocation(extraction.location);
  const effectiveLocation = normLocation || "";

  let candidateVenues = venues.filter((v) => {
    if (effectiveLocation && !v.location.toLowerCase().includes(effectiveLocation.toLowerCase().split(",")[0])) {
      return false;
    }
    if (extraction.guestCount && v.capacity < extraction.guestCount.min) {
      return false;
    }
    if (extraction.halalRequired && !v.halalVerified) {
      return false;
    }
    if (extraction.eventType && !v.eventTypes.includes(extraction.eventType)) {
      return false;
    }
    if (extraction.preferredDate && v.blockedDates.includes(extraction.preferredDate)) {
      return false;
    }
    return true;
  });

  if (candidateVenues.length === 0) {
    candidateVenues = venues.filter((v) => {
      if (extraction.guestCount && v.capacity < extraction.guestCount.min - 50) {
        return false;
      }
      if (extraction.halalRequired && !v.halalVerified) {
        return false;
      }
      if (extraction.preferredDate && v.blockedDates.includes(extraction.preferredDate)) {
        return false;
      }
      return true;
    });
  }

  if (candidateVenues.length === 0) {
    candidateVenues = [...venues].filter(
      (v) => !extraction.halalRequired || v.halalVerified
    );
  }

  const scoredVenues: ScoredVenue[] = candidateVenues
    .map((v) => {
      const { score, reasons } = venueScore(v, extraction);
      return {
        venue: v,
        score,
        matchReasons: reasons,
        estimatedCost: estimateVenueCost(v),
        isBestMatch: false,
      };
    })
    .sort((a, b) => b.score - a.score);

  if (scoredVenues.length > 0) {
    scoredVenues[0].isBestMatch = true;
  }

  const serviceRecs: Record<string, ScoredService[]> = {};

  for (const cat of extraction.services) {
    let candidates = services.filter((s) => s.category === cat);

    if (candidates.length === 0) {
      serviceRecs[cat] = [];
      continue;
    }

    if (effectiveLocation) {
      const locFiltered = candidates.filter((s) =>
        s.location.toLowerCase().includes(effectiveLocation.toLowerCase().split(",")[0])
      );
      if (locFiltered.length > 0) {
        candidates = locFiltered;
      }
    }

    if (extraction.eventType) {
      const typeFiltered = candidates.filter((s) => s.eventTypes.includes(extraction.eventType!));
      if (typeFiltered.length > 0) {
        candidates = typeFiltered;
      }
    }

    if (extraction.halalRequired) {
      const halalFiltered = candidates.filter((s) => s.halalCertified);
      if (halalFiltered.length > 0) {
        candidates = halalFiltered;
      } else if (candidates.length === 0) {
        candidates = services.filter((s) => s.category === cat);
      }
    }

    serviceRecs[cat] = candidates
      .map((s) => {
        const { score, reasons } = serviceScore(s, extraction);
        return {
          service: s,
          package: selectBestPackage(s, extraction, extraction.budget?.amount ?? null),
          score,
          matchReasons: reasons,
          estimatedCost:
            selectBestPackage(s, extraction, extraction.budget?.amount ?? null)?.price ?? 0,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  const topVenueCost = scoredVenues.length > 0 ? scoredVenues[0].estimatedCost : 0;
  let serviceTotal = 0;
  for (const sr of Object.values(serviceRecs)) {
    if (sr.length > 0) {
      serviceTotal += sr[0].estimatedCost;
    }
  }
  const totalEstimate = topVenueCost + serviceTotal;
  const currency = extraction.budget?.currency ?? (scoredVenues.length > 0 ? scoredVenues[0].venue.currency : "RM");
  const budgetUtilization = extraction.budget ? (totalEstimate / extraction.budget.amount) * 100 : null;

  const warnings = generateWarnings(scoredVenues, serviceRecs);
  const budgetGaps = extraction.budget
    ? findBudgetGaps(totalEstimate, extraction.budget)
    : [];

  return {
    totalEstimate,
    currency,
    budgetUtilization,
    venues: scoredVenues.slice(0, 5),
    serviceRecommendations: serviceRecs,
    warnings,
    budgetGaps,
  };
}
