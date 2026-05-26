import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, schema } from "@/lib/db";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { vendorRegisterSchema } from "@/lib/validators/auth.schema";
import { handleApiError, conflict, validationError } from "@/lib/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = vendorRegisterSchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const { vendorType, businessName, businessDescription, businessWebsite, businessLocation, serviceCategory, user: userData, documents } = parsed.data;

    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, userData.email.toLowerCase()),
    });
    if (existing) {
      throw conflict("Email already registered");
    }

    const passwordHash = await bcrypt.hash(userData.password, 12);

    const [user] = await db
      .insert(schema.users)
      .values({
        name: userData.name,
        email: userData.email.toLowerCase(),
        passwordHash,
        phone: userData.phone || null,
        role: "vendor",
        authProvider: "credentials",
      })
      .returning();

    const [profile] = await db
      .insert(schema.vendorProfiles)
      .values({
        userId: user.id,
        vendorType,
        businessName,
        businessDescription: businessDescription || null,
        businessWebsite: businessWebsite || null,
        businessLocation: businessLocation || null,
        serviceCategory: serviceCategory || null,
        verificationStatus: "pending",
        verificationBadge: "none",
      })
      .returning();

    if (documents && documents.length > 0) {
      await db.insert(schema.vendorDocuments).values(
        documents.map((doc) => ({
          vendorId: profile.id,
          docType: doc.docType,
          fileUrl: doc.fileUrl,
          status: "pending" as const,
        }))
      );
    }

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      vendorId: profile.id,
      vendorType: profile.vendorType,
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
        vendor: {
          id: profile.id,
          vendorType: profile.vendorType,
          businessName: profile.businessName,
          verificationStatus: profile.verificationStatus,
          verificationBadge: profile.verificationBadge,
          createdAt: profile.createdAt,
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

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: parseInt(process.env.JWT_EXPIRES_IN || "3600", 10),
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
