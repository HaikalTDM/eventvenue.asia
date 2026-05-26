import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, schema } from "@/lib/db";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { signUpSchema } from "@/lib/validators/auth.schema";
import { handleApiError, conflict, validationError } from "@/lib/utils/errors";
import { issueToken } from "@/lib/email/tokens";
import { sendEmail } from "@/lib/email/client";
import { buildVerifyEmail, buildWelcomeEmail } from "@/lib/email/templates";

const VERIFY_EXPIRES_HOURS = 24;

function isVerificationRequired(): boolean {
  // Default: not required (so flow works without Resend configured).
  return process.env.EMAIL_VERIFICATION_REQUIRED === "true";
}

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
    const normalizedEmail = email.toLowerCase();

    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, normalizedEmail),
    });
    if (existing) {
      throw conflict("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationRequired = isVerificationRequired();

    const [user] = await db
      .insert(schema.users)
      .values({
        name,
        email: normalizedEmail,
        passwordHash,
        phone,
        role: "customer",
        authProvider: "credentials",
        isVerified: !verificationRequired,
      })
      .returning();

    const origin = request.nextUrl.origin;

    if (verificationRequired) {
      const { token, tokenHash } = issueToken();
      const expiresAt = new Date(Date.now() + VERIFY_EXPIRES_HOURS * 60 * 60 * 1000);
      await db.insert(schema.emailVerifications).values({
        userId: user.id,
        tokenHash,
        expiresAt,
      });
      const verifyUrl = `${origin}/verify-email?token=${encodeURIComponent(token)}`;
      const { subject, html, text } = buildVerifyEmail({
        name: user.name,
        verifyUrl,
        expiresInHours: VERIFY_EXPIRES_HOURS,
      });
      await sendEmail({
        to: user.email,
        subject,
        html,
        text,
        consoleLabel: "verify-email (signup)",
        actionLink: verifyUrl,
      });

      // Verification gate active: do NOT issue tokens. UI should show
      // "check your email" state.
      return NextResponse.json(
        {
          requiresVerification: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: false,
          },
        },
        { status: 201 }
      );
    }

    // No verification gate: send a welcome email and issue tokens immediately.
    const welcome = buildWelcomeEmail({ name: user.name, appUrl: origin });
    await sendEmail({
      to: user.email,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
      consoleLabel: "welcome",
    });

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      vendorId: null,
      vendorType: null,
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
