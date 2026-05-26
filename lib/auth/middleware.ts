import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, type JwtPayload } from "./jwt";

export interface AuthenticatedRequest extends NextRequest {
  user?: JwtPayload;
}

export async function authenticate(
  request: NextRequest
): Promise<{ user: JwtPayload | null; error: NextResponse | null }> {
  // Prefer the Authorization header (used by API clients), fall back to the
  // accessToken cookie (used by the browser after sign-in / OAuth).
  const authHeader = request.headers.get("authorization");
  let token: string | undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice("Bearer ".length).trim();
  } else {
    token = request.cookies.get("accessToken")?.value;
  }

  if (!token) {
    return { user: null, error: null };
  }

  try {
    const user = await verifyAccessToken(token);
    return { user, error: null };
  } catch {
    return {
      user: null,
      error: NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
        { status: 401 }
      ),
    };
  }
}

export function requireAuth(user: JwtPayload | null): NextResponse | null {
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }
  return null;
}

export function requireRole(
  user: JwtPayload | null,
  ...roles: Array<JwtPayload["role"]>
): NextResponse | null {
  const authError = requireAuth(user);
  if (authError) return authError;
  if (!roles.includes(user!.role)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
      { status: 403 }
    );
  }
  return null;
}

export function requireVendor(
  user: JwtPayload | null,
  ownerVendorId: string
): NextResponse | null {
  const authError = requireAuth(user);
  if (authError) return authError;
  if (user!.role === "admin") return null;
  if (user!.vendorId !== ownerVendorId) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "You do not own this resource" } },
      { status: 403 }
    );
  }
  return null;
}
