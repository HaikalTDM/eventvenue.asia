import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type AppRole = "customer" | "vendor" | "admin";

const ROLE_SIGN_IN: Record<AppRole, string> = {
  customer: "/sign-in",
  vendor: "/vendor/login",
  admin: "/admin/login",
};

/**
 * Root middleware. Runs before every request that matches the `config.matcher`
 * below. Three responsibilities:
 *
 * 1. Refresh the Supabase auth session by calling `supabase.auth.getUser()`.
 *    @supabase/ssr writes the rotated cookies onto the outgoing response,
 *    so the browser stays signed in across page transitions.
 *
 * 2. Unauthenticated gating. Pages under `/admin`, `/vendor`, and `/dashboard`
 *    redirect to the appropriate sign-in page when there is no session.
 *
 * 3. Role-aware gating. When a session exists and the JWT carries
 *    `app_metadata.role` (set by the `public.custom_access_token_hook`),
 *    supported pages redirect wrong-role users to their own sign-in so they
 *    never hit a 403 from a route handler. Falls back to no-op when the hook
 *    is not yet configured.
 *
 * Notes:
 * - Sign-in / sign-up / register pages remain public regardless of role so
 *   users can swap accounts or sign in under a different role.
 * - The matcher excludes static assets and Next internals to avoid running
 *   the auth round-trip on every image / font / chunk request.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /**
   * `getUser()` may have rotated the Supabase access/refresh tokens and
   * written the new values onto `response.cookies`. If we then redirect, the
   * fresh `NextResponse.redirect()` would lose those cookies, leaving the
   * browser with an invalidated refresh token. This helper copies the rotated
   * cookies onto the redirect before returning it.
   */
  const redirectWithCookies = (target: NextResponse): NextResponse => {
    for (const cookie of response.cookies.getAll()) {
      target.cookies.set(cookie);
    }
    return target;
  };

  const role = (user?.app_metadata?.role as AppRole | undefined) ?? null;
  const { pathname } = request.nextUrl;

  const vendorPublic =
    pathname === "/vendor/login" || pathname === "/vendor/register";

  // --- Layer 1: unauthenticated users ---
  if (!user) {
    if (pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", pathname);
      return redirectWithCookies(NextResponse.redirect(url));
    }
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return redirectWithCookies(NextResponse.redirect(url));
    }
    if (pathname.startsWith("/vendor") && !vendorPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/vendor/login";
      url.searchParams.set("next", pathname);
      return redirectWithCookies(NextResponse.redirect(url));
    }
  }

  // --- Layer 2: authenticated but wrong role (JWT hook must be configured) ---
  if (role) {
    if (!vendorPublic && pathname.startsWith("/vendor") && role !== "vendor") {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_SIGN_IN[role];
      return redirectWithCookies(NextResponse.redirect(url));
    }
    if (pathname.startsWith("/admin") && pathname !== "/admin/login" && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_SIGN_IN[role];
      return redirectWithCookies(NextResponse.redirect(url));
    }
    if (pathname.startsWith("/dashboard") && role !== "customer") {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_SIGN_IN[role];
      return redirectWithCookies(NextResponse.redirect(url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on every request EXCEPT static assets and image optimisation.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|svg|webp|css|js)$).*)",
  ],
};
