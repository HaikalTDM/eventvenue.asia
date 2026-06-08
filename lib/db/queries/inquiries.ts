import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db, schema } from "@/lib/db";

/**
 * Inquiries query module. Reads and writes the `inquiries` table — the
 * customer-to-vendor "interest" records that may later be converted into a
 * booking. Inquiries do not carry the mock flag themselves; they inherit
 * visibility from their parent listing, so no `includeMock` plumbing is
 * needed here.
 *
 * Why this exists:
 *   - Centralises the customer-side and vendor-side list shapes; vendor
 *     listings need a listing-id join to scope by ownership.
 *   - Encodes the inquiry status state machine (`STATUS_TRANSITIONS`) once,
 *     so any caller that updates status gets the same validation behaviour.
 *   - Returns a discriminated `{ ok, allowed }` result from
 *     `updateInquiryStatus` so handlers can produce a 400 with the allowed
 *     transitions without re-implementing the rules.
 *
 * Pure data-access: authorization (is the caller the customer or the
 * listing's vendor?) is the route handler's job.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type InquiryStatus =
  | "pending"
  | "accepted"
  | "completed"
  | "cancelled";

export type InquiryRow = typeof schema.inquiries.$inferSelect;

export type InquiryWithListing = InquiryRow & {
  listing: {
    id: string;
    title: string;
    slug: string;
    vendorId: string;
  };
};

export type CreateInquiryInput = {
  customerId: string;
  listingId: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  eventType?: string | null;
  specialRequirements?: string | null;
  totalPrice?: number | null;
};

export type UpdateInquiryStatusResult =
  | { ok: true; row: InquiryRow }
  | { ok: false; allowed: InquiryStatus[] };

// ─── State machine ──────────────────────────────────────────────────────────

/**
 * Allowed forward transitions for the inquiry lifecycle. Mirrors the map
 * inlined in `app/api/v1/inquiries/[id]/status/route.ts` — the legacy route
 * keeps its own copy until the cutover; both must stay in sync.
 */
const STATUS_TRANSITIONS: Record<InquiryStatus, InquiryStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// ─── Read queries ───────────────────────────────────────────────────────────

/**
 * Lists every inquiry created by a given customer, newest first. Used by
 * the customer dashboard. Returns thin rows; load the listing separately
 * via `getInquiry` if you need vendor/listing context for one row.
 */
export async function listCustomerInquiries(customerId: string): Promise<InquiryRow[]> {
  return db
    .select()
    .from(schema.inquiries)
    .where(eq(schema.inquiries.customerId, customerId))
    .orderBy(desc(schema.inquiries.createdAt));
}

/**
 * Lists every inquiry directed at any of a vendor's listings, newest first.
 * Resolves the vendor's listing-ids first then filters inquiries by those
 * ids — a vendor may have many listings and the inquiries table has no
 * direct vendor_id column.
 */
export async function listVendorInquiries(vendorId: string): Promise<InquiryRow[]> {
  const listingIds = await db
    .select({ id: schema.listings.id })
    .from(schema.listings)
    .where(eq(schema.listings.vendorId, vendorId));

  if (listingIds.length === 0) return [];

  return db
    .select()
    .from(schema.inquiries)
    .where(
      inArray(
        schema.inquiries.listingId,
        listingIds.map((l) => l.id)
      )
    )
    .orderBy(desc(schema.inquiries.createdAt));
}

/**
 * Loads a single inquiry by id and joins enough of the parent listing for
 * a handler to perform vendor-ownership checks (the listing's `vendorId`
 * is the authoritative owner). Returns null if the id is unknown.
 */
export async function getInquiry(id: string): Promise<InquiryWithListing | null> {
  const [row] = await db
    .select({
      id: schema.inquiries.id,
      customerId: schema.inquiries.customerId,
      listingId: schema.inquiries.listingId,
      eventDate: schema.inquiries.eventDate,
      eventTime: schema.inquiries.eventTime,
      guestCount: schema.inquiries.guestCount,
      eventType: schema.inquiries.eventType,
      specialRequirements: schema.inquiries.specialRequirements,
      totalPrice: schema.inquiries.totalPrice,
      status: schema.inquiries.status,
      createdAt: schema.inquiries.createdAt,
      updatedAt: schema.inquiries.updatedAt,
      listing: {
        id: schema.listings.id,
        title: schema.listings.title,
        slug: schema.listings.slug,
        vendorId: schema.listings.vendorId,
      },
    })
    .from(schema.inquiries)
    .innerJoin(schema.listings, eq(schema.inquiries.listingId, schema.listings.id))
    .where(eq(schema.inquiries.id, id))
    .limit(1);
  return row ?? null;
}

// ─── Write queries ──────────────────────────────────────────────────────────

/**
 * Inserts a new inquiry in the "pending" state and returns the persisted
 * row. Caller must have already validated the listing exists and the
 * customer is allowed to create the inquiry.
 */
export async function createInquiry(input: CreateInquiryInput): Promise<InquiryRow> {
  const [row] = await db
    .insert(schema.inquiries)
    .values({
      customerId: input.customerId,
      listingId: input.listingId,
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      guestCount: input.guestCount,
      eventType: input.eventType ?? null,
      specialRequirements: input.specialRequirements ?? null,
      totalPrice: input.totalPrice != null ? String(input.totalPrice) : null,
      status: "pending",
    })
    .returning();
  return row;
}

/**
 * Transitions an inquiry to a new status, validating against
 * `STATUS_TRANSITIONS`. If the transition is disallowed (or the inquiry
 * doesn't exist), returns `{ ok: false, allowed: [...] }`; on success
 * returns `{ ok: true, row }`. The `updatedAt` column is bumped.
 */
export async function updateInquiryStatus(
  id: string,
  newStatus: InquiryStatus
): Promise<UpdateInquiryStatusResult> {
  const [current] = await db
    .select({ status: schema.inquiries.status })
    .from(schema.inquiries)
    .where(eq(schema.inquiries.id, id))
    .limit(1);

  if (!current) return { ok: false, allowed: [] };

  const allowed = STATUS_TRANSITIONS[current.status as InquiryStatus] ?? [];
  if (!allowed.includes(newStatus)) return { ok: false, allowed };

  const [row] = await db
    .update(schema.inquiries)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(schema.inquiries.id, id))
    .returning();

  return { ok: true, row };
}
