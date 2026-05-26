import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, signAccessToken } from "@/lib/auth/jwt";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value;
    if (!refreshToken) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "No refresh token" } },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid refresh token" } },
        { status: 401 }
      );
    }

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, payload.sub),
    });

    if (!user || user.isSuspended) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "User not found or suspended" } },
        { status: 401 }
      );
    }

    const vendorProfile = await db.query.vendorProfiles.findFirst({
      where: (vp, { eq }) => eq(vp.userId, user.id),
    });

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      vendorId: vendorProfile?.id || null,
      vendorType: vendorProfile?.vendorType || null,
    });

    return NextResponse.json({
      token: {
        accessToken,
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || "3600", 10),
      },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to refresh token" } },
      { status: 500 }
    );
  }
}
