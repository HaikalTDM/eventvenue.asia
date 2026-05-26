import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, schema } from "@/lib/db";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { signUpSchema } from "@/lib/validators/auth.schema";
import { handleApiError, conflict, validationError } from "@/lib/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const { name, email, password, phone } = parsed.data;

    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email.toLowerCase()),
    });
    if (existing) {
      throw conflict("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(schema.users)
      .values({
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone: phone || null,
        role: "customer",
        authProvider: "credentials",
      })
      .returning();

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

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
        token: {
          accessToken,
          expiresIn: parseInt(process.env.JWT_EXPIRES_IN || "3600", 10),
        },
      },
      { status: 201 }
    );

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
