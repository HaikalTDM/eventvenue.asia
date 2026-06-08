"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/auth/client";

/**
 * Unified auth context. Replaces the legacy `lib/auth.tsx` (customer) and
 * `lib/vendor-auth.tsx` (vendor) providers with a single source of truth backed
 * by Supabase Auth. The `role` field on the user determines whether the
 * customer dashboard, vendor portal, or admin panel is accessible.
 *
 * The provider hydrates from `/api/v1/auth/me`, which reads the cookie session
 * server-side and returns the joined `users` + `vendor_profiles` profile. This
 * keeps all profile derivation logic in one place (`lib/auth/server.ts`).
 */

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: "customer" | "vendor" | "admin";
  isVerified: boolean;
  vendorId: string | null;
  vendorType: "venue_owner" | "service_provider" | null;
  vendorName: string | null;
  businessDescription: string | null;
  businessWebsite: string | null;
  businessLocation: string | null;
  serviceCategory: string | null;
};

type AuthContextValue = {
  user: SessionUser | null;
  isLoading: boolean;
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<{ ok: true; user: SessionUser | null } | { ok: false; error: string }>;
  signUp: (input: SignUpInput) => Promise<{ ok: true; needsVerification: boolean } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

type SignUpInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: "customer" | "vendor";
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchSession(): Promise<SessionUser | null> {
  try {
    const res = await fetch(`/api/v1/auth/me?_=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { user: SessionUser | null };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const refresh = useCallback(async () => {
    const next = await fetchSession();
    setUser(next);
  }, []);

  useEffect(() => {
    let active = true;
    void refresh().finally(() => {
      if (active) setIsLoading(false);
    });

    // Re-hydrate the joined profile whenever the underlying Supabase session
    // changes (sign-in, sign-out, token refresh, OAuth callback).
    const { data } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [refresh, supabase]);

  const signInWithPassword = useCallback<AuthContextValue["signInWithPassword"]>(
    async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };
      // Hydrate the joined profile and return it to the caller so consumers
      // can route based on role without a second /api/v1/auth/me round-trip.
      const next = await fetchSession();
      setUser(next);
      return { ok: true, user: next };
    },
    [supabase]
  );

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async ({ name, email, password, phone, role = "customer" }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Surface the metadata to the auth.users → public.users trigger.
          data: { name, phone: phone ?? null, role },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) return { ok: false, error: error.message };

      const needsVerification = !data.session;
      if (!needsVerification) await refresh();
      return { ok: true, needsVerification };
    },
    [refresh, supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }, [router, supabase]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, signInWithPassword, signUp, signOut, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
