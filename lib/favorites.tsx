"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth";
import {
  getFavorites as apiGetFavorites,
  addFavorite as apiAddFavorite,
  removeFavorite as apiRemoveFavorite,
} from "@/lib/api";
import type { Venue } from "@/lib/types";

type FavoritesContextType = {
  favoriteIds: string[];
  favorites: Venue[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  isLoading: boolean;
};

const FavoritesContext = createContext<FavoritesContextType>({
  favoriteIds: [],
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
  isLoading: false,
});

interface ApiFavoriteRow {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  capacity: number | null;
  pricePerHour: string | null;
  currency: string;
  halalCertified: boolean;
  averageRating: string;
  reviewCount: number;
}

function apiToVenue(row: ApiFavoriteRow): Venue {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    location: row.location ?? "",
    pricePerHour: row.pricePerHour ? Number(row.pricePerHour) : 0,
    currency: row.currency,
    capacity: row.capacity ?? 0,
    rating: Number(row.averageRating) || 0,
    reviewCount: row.reviewCount,
    halalVerified: row.halalCertified,
    thumbnailUrl: "",
    galleryUrls: [],
    eventTypes: [],
    amenities: [],
    description: "",
    hostName: "",
    hostResponseRate: 0,
    hostResponseTime: "",
    reviews: [],
    faqs: [],
    coordinates: { lat: 0, lng: 0 },
    address: "",
    blockedDates: [],
  };
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Venue[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setFavoriteIds([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiGetFavorites();
      const rows = (res.data ?? []) as unknown as ApiFavoriteRow[];
      setFavorites(rows.map(apiToVenue));
      setFavoriteIds(rows.map((r) => r.id));
    } catch {
      // Network or auth error: leave state as-is.
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFavorite = useCallback(
    (id: string) => favoriteIds.includes(id),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      if (!user) return;
      const current = favoriteIds.includes(id);
      // Optimistic update.
      setFavoriteIds((prev) =>
        current ? prev.filter((fid) => fid !== id) : [...prev, id]
      );
      try {
        if (current) {
          await apiRemoveFavorite(id);
          setFavorites((prev) => prev.filter((v) => v.id !== id));
        } else {
          await apiAddFavorite(id);
          // Re-fetch to pick up the joined listing data.
          await refresh();
        }
      } catch {
        // Rollback on error.
        setFavoriteIds((prev) =>
          current ? [...prev, id] : prev.filter((fid) => fid !== id)
        );
      }
    },
    [user, favoriteIds, refresh]
  );

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, favorites, isFavorite, toggleFavorite, isLoading }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
