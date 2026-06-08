import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/auth/server";
import { db, schema } from "@/lib/db";
import { vendorRegisterSchema } from "@/lib/validators/auth.schema";

/**
 * POST /api/v1/vendors/register
 *
 * Single-shot vendor signup. Creates the auth identity, the bridged
 * `public.users` row (via the `handle_new_auth_user` trigger), the
 * `vendor_profiles` row, and any submitted `vendor_documents` rows.
 *
 * Flow:
 *   1. Validate the body against `vendorRegisterSchema`.
 *   2. `supabase.auth.signUp` with `role='vendor'` in user metadata so the
 *      DB trigger writes `public.users.role = 'vendor'` automatically.
 *   3. Insert `vendor_profiles` referencing the new auth user id.
 *   4. Insert any pending document rows; status defaults to 'pending'.
 *
 * If profile creation fails after auth signup we surface the error but do
 * not roll back the auth user — they can retry by signing in and
 * completing onboarding from the vendor portal.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const parsed = vendorRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          message: "Invalid input.",
          details: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const supabase = await getSupabaseServerClient();

  // Build the redirect URL from the request origin so OAuth-style email
  // confirmations land back on this instance, not a hard-coded host.
  const origin =
    request.nextUrl.origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: input.user.email,
    password: input.user.password,
    options: {
      // Surface to the auth.users → public.users trigger.
      data: {
        name: input.user.name,
        phone: input.user.phone ?? null,
        role: "vendor",
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (signUpError || !authData.user) {
    return NextResponse.json(
      {
        error: {
          message: signUpError?.message ?? "Could not create account.",
        },
      },
      { status: 400 }
    );
  }

  const authUserId = authData.user.id;

  // The trigger should have already inserted public.users. If for any reason
  // the trigger hasn't fired yet (rare during long-running migrations), the
  // FK insert below would fail — surface a clear error rather than a
  // generic 500.
  try {
    const [vendor] = await db
      .insert(schema.vendorProfiles)
      .values({
        userId: authUserId,
        vendorType: input.vendorType,
        businessName: input.businessName,
        businessDescription: input.businessDescription ?? null,
        businessWebsite:
          input.businessWebsite && input.businessWebsite !== ""
            ? input.businessWebsite
            : null,
        businessLocation: input.businessLocation ?? null,
        serviceCategory: input.serviceCategory ?? null,
      })
      .returning({ id: schema.vendorProfiles.id });

    if (input.documents && input.documents.length > 0) {
      await db.insert(schema.vendorDocuments).values(
        input.documents.map((doc) => ({
          vendorId: vendor.id,
          docType: doc.docType,
          fileUrl: doc.fileUrl,
        }))
      );
    }

    return NextResponse.json(
      {
        data: {
          vendorId: vendor.id,
          userId: authUserId,
          needsEmailVerification: !authData.session,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          message:
            err instanceof Error
              ? err.message
              : "Vendor profile creation failed.",
        },
      },
      { status: 500 }
    );
  }
}
