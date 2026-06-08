import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";

import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Server-side Supabase client. Reads and writes the auth cookies via Next's
 * `cookies()` API so that Server Components, Route Handlers, and Server
 * Actions all share the same session state with the browser client.
 *
 * Use `getSupabaseServerClient()` instead of importing `createClient` directly
 * — this wrapper handles the cookie plumbing and the Next 15 async cookies API.
 *
 * Wrapped in `React.cache` so multiple callers within a single request share
 * one client instance instead of re-running the cookie-store handshake.
 */
export const getSupabaseServerClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          // In Server Components this throws (cookies are read-only) and is
          // expected to be a no-op — the middleware refresh handles writes.
          // In Route Handlers and Server Actions this writes successfully.
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options as CookieOptions);
            }
          } catch {
            // no-op in Server Components
          }
        },
      },
    }
  );
});

export type AuthRole = "customer" | "vendor" | "admin";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: AuthRole;
  isVerified: boolean;
  isSuspended: boolean;
  vendorId: string | null;
  vendorType: "venue_owner" | "service_provider" | null;
  vendorName: string | null;
  businessDescription: string | null;
  businessWebsite: string | null;
  businessLocation: string | null;
  serviceCategory: string | null;
};

/**
 * Returns the current authenticated user with the application profile fields
 * joined from `public.users` and `public.vendor_profiles`. Returns `null` if
 * there is no session, the auth user has no matching profile row yet, or the
 * profile is suspended.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const [profile] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      phone: schema.users.phone,
      avatarUrl: schema.users.avatarUrl,
      role: schema.users.role,
      isVerified: schema.users.isVerified,
      isSuspended: schema.users.isSuspended,
    })
    .from(schema.users)
    .where(eq(schema.users.id, authUser.id))
    .limit(1);

  if (!profile || profile.isSuspended) return null;

  let vendorId: string | null = null;
  let vendorType: SessionUser["vendorType"] = null;
  let vendorName: string | null = null;
  let businessDescription: string | null = null;
  let businessWebsite: string | null = null;
  let businessLocation: string | null = null;
  let serviceCategory: string | null = null;

  if (profile.role === "vendor") {
    const [vendor] = await db
      .select({
        id: schema.vendorProfiles.id,
        vendorType: schema.vendorProfiles.vendorType,
        businessName: schema.vendorProfiles.businessName,
        businessDescription: schema.vendorProfiles.businessDescription,
        businessWebsite: schema.vendorProfiles.businessWebsite,
        businessLocation: schema.vendorProfiles.businessLocation,
        serviceCategory: schema.vendorProfiles.serviceCategory,
      })
      .from(schema.vendorProfiles)
      .where(eq(schema.vendorProfiles.userId, profile.id))
      .limit(1);

    if (vendor) {
      vendorId = vendor.id;
      vendorType = vendor.vendorType;
      vendorName = vendor.businessName;
      businessDescription = vendor.businessDescription;
      businessWebsite = vendor.businessWebsite;
      businessLocation = vendor.businessLocation;
      serviceCategory = vendor.serviceCategory;
    }
  }

  return { ...profile, vendorId, vendorType, vendorName, businessDescription, businessWebsite, businessLocation, serviceCategory };
}

/**
 * Throws-via-Response if not authenticated. Use inside Route Handlers:
 *
 *     const userOrResponse = await requireUser();
 *     if (userOrResponse instanceof NextResponse) return userOrResponse;
 *     const user = userOrResponse;
 */
export async function requireUser(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthenticated", message: "Sign in to continue." },
      { status: 401 }
    );
  }
  return user;
}

/**
 * Like `requireUser()` but additionally enforces a role (or one of several).
 */
export async function requireRole(
  role: AuthRole | AuthRole[]
): Promise<SessionUser | NextResponse> {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(user.role)) {
    return NextResponse.json(
      { error: "forbidden", message: "You don't have access to that resource." },
      { status: 403 }
    );
  }
  return user;
}
