import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getGoogleConfig, buildAuthorizationUrl } from "@/lib/auth/google";

const STATE_COOKIE = "g_oauth_state";
const STATE_TTL_SECONDS = 600;

/**
 * GET /api/v1/auth/google/start
 *
 * Generates a CSRF state, stores it in an httpOnly cookie, and redirects
 * to Google's consent screen. Returns 503 if Google OAuth is not configured.
 */
export async function GET(request: NextRequest) {
  const cfg = getGoogleConfig(request.nextUrl.origin);
  if (!cfg) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_CONFIGURED",
          message: "Google sign-in is not yet available.",
        },
      },
      { status: 503 }
    );
  }

  const state = randomBytes(24).toString("base64url");
  const url = buildAuthorizationUrl(cfg, state);

  const response = NextResponse.redirect(url);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STATE_TTL_SECONDS,
  });
  return response;
}
