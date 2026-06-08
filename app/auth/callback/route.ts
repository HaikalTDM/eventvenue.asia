import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/auth/server";

/**
 * GET /auth/callback?code=...&next=/some/path
 *
 * Supabase redirects here after:
 *   - Email confirmation (signup verify link)
 *   - Magic link sign-in
 *   - Password recovery
 *   - OAuth provider redirect (Google, etc.)
 *
 * The `code` is exchanged for a session cookie via `exchangeCodeForSession`.
 * On success the user is redirected to `next` (or `/` if absent). On failure
 * we send them to the sign-in page with an error flag.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(error.message)}`
    );
  }

  // Redirect to a same-origin path only. Reject protocol-relative URLs
  // (`//evil.com`) and absolute URLs — both would bounce the user to an
  // attacker-controlled domain after sign-in. The regex requires a single
  // leading slash followed by a non-slash character.
  const safeNext = /^\/[^/]/.test(next) ? next : "/";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
