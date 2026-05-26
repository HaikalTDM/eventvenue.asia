import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import {
  getGoogleConfig,
  exchangeCodeForToken,
  fetchUserInfo,
} from "@/lib/auth/google";

const STATE_COOKIE = "g_oauth_state";

/**
 * GET /api/v1/auth/google/callback?code=...&state=...
 *
 * Verifies the state cookie, exchanges the code for tokens, fetches the
 * Google profile, upserts the local user with authProvider='google', and
 * issues access + refresh tokens. Redirects back to the home page on
 * success or to /sign-in?error=... on failure.
 */
export async function GET(request: NextRequest) {
  const cfg = getGoogleConfig(request.nextUrl.origin);
  if (!cfg) {
    return redirectToSignIn(request, "google_not_configured");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return redirectToSignIn(request, error);
  }
  if (!code || !state) {
    return redirectToSignIn(request, "missing_params");
  }

  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  if (!expectedState || expectedState !== state) {
    return redirectToSignIn(request, "state_mismatch");
  }

  try {
    const tokens = await exchangeCodeForToken(cfg, code);
    const profile = await fetchUserInfo(tokens.access_token);

    if (!profile.email) {
      return redirectToSignIn(request, "no_email");
    }
    if (!profile.email_verified) {
      return redirectToSignIn(request, "email_not_verified");
    }

    const email = profile.email.toLowerCase();
    const name = profile.name || profile.given_name || email.split("@")[0];

    // Upsert: if a user with this email exists, link Google to it; otherwise
    // create a fresh customer account.
    let user = await db.query.users.findFirst({
      where: (u, { eq: e }) => e(u.email, email),
    });

    if (!user) {
      const [created] = await db
        .insert(schema.users)
        .values({
          name,
          email,
          authProvider: "google",
          isVerified: true,
          role: "customer",
          avatarUrl: profile.picture || null,
        })
        .returning();
      user = created;
    } else {
      // Existing user signing in with Google. Mark verified, refresh avatar
      // if missing. Don't downgrade a credentials account's password — they
      // can still use either method going forward, but we keep authProvider
      // as whatever it was first registered with.
      const updates: Partial<typeof schema.users.$inferInsert> = {
        isVerified: true,
        updatedAt: new Date(),
      };
      if (!user.avatarUrl && profile.picture) {
        updates.avatarUrl = profile.picture;
      }
      const [updated] = await db
        .update(schema.users)
        .set(updates)
        .where(eq(schema.users.id, user.id))
        .returning();
      user = updated;
    }

    if (user.isSuspended) {
      return redirectToSignIn(request, "suspended");
    }

    const vendorProfile = await db.query.vendorProfiles.findFirst({
      where: (vp, { eq: e }) => e(vp.userId, user!.id),
    });

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      vendorId: vendorProfile?.id || null,
      vendorType: vendorProfile?.vendorType || null,
    });
    const refreshToken = await signRefreshToken(user.id);

    const redirectTarget = user.role === "vendor" ? "/vendor/dashboard" : user.role === "admin" ? "/admin" : "/";
    const response = NextResponse.redirect(new URL(redirectTarget, request.nextUrl.origin));

    response.cookies.delete(STATE_COOKIE);
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: parseInt(process.env.JWT_EXPIRES_IN || "3600", 10),
    });

    return response;
  } catch (err) {
    console.error("[google-oauth] callback error:", err);
    return redirectToSignIn(request, "exchange_failed");
  }
}

function redirectToSignIn(request: NextRequest, code: string) {
  const url = new URL("/sign-in", request.nextUrl.origin);
  url.searchParams.set("error", code);
  const response = NextResponse.redirect(url);
  response.cookies.delete(STATE_COOKIE);
  return response;
}
