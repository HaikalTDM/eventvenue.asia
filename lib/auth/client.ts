"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Singleton Supabase browser client. Used by:
 *   - the AuthProvider for `signInWithPassword`, `signUp`, `signOut`,
 *     `signInWithOAuth`, `resetPasswordForEmail`, etc.
 *   - any client component that needs to subscribe to auth state changes
 *     (`onAuthStateChange`) or read the user via `auth.getUser()`.
 *
 * The cookie-based session is shared with `lib/auth/server.ts` through the
 * `@supabase/ssr` package, so the same user is visible on both sides.
 */
let cached: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (cached) return cached;

  cached = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return cached;
}
