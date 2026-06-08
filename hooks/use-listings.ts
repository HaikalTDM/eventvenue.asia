"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import type {
  ApiDetailResponse,
  ApiListingDetail,
  ApiListing,
  ApiListingsResponse,
} from "@/lib/api";

/**
 * React Query hooks for the listings surface. Both the discovery list and
 * the single-venue detail page consume these instead of bespoke
 * `useEffect`/`fetch` plumbing — gives us:
 *
 *   - shared cache between sibling components on the same page
 *   - 60s stale window so back-navigation hits the cache first
 *   - automatic dedupe of in-flight requests
 *   - a single source of error/loading flags per query
 *
 * The hooks call `/api/v1/listings*` directly (the same endpoints the legacy
 * `lib/api.ts` wrapper hits). We keep that wrapper around for the few
 * remaining mock-mode-aware components; new components should import from
 * here instead.
 */

// ─── Query keys ─────────────────────────────────────────────────────────────

/**
 * Stable, hierarchical query keys. The "listings" prefix lets us invalidate
 * everything listings-related in one call (`queryClient.invalidateQueries({
 * queryKey: listingKeys.all })`); deeper specificity is encoded by appending
 * params so distinct filter combinations get distinct caches.
 */
export const listingKeys = {
  all: ["listings"] as const,
  lists: () => [...listingKeys.all, "list"] as const,
  list: (params: ListListingsParams) =>
    [...listingKeys.lists(), params] as const,
  details: () => [...listingKeys.all, "detail"] as const,
  detail: (idOrSlug: string) => [...listingKeys.details(), idOrSlug] as const,
};

// ─── Types ──────────────────────────────────────────────────────────────────

export type ListListingsParams = {
  type?: "venue" | "service";
  state?: string;
  city?: string;
  district?: string;
  search?: string;
  minCapacity?: number;
  maxCapacity?: number;
  minPrice?: number;
  maxPrice?: number;
  halalOnly?: boolean;
  amenityIds?: number[];
  eventTypeIds?: number[];
  sort?: "newest" | "rating" | "price_asc" | "price_desc";
  limit?: number;
  offset?: number;
  /** Vendor's own listings (drafts and paused included). Requires session. */
  mine?: boolean;
};

// ─── Fetchers ───────────────────────────────────────────────────────────────

function paramsToQuery(params: ListListingsParams): string {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      if (v.length > 0) out.set(k, v.join(","));
    } else {
      out.set(k, String(v));
    }
  }
  const qs = out.toString();
  return qs ? `?${qs}` : "";
}

async function fetchListings(params: ListListingsParams): Promise<ApiListingsResponse> {
  const res = await fetch(`/api/v1/listings${paramsToQuery(params)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`listings_fetch_failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<ApiListingsResponse>;
}

async function fetchListingDetail(idOrSlug: string): Promise<ApiListingDetail> {
  const res = await fetch(`/api/v1/listings/${idOrSlug}`, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`listing_detail_fetch_failed: ${res.status} ${text}`);
  }
  const body = (await res.json()) as ApiDetailResponse;
  return body.data;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Discovery list. Returns the paginated rows plus the filter sidebar
 * metadata in the same response shape as the legacy `/api/v1/listings`
 * endpoint. Pass `enabled: false` (via the options arg) to suspend the
 * fetch — useful for the "filters chosen but search not submitted" state.
 */
export function useListings(
  params: ListListingsParams = {},
  options?: Omit<
    UseQueryOptions<ApiListingsResponse, Error, ApiListingsResponse, ReturnType<typeof listingKeys.list>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: listingKeys.list(params),
    queryFn: () => fetchListings(params),
    ...options,
  });
}

/**
 * Single listing by id or slug. The route handler probes the param against
 * a UUID regex and resolves accordingly, so callers can pass either.
 */
export function useListing(
  idOrSlug: string | null | undefined,
  options?: Omit<
    UseQueryOptions<ApiListingDetail, Error, ApiListingDetail, ReturnType<typeof listingKeys.detail>>,
    "queryKey" | "queryFn" | "enabled"
  > & { enabled?: boolean }
) {
  return useQuery({
    queryKey: listingKeys.detail(idOrSlug ?? "__missing__"),
    queryFn: () => fetchListingDetail(idOrSlug as string),
    enabled: Boolean(idOrSlug) && options?.enabled !== false,
    ...options,
  });
}

// Re-export the shared API types so callers don't need a second import.
export type { ApiListing, ApiListingDetail, ApiListingsResponse };
