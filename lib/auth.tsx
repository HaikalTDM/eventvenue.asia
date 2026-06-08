"use client";

/**
 * COMPATIBILITY SHIM — Phase 2 → Phase 3 transition.
 *
 * The legacy `useAuth()` hook and `<AuthProvider>` are imported from this path
 * by ~10 components. Phase 2 introduces a new Supabase-backed provider at
 * `lib/auth/provider.tsx`, but rewriting every consumer is Phase 3 work.
 *
 * This file re-exports the new provider with the legacy method shape
 * (`signIn`, `signUp`, `signOut`, `updateProfile`) so existing components
 * compile and behave correctly without changes. Phase 3 deletes this file
 * once every import is migrated to `@/lib/auth/provider`.
 */

import { useCallback, useMemo } from "react";

import {
  AuthProvider as NewAuthProvider,
  useAuth as useNewAuth,
} from "@/lib/auth/provider";
import { getSupabaseBrowserClient } from "@/lib/auth/client";

export const AuthProvider = NewAuthProvider;

type LegacyUser = {
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
  createdAt: string;
};

type LegacyAuthApi = {
  user: LegacyUser | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (
    updates: Partial<Pick<LegacyUser, "name" | "phone" | "avatarUrl">>
  ) => void;
  isLoading: boolean;
};

export function useAuth(): LegacyAuthApi {
  const { user, isLoading, signInWithPassword, signUp, signOut, refresh } =
    useNewAuth();
  const supabase = getSupabaseBrowserClient();

  const legacyUser = useMemo<LegacyUser | null>(() => {
    if (!user) return null;
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
      // createdAt is not surfaced by the new session payload; legacy callers
      // only use it for display and are tolerant of an empty string.
      createdAt: "",
    };
  }, [user]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const r = await signInWithPassword(email, password);
      return r.ok;
    },
    [signInWithPassword]
  );

  const legacySignUp = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      const r = await signUp({ name, email, password, phone });
      return r.ok;
    },
    [signUp]
  );

  const updateProfile = useCallback<LegacyAuthApi["updateProfile"]>(
    (updates) => {
      // Persist to public.users via the dedicated profile endpoint, not to
      // auth.users.user_metadata. The new SessionUser is read from public.users
      // (joined in lib/auth/server.ts), so writing only to user_metadata would
      // make profile edits silently disappear after a refresh.
      void fetch("/api/v1/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updates.name,
          phone: updates.phone,
          avatarUrl: updates.avatarUrl,
        }),
      })
        .then(() => refresh())
        .catch(() => {
          // Best-effort; legacy callers were synchronous and didn't surface
          // failures. Phase 3 replaces this with a proper server action.
        });
    },
    [refresh]
  );

  return {
    user: legacyUser,
    signIn,
    signUp: legacySignUp,
    signOut,
    updateProfile,
    isLoading,
  };
}
