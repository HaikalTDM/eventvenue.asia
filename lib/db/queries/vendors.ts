import "server-only";

import { and, desc, eq, sql, type SQL } from "drizzle-orm";

import { db, schema } from "@/lib/db";

/**
 * Vendors query module. Reads and writes the `vendor_profiles` table and the
 * `vendor_documents` child table, joining the owning `users` row whenever a
 * caller needs business-card style fields (name/email/phone) alongside the
 * profile.
 *
 * Why this exists:
 *   - Centralises the (vendor_profiles + users) join shape (`VendorWithUser`)
 *     so admin listings and vendor self-views always see the same fields.
 *   - Keeps mock-data-flag (`is_mock`) filtering local to the data layer; all
 *     public reads default to `includeMock=false` and only admin/dev callers
 *     opt in.
 *   - Provides verification mutations (`setVendorVerification`,
 *     `updateVendorProfile`) so route handlers don't need to know which
 *     columns to touch when an admin approves or rejects a vendor.
 *
 * Pure data-access: no auth checks, no session lookups. The route handler
 * layer is responsible for `requireRole("admin")` etc. before calling.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type VerificationStatus = "pending" | "approved" | "rejected";

export type VendorRow = typeof schema.vendorProfiles.$inferSelect;
export type VendorDocumentRow = typeof schema.vendorDocuments.$inferSelect;

export type VendorWithUser = VendorRow & {
  userName: string;
  userEmail: string;
  userPhone: string | null;
};

export type VendorProfilePatch = Partial<{
  businessName: string;
  businessDescription: string | null;
  businessWebsite: string | null;
  businessLocation: string | null;
  serviceCategory: string | null;
}>;

export type ListVendorsOptions = {
  status?: VerificationStatus;
  /** Include rows flagged `is_mock=true`. Defaults to false. */
  includeMock?: boolean;
  limit?: number;
  offset?: number;
};

// ─── Read queries ───────────────────────────────────────────────────────────

const VENDOR_WITH_USER_COLUMNS = {
  id: schema.vendorProfiles.id,
  userId: schema.vendorProfiles.userId,
  vendorType: schema.vendorProfiles.vendorType,
  businessName: schema.vendorProfiles.businessName,
  businessDescription: schema.vendorProfiles.businessDescription,
  businessWebsite: schema.vendorProfiles.businessWebsite,
  businessLocation: schema.vendorProfiles.businessLocation,
  serviceCategory: schema.vendorProfiles.serviceCategory,
  verificationStatus: schema.vendorProfiles.verificationStatus,
  verificationBadge: schema.vendorProfiles.verificationBadge,
  isMock: schema.vendorProfiles.isMock,
  createdAt: schema.vendorProfiles.createdAt,
  updatedAt: schema.vendorProfiles.updatedAt,
  userName: schema.users.name,
  userEmail: schema.users.email,
  userPhone: schema.users.phone,
} as const;

/**
 * Loads a vendor profile by id and joins the owning user. Returns null if
 * no row matches. Includes mock rows; admin tools use this to inspect any
 * vendor regardless of flag.
 */
export async function getVendorById(id: string): Promise<VendorWithUser | null> {
  const [row] = await db
    .select(VENDOR_WITH_USER_COLUMNS)
    .from(schema.vendorProfiles)
    .innerJoin(schema.users, eq(schema.vendorProfiles.userId, schema.users.id))
    .where(eq(schema.vendorProfiles.id, id))
    .limit(1);
  return row ?? null;
}

/**
 * Loads a vendor profile keyed by the owning user's id. Used by the vendor
 * dashboard which has the authenticated user's id but not the profile id.
 */
export async function getVendorByUserId(userId: string): Promise<VendorWithUser | null> {
  const [row] = await db
    .select(VENDOR_WITH_USER_COLUMNS)
    .from(schema.vendorProfiles)
    .innerJoin(schema.users, eq(schema.vendorProfiles.userId, schema.users.id))
    .where(eq(schema.vendorProfiles.userId, userId))
    .limit(1);
  return row ?? null;
}

/**
 * Lists vendor profiles for the admin queue with optional status filter and
 * pagination. Returns both the rows and the total count for that filter set
 * so the UI can render pagination controls without a second round trip.
 */
export async function listVendors(
  opts: ListVendorsOptions = {}
): Promise<{ rows: VendorWithUser[]; total: number }> {
  const { status, includeMock = false, limit = 50, offset = 0 } = opts;

  const conditions: SQL[] = [];
  if (!includeMock) conditions.push(eq(schema.vendorProfiles.isMock, false));
  if (status) conditions.push(eq(schema.vendorProfiles.verificationStatus, status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select(VENDOR_WITH_USER_COLUMNS)
      .from(schema.vendorProfiles)
      .innerJoin(schema.users, eq(schema.vendorProfiles.userId, schema.users.id))
      .where(where)
      .orderBy(desc(schema.vendorProfiles.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.vendorProfiles)
      .where(where),
  ]);

  return { rows, total: count };
}

/**
 * Returns all vendor documents (license, halal cert, identity, other) for
 * a given vendor profile, ordered newest first. Mock-flag is irrelevant
 * here — documents inherit visibility from the parent vendor row.
 */
export async function listVendorDocuments(vendorId: string): Promise<VendorDocumentRow[]> {
  return db
    .select()
    .from(schema.vendorDocuments)
    .where(eq(schema.vendorDocuments.vendorId, vendorId))
    .orderBy(desc(schema.vendorDocuments.createdAt));
}

// ─── Write queries ──────────────────────────────────────────────────────────

/**
 * Patches a vendor profile's editable business fields. Only the keys present
 * in `patch` are written; nullable fields can be cleared by passing `null`
 * explicitly. `updatedAt` is bumped on every call. Returns the updated row.
 */
export async function updateVendorProfile(
  id: string,
  patch: VendorProfilePatch
): Promise<VendorRow | null> {
  const [row] = await db
    .update(schema.vendorProfiles)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(schema.vendorProfiles.id, id))
    .returning();
  return row ?? null;
}

/**
 * Sets a vendor's verification status (admin approve/reject) and updates the
 * verification badge to match. Approving sets the badge to "verified";
 * rejecting/pending leaves the badge at "none". The optional `reason` is
 * not stored on the profile itself — callers persist it separately (e.g.
 * via the user's `suspendedReason` column when rejection suspends the
 * account). Returns the updated row.
 */
export async function setVendorVerification(
  id: string,
  status: VerificationStatus,
  _reason?: string | null
): Promise<VendorRow | null> {
  const badge = status === "approved" ? "verified" : "none";
  const [row] = await db
    .update(schema.vendorProfiles)
    .set({
      verificationStatus: status,
      verificationBadge: badge,
      updatedAt: new Date(),
    })
    .where(eq(schema.vendorProfiles.id, id))
    .returning();
  return row ?? null;
}
