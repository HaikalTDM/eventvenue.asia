"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import type { ApiListing } from "@/lib/api";

/**
 * React Query hooks for the favorites surface. Replaces the legacy
 * `lib/favorites.tsx` context for components that have been migrated to
 * the React Query model. Existing consumers of `useFavorites()` keep
 * working until the rest of the dashboard is migrated; the context shim
 * stays in place so there's a single source of truth at any time.
 *
 * The toggle hook performs an optimistic update via `onMutate`, rolling
 * back on error — the heart-icon UX needs instant feedback to feel right.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type FavoriteListing = ApiListing;

// ─── Query keys ─────────────────────────────────────────────────────────────

export const favoriteKeys = {
  all: ["favorites"] as const,
  list: () => [...favoriteKeys.all, "list"] as const,
  check: (listingId: string) =>
    [...favoriteKeys.all, "check", listingId] as const,
};

// ─── Fetchers ───────────────────────────────────────────────────────────────

async function fetchFavorites(): Promise<FavoriteListing[]> {
  const res = await fetch("/api/v1/favorites", { cache: "no-store" });
  if (!res.ok) throw new Error(`favorites_fetch_failed: ${res.status}`);
  const body = (await res.json()) as { data: FavoriteListing[] };
  return body.data;
}

async function checkIsFavorited(listingId: string): Promise<boolean> {
  const res = await fetch(`/api/v1/favorites/check/${listingId}`, {
    cache: "no-store",
  });
  if (!res.ok) return false;
  const body = (await res.json()) as { isFavorited: boolean };
  return body.isFavorited;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Lists every listing the authenticated customer has favorited. Anonymous
 * callers get a 401 surfaced as an error; gate the hook behind `enabled`
 * if the page allows guest browsing.
 */
export function useFavorites(
  options?: Omit<
    UseQueryOptions<FavoriteListing[], Error, FavoriteListing[], ReturnType<typeof favoriteKeys.list>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: favoriteKeys.list(),
    queryFn: fetchFavorites,
    ...options,
  });
}

/**
 * Returns true/false for a single listing. Used by the heart icon on
 * listing cards and detail pages so the initial render reflects the
 * favorited state without loading the whole list.
 */
export function useIsFavorited(
  listingId: string | null | undefined,
  options?: Omit<
    UseQueryOptions<boolean, Error, boolean, ReturnType<typeof favoriteKeys.check>>,
    "queryKey" | "queryFn" | "enabled"
  > & { enabled?: boolean }
) {
  return useQuery({
    queryKey: favoriteKeys.check(listingId ?? "__missing__"),
    queryFn: () => checkIsFavorited(listingId as string),
    enabled: Boolean(listingId) && options?.enabled !== false,
    ...options,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Toggle favorite for a listing. The route handler is idempotent: re-favoriting
 * is a no-op insert, re-unfavoriting is a no-op delete. Both states are
 * optimistically reflected in the cache before the network round-trip
 * completes; failures roll back automatically.
 */
export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation<
    boolean,
    Error,
    { listingId: string; currentlyFavorited: boolean },
    { previousIds?: boolean; previousList?: FavoriteListing[] }
  >({
    mutationFn: async ({ listingId, currentlyFavorited }) => {
      if (currentlyFavorited) {
        const res = await fetch(
          `/api/v1/favorites?listingId=${encodeURIComponent(listingId)}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error(`unfavorite_failed: ${res.status}`);
        return false;
      }

      const res = await fetch("/api/v1/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (!res.ok) throw new Error(`favorite_failed: ${res.status}`);
      return true;
    },
    onMutate: async ({ listingId, currentlyFavorited }) => {
      // Cancel any in-flight queries so the optimistic update sticks.
      await qc.cancelQueries({ queryKey: favoriteKeys.all });

      const previousIds = qc.getQueryData<boolean>(favoriteKeys.check(listingId));
      const previousList = qc.getQueryData<FavoriteListing[]>(favoriteKeys.list());

      qc.setQueryData<boolean>(favoriteKeys.check(listingId), !currentlyFavorited);

      // We only know the new id; the joined listing row arrives on the
      // server's next /api/v1/favorites refresh. Drop the listing from the
      // list optimistically when unfavoriting; on favoriting, leave the
      // list to refetch and pick up the new row.
      if (currentlyFavorited && previousList) {
        qc.setQueryData<FavoriteListing[]>(
          favoriteKeys.list(),
          previousList.filter((row) => row.id !== listingId)
        );
      }

      return { previousIds, previousList };
    },
    onError: (_err, { listingId }, ctx) => {
      if (ctx?.previousIds !== undefined) {
        qc.setQueryData(favoriteKeys.check(listingId), ctx.previousIds);
      }
      if (ctx?.previousList) {
        qc.setQueryData(favoriteKeys.list(), ctx.previousList);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
}
