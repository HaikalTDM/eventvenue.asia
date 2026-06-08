import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { requireRole } from "@/lib/auth/server";
import { db, schema } from "@/lib/db";
import { uploadListingPhoto } from "@/lib/storage/upload";

/**
 * POST /api/v1/listings/[id]/photos
 *
 * Vendor-only. Multipart upload for listing photos. Each `file` part is
 * streamed into the `listings` storage bucket under
 * `{vendorId}/{listingId}/{uuid.ext}` and a row is inserted into
 * `listing_photos` with the resulting public URL.
 *
 * The first photo on an empty listing is marked `is_primary=true` so the
 * grid card has a thumbnail. Subsequent uploads append at the end of the
 * sort order.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const userOrResp = await requireRole("vendor");
  if (userOrResp instanceof NextResponse) return userOrResp;
  const user = userOrResp;
  if (!user.vendorId) {
    return NextResponse.json(
      { error: { message: "Complete vendor onboarding first." } },
      { status: 400 }
    );
  }

  const [listing] = await db
    .select({ id: schema.listings.id, vendorId: schema.listings.vendorId })
    .from(schema.listings)
    .where(eq(schema.listings.id, listingId))
    .limit(1);

  if (!listing) {
    return NextResponse.json(
      { error: { message: "Listing not found." } },
      { status: 404 }
    );
  }
  if (listing.vendorId !== user.vendorId) {
    return NextResponse.json(
      { error: { message: "You don't own this listing." } },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid multipart body." } },
      { status: 400 }
    );
  }

  const files = formData.getAll("file").filter((v): v is File => v instanceof File);
  if (files.length === 0) {
    return NextResponse.json(
      { error: { message: "No files supplied." } },
      { status: 400 }
    );
  }

  // 10MB per file, 10 files per request — keeps the function under the
  // serverless body cap and prevents accidental dumps.
  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  if (files.some((f) => f.size > MAX_FILE_BYTES)) {
    return NextResponse.json(
      { error: { message: "Each file must be 10MB or smaller." } },
      { status: 413 }
    );
  }
  if (files.length > 10) {
    return NextResponse.json(
      { error: { message: "Upload up to 10 photos per request." } },
      { status: 400 }
    );
  }

  // Pick a starting sort order based on what's already in the table so
  // sequential uploads from a wizard preserve insertion order.
  const existing = await db
    .select({ id: schema.listingPhotos.id })
    .from(schema.listingPhotos)
    .where(eq(schema.listingPhotos.listingId, listingId));
  const startOrder = existing.length;
  const isFirstUpload = existing.length === 0;

  const inserted: { id: string; url: string }[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const upload = await uploadListingPhoto({
        vendorId: user.vendorId,
        listingId,
        file,
        fileName: file.name,
        contentType: file.type || undefined,
      });
      // Public URL is always set for the listings bucket; fall back to the
      // path if Supabase didn't return one (shouldn't happen in practice).
      const url = upload.url ?? upload.path;
      const [row] = await db
        .insert(schema.listingPhotos)
        .values({
          listingId,
          url,
          sortOrder: startOrder + i,
          isPrimary: isFirstUpload && i === 0,
        })
        .returning({ id: schema.listingPhotos.id });
      inserted.push({ id: row.id, url });
    } catch (err) {
      return NextResponse.json(
        {
          error: {
            message: err instanceof Error ? err.message : "Photo upload failed.",
          },
          uploaded: inserted,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ data: inserted }, { status: 201 });
}
