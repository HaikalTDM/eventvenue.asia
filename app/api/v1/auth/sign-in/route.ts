import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, schema } from "@/lib/db";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { signInSchema } from "@/lib/validators/auth.schema";
import { handleApiError, validationError } from "@/lib/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signInSchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const { email, password } = parsed.data;

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email.toLowerCase()),
    });
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid email or password" } },
        { status: 401 }
      );
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: user.suspendedReason || "Account suspended" } },
        { status: 403 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid email or password" } },
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

    const refreshToken = await signRefreshToken(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        vendorId: vendorProfile?.id || null,
        vendorType: vendorProfile?.vendorType || null,
        vendorName: vendorProfile?.businessName || null,
        createdAt: user.createdAt,
      },
      token: {
        accessToken,
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || "3600", 10),
      },
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
