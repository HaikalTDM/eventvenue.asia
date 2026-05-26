import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticate } from "@/lib/auth/middleware";

export async function GET(request: NextRequest) {
  const { user, error } = await authenticate(request);
  if (error) return error;

  if (!user) {
    return NextResponse.json({ user: null });
  }

  const dbUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, user.sub),
  });

  if (!dbUser) {
    return NextResponse.json({ user: null });
  }

  const vendorProfile = await db.query.vendorProfiles.findFirst({
    where: (vp, { eq }) => eq(vp.userId, dbUser.id),
  });

  return NextResponse.json({
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      phone: dbUser.phone,
      avatarUrl: dbUser.avatarUrl,
      isVerified: dbUser.isVerified,
      vendorId: vendorProfile?.id || null,
      vendorType: vendorProfile?.vendorType || null,
      vendorName: vendorProfile?.businessName || null,
      createdAt: dbUser.createdAt,
    },
  });
}
