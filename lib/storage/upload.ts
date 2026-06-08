import "server-only";

import { randomUUID } from "node:crypto";

import { getSupabaseServerClient } from "@/lib/auth/server";

/**
 * Storage upload helpers backed by Supabase Storage. Three buckets are wired
 * by the manual SQL migration `0011_storage_buckets.sql`:
 *
 *   listings   public,  vendor-write,  path: {vendorId}/{listingId}/...
 *   avatars    public,  user-write,    path: {userId}/...
 *   documents  private, vendor-write,  path: {vendorId}/...
 *
 * RLS policies on `storage.objects` enforce ownership by inspecting the first
 * folder segment of the object name, so every helper here is careful to
 * prefix uploads with the correct id segment. Server-side uploads run with
 * the user's session cookie, so the same RLS gates apply that the client
 * would face — uploads will be rejected if the caller doesn't own the path.
 */

export type UploadResult = {
  /** Path relative to the bucket (`{vendorId}/foo.png`). */
  path: string;
  /** Public CDN URL (set for `listings` and `avatars`; for `documents`, use {@link createSignedDocumentUrl}). */
  url: string | null;
};

const BUCKETS = {
  listings: "listings",
  avatars: "avatars",
  documents: "documents",
} as const;

type FileLike = File | Blob | ArrayBuffer | Uint8Array;

/**
 * Generates a slug-safe filename keyed by a fresh UUID. Preserves the original
 * file extension (lower-cased) so MIME guessing on download stays accurate.
 */
function buildFileName(originalName: string | null | undefined): string {
  const id = randomUUID();
  if (!originalName) return id;
  const dot = originalName.lastIndexOf(".");
  if (dot === -1 || dot === originalName.length - 1) return id;
  const ext = originalName.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "");
  return ext ? `${id}.${ext}` : id;
}

/**
 * Common upload primitive. Accepts any of the runtime types the Supabase JS
 * client supports and returns the storage path plus public URL when applicable.
 */
async function uploadTo(
  bucket: keyof typeof BUCKETS,
  path: string,
  file: FileLike,
  contentType?: string
): Promise<UploadResult> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.storage.from(BUCKETS[bucket]).upload(path, file as Blob, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`storage_upload_failed: ${error.message}`);

  if (bucket === "listings" || bucket === "avatars") {
    const { data } = supabase.storage.from(BUCKETS[bucket]).getPublicUrl(path);
    return { path, url: data.publicUrl };
  }
  return { path, url: null };
}

/**
 * Upload a listing photo. Path is `{vendorId}/{listingId}/{uuid.ext}`.
 * Caller is responsible for inserting the resulting URL into `listing_photos`.
 */
export async function uploadListingPhoto(input: {
  vendorId: string;
  listingId: string;
  file: FileLike;
  fileName?: string;
  contentType?: string;
}): Promise<UploadResult> {
  const path = `${input.vendorId}/${input.listingId}/${buildFileName(input.fileName)}`;
  return uploadTo("listings", path, input.file, input.contentType);
}

/**
 * Upload an avatar for a user. Path is `{userId}/{uuid.ext}`. The caller
 * should write the returned URL into `users.avatar_url`. Avatars are public.
 */
export async function uploadAvatar(input: {
  userId: string;
  file: FileLike;
  fileName?: string;
  contentType?: string;
}): Promise<UploadResult> {
  const path = `${input.userId}/${buildFileName(input.fileName)}`;
  return uploadTo("avatars", path, input.file, input.contentType);
}

/**
 * Upload a vendor verification document. Path is `{vendorId}/{uuid.ext}`.
 * Documents are private; produce a signed URL via {@link createSignedDocumentUrl}
 * before showing them to admins. Caller must insert a row into
 * `vendor_documents` with the returned path stored in `file_url`.
 */
export async function uploadVendorDocument(input: {
  vendorId: string;
  file: FileLike;
  fileName?: string;
  contentType?: string;
}): Promise<UploadResult> {
  const path = `${input.vendorId}/${buildFileName(input.fileName)}`;
  return uploadTo("documents", path, input.file, input.contentType);
}

/**
 * Generate a short-lived signed URL for a private document. Default TTL is
 * 5 minutes — enough to render an inline preview, short enough to limit
 * link-sharing risk.
 */
export async function createSignedDocumentUrl(
  path: string,
  expiresInSeconds = 300
): Promise<string> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(BUCKETS.documents)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) {
    throw new Error(`storage_signed_url_failed: ${error?.message ?? "no url returned"}`);
  }
  return data.signedUrl;
}

/**
 * Delete a single object from one of the buckets. RLS will reject deletes the
 * caller doesn't own; treat the boolean as authoritative.
 */
export async function deleteFromBucket(
  bucket: keyof typeof BUCKETS,
  path: string
): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.storage.from(BUCKETS[bucket]).remove([path]);
  return !error;
}
