"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type PageKey =
  | "home"
  | "browse_venues"
  | "how_it_works"
  | "compare"
  | "list_venue"
  | "inquiries"
  | "favorites"
  | "customer_settings"
  | "messages"
  | "booking_confirmation"
  | "venue_detail"
  | "sign_in"
  | "sign_up"
  | "forgot_password"
  | "vendor_login"
  | "vendor_register"
  | "vendor_dashboard"
  | "vendor_listings"
  | "vendor_inquiries"
  | "vendor_bookings"
  | "vendor_analytics"
  | "vendor_messages"
  | "vendor_settings"
  | "admin";

export type PageConfig = {
  key: PageKey;
  label: string;
  route: string;
  group: "Customer" | "Vendor" | "Auth" | "Admin";
};

export const allPages: PageConfig[] = [
  { key: "home", label: "Homepage", route: "/", group: "Customer" },
  { key: "browse_venues", label: "Browse Venues", route: "/#venues", group: "Customer" },
  { key: "how_it_works", label: "How it Works", route: "/#how-it-works", group: "Customer" },
  { key: "compare", label: "Compare Venues", route: "/compare", group: "Customer" },
  { key: "list_venue", label: "List Your Venue", route: "/list-venue", group: "Customer" },
  { key: "inquiries", label: "My Inquiries", route: "/dashboard/inquiries", group: "Customer" },
  { key: "favorites", label: "Favorites", route: "/dashboard/favorites", group: "Customer" },
  { key: "customer_settings", label: "Customer Settings", route: "/dashboard/settings", group: "Customer" },
  { key: "messages", label: "Messages", route: "/dashboard/messages", group: "Customer" },
  { key: "booking_confirmation", label: "Booking Confirmation", route: "/dashboard/booking-confirmation", group: "Customer" },
  { key: "venue_detail", label: "Venue Detail Pages", route: "/venues/[id]", group: "Customer" },
  { key: "sign_in", label: "Sign In", route: "/sign-in", group: "Auth" },
  { key: "sign_up", label: "Sign Up", route: "/sign-up", group: "Auth" },
  { key: "forgot_password", label: "Forgot Password", route: "/forgot-password", group: "Auth" },
  { key: "vendor_login", label: "Vendor Login", route: "/vendor/login", group: "Vendor" },
  { key: "vendor_register", label: "Vendor Registration", route: "/vendor/register", group: "Vendor" },
  { key: "vendor_dashboard", label: "Vendor Dashboard", route: "/vendor/dashboard", group: "Vendor" },
  { key: "vendor_listings", label: "Vendor Listings", route: "/vendor/listings", group: "Vendor" },
  { key: "vendor_inquiries", label: "Vendor Inquiries", route: "/vendor/inquiries", group: "Vendor" },
  { key: "vendor_bookings", label: "Vendor Bookings", route: "/vendor/bookings", group: "Vendor" },
  { key: "vendor_analytics", label: "Vendor Analytics", route: "/vendor/analytics", group: "Vendor" },
  { key: "vendor_messages", label: "Vendor Messages", route: "/vendor/messages", group: "Vendor" },
  { key: "vendor_settings", label: "Vendor Settings", route: "/vendor/settings", group: "Vendor" },
  { key: "admin", label: "Admin Dashboard", route: "/admin", group: "Admin" },
];

type PageVisibilityContextType = {
  visibility: Record<PageKey, boolean>;
  setPageVisibility: (key: PageKey, visible: boolean) => void;
  setAllVisibility: (visible: boolean) => void;
  isPageVisible: (key: PageKey) => boolean;
};

const STORAGE_KEY = "ev_page_visibility";

const defaultVisibility: Record<PageKey, boolean> = Object.fromEntries(
  allPages.map((p) => [p.key, true])
) as Record<PageKey, boolean>;

const PageVisibilityContext = createContext<PageVisibilityContextType>({
  visibility: defaultVisibility,
  setPageVisibility: () => {},
  setAllVisibility: () => {},
  isPageVisible: () => true,
});

export function PageVisibilityProvider({ children }: { children: ReactNode }) {
  const [visibility, setVisibility] = useState<Record<PageKey, boolean>>(defaultVisibility);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setVisibility({ ...defaultVisibility, ...parsed });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const setPageVisibility = useCallback((key: PageKey, visible: boolean) => {
    setVisibility((prev) => {
      const next = { ...prev, [key]: visible };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setAllVisibility = useCallback((visible: boolean) => {
    setVisibility(() => {
      const next = Object.fromEntries(allPages.map((p) => [p.key, visible])) as Record<PageKey, boolean>;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isPageVisible = useCallback((key: PageKey) => visibility[key] ?? true, [visibility]);

  return (
    <PageVisibilityContext.Provider value={{ visibility, setPageVisibility, setAllVisibility, isPageVisible }}>
      {children}
    </PageVisibilityContext.Provider>
  );
}

export function usePageVisibility() {
  return useContext(PageVisibilityContext);
}
