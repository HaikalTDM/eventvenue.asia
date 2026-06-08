import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/server";

/**
 * GET /api/v1/auth/me
 *
 * Returns the current authenticated user joined with the application profile
 * fields. Used by the client-side `<AuthProvider>` to hydrate on mount and
 * after every Supabase auth state change.
 *
 * Always 200; the body is `{ user: SessionUser | null }`. Front-end treats
 * `null` as "signed out" — this avoids the noisy 401 in the console for the
 * extremely common anonymous case.
 */
export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json(
    { user },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
