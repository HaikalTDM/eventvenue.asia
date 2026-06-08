"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireRole } from "@/lib/auth/server";
import { db, schema } from "@/lib/db";
import {
  setVendorVerification,
  updateVendorProfile,
} from "@/lib/db/queries/vendors";
import { uploadVendorDocument } from "@/lib/storage/upload";

/**
 * Server actions for vendor self-service edits and admin verification flips.
 * The new-vendor onboarding wizard is a separate, larger surface (handled by
 * the vendor/register page) — these actions cover the day-to-day mutations:
 *
 *   - vendor edits their own business profile fields
 *   - vendor uploads a verification document
 *   - admin approves or rejects a vendor application
 *
 * Document upload accepts a `File` from the form data and writes it into the
 * private `documents` storage bucket via the helper in `lib/storage/upload.ts`.
 * The resulting path is persisted in `vendor_documents.file_url`; admins read
 * it back through a signed URL.
 */

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ─── Vendor self-service ───────────────────────────────────────────────────

const profilePatchSchema = z.object({
  businessName: z.string().min(1).max(255).optional(),
  businessDescription: z.string().max(5_000).nullable().optional(),
  businessWebsite: z.string().url().max(255).nullable().optional(),
  businessLocation: z.string().max(255).nullable().optional(),
  serviceCategory: z.string().max(100).nullable().optional(),
});

export type UpdateVendorProfileActionInput = z.infer<typeof profilePatchSchema>;

/**
 * Vendor-only. Updates the caller's own vendor profile. Only the editable
 * business-info fields are accepted; verification status, badge, and the
 * mock flag remain admin-controlled.
 */
export async function updateVendorProfileAction(
  input: UpdateVendorProfileActionInput
): Promise<ActionResult<{ id: string }>> {
  const userOrResp = await requireRole("vendor");
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;
  if (!user.vendorId) return { ok: false, error: "no_vendor_profile" };

  const parsed = profilePatchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  const updated = await updateVendorProfile(user.vendorId, parsed.data);
  if (!updated) return { ok: false, error: "not_found" };

  revalidatePath("/vendor/settings");
  revalidatePath("/vendor/dashboard");

  return { ok: true, data: { id: updated.id } };
}

// ─── Document upload ───────────────────────────────────────────────────────

const docTypeSchema = z.enum([
  "business_license",
  "halal_cert",
  "identity",
  "other",
] as const);

/**
 * Vendor-only. Accepts a `FormData` carrying a `file` blob plus a `docType`
 * string. Writes the file to the `documents` Storage bucket under the
 * caller's vendor folder, then inserts a `vendor_documents` row pointing at
 * the resulting object path. The row starts in `status="pending"` and is
 * approved or rejected by an admin via {@link setVendorVerificationAction}'s
 * sibling document workflow.
 */
export async function uploadVendorDocumentAction(
  formData: FormData
): Promise<ActionResult<{ id: string; path: string }>> {
  const userOrResp = await requireRole("vendor");
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;
  if (!user.vendorId) return { ok: false, error: "no_vendor_profile" };

  const file = formData.get("file");
  const docTypeRaw = formData.get("docType");
  if (!(file instanceof File)) return { ok: false, error: "missing_file" };
  const docType = docTypeSchema.safeParse(docTypeRaw);
  if (!docType.success) return { ok: false, error: "invalid_doc_type" };

  // 25 MB hard cap — keeps us safely under Supabase's 50MB default and the
  // typical PDF / image scan size customers actually need.
  if (file.size > 25 * 1024 * 1024) return { ok: false, error: "file_too_large" };

  const upload = await uploadVendorDocument({
    vendorId: user.vendorId,
    file,
    fileName: file.name,
    contentType: file.type || undefined,
  });

  const [row] = await db
    .insert(schema.vendorDocuments)
    .values({
      vendorId: user.vendorId,
      docType: docType.data,
      fileUrl: upload.path,
      status: "pending",
    })
    .returning({ id: schema.vendorDocuments.id });

  revalidatePath("/vendor/settings");
  revalidatePath("/admin/documents");

  return { ok: true, data: { id: row.id, path: upload.path } };
}

// ─── Admin verification ─────────────────────────────────────────────────────

const verificationSchema = z.object({
  vendorId: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"] as const),
  reason: z.string().max(1_000).nullable().optional(),
});

export type SetVendorVerificationActionInput = z.infer<typeof verificationSchema>;

/**
 * Admin-only. Approves or rejects a vendor application. Approving stamps
 * the verified badge and lifts any suspension on the underlying user;
 * rejecting suspends the user with the supplied reason so they immediately
 * lose access to /vendor/* on next request.
 */
export async function setVendorVerificationAction(
  input: SetVendorVerificationActionInput
): Promise<ActionResult> {
  const userOrResp = await requireRole("admin");
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };

  const parsed = verificationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  const [vendor] = await db
    .select({ id: schema.vendorProfiles.id, userId: schema.vendorProfiles.userId })
    .from(schema.vendorProfiles)
    .where(eq(schema.vendorProfiles.id, parsed.data.vendorId))
    .limit(1);
  if (!vendor) return { ok: false, error: "not_found" };

  await setVendorVerification(parsed.data.vendorId, parsed.data.status, parsed.data.reason ?? null);

  if (parsed.data.status === "approved") {
    await db
      .update(schema.users)
      .set({ isVerified: true, isSuspended: false, suspendedReason: null })
      .where(eq(schema.users.id, vendor.userId));
  } else if (parsed.data.status === "rejected") {
    await db
      .update(schema.users)
      .set({
        isSuspended: true,
        suspendedReason: parsed.data.reason || "Vendor application was rejected.",
      })
      .where(eq(schema.users.id, vendor.userId));
  }

  revalidatePath("/admin/vendors");
  revalidatePath("/admin/dashboard");

  return { ok: true, data: undefined };
}
