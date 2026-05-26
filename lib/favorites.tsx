"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { mockVenues } from "@/lib/mock-data";
import type { Venue } from "@/lib/types";

type FavoritesContextType = {
  favoriteIds: string[];
  favorites: Venue[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
};

const FavoritesContext = createContext<FavoritesContextType>({
  favoriteIds: [],
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
});

const STORAGE_KEY = "ev_mock_favorites";
const DEFAULT_IDS = ["venue-001", "venue-003"];

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(DEFAULT_IDS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setFavoriteIds(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
    }
  }, [favoriteIds, mounted]);

  const effectiveIds = mounted ? favoriteIds : DEFAULT_IDS;
  const favorites: Venue[] = mockVenues.filter((v) => effectiveIds.includes(v.id));

  const isFavorite = useCallback(
    (id: string) => effectiveIds.includes(id),
    [effectiveIds]
  );

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  }, []);

  return (
    <FavoritesContext.Provider value={{ favoriteIds: effectiveIds, favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
