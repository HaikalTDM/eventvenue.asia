"use client";

/**
 * COMPATIBILITY SHIM — Phase 2 → Phase 3 transition.
 *
 * The legacy `useVendorAuth()` hook and `<VendorAuthProvider>` are imported
 * from this path by ~7 vendor-portal pages. The new unified provider in
 * `lib/auth/provider.tsx` already handles vendor sessions (role='vendor'),
 * so this file just re-exposes the legacy API on top of it.
 *
 * Phase 3 deletes this file once vendor pages migrate to `useAuth()` directly.
 */

import { useCallback, useMemo, type ReactNode } from "react";

import { useAuth as useNewAuth } from "@/lib/auth/provider";

type LegacyVendor = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "vendor" | "admin";
  phone?: string;
  avatarUrl?: string;
  isVerified: boolean;
  vendorId?: string;
  vendorType?: string;
  vendorName?: string;
  businessDescription?: string | null;
  businessWebsite?: string | null;
  businessLocation?: string | null;
  serviceCategory?: string | null;
  createdAt: string;
};

type LegacyVendorAuthApi = {
  vendor: LegacyVendor | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

/**
 * The new unified `<AuthProvider>` is mounted at the root layout, so vendor
 * pages don't need their own provider wrapper anymore. We export this as a
 * pass-through fragment so legacy `app/vendor/layout.tsx` keeps compiling.
 */
export function VendorAuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useVendorAuth(): LegacyVendorAuthApi {
  const { user, isLoading, signInWithPassword, signOut } = useNewAuth();

  const vendor = useMemo<LegacyVendor | null>(() => {
    if (!user || user.role !== "vendor") return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      isVerified: user.isVerified,
      vendorId: user.vendorId ?? undefined,
      vendorType: user.vendorType ?? undefined,
      vendorName: user.vendorName ?? user.name,
      businessDescription: user.businessDescription,
      businessWebsite: user.businessWebsite,
      businessLocation: user.businessLocation,
      serviceCategory: user.serviceCategory,
      createdAt: "",
    };
  }, [user]);

  const login = useCallback(
    async (email: string, password: string) => {
      const r = await signInWithPassword(email, password);
      if (!r.ok) return false;
      if (r.user?.role !== "vendor") {
        await signOut();
        return false;
      }
      return true;
    },
    [signInWithPassword, signOut]
  );

  return {
    vendor,
    isAuthenticated: !!vendor,
    isLoading,
    login,
    logout: signOut,
  };
}
