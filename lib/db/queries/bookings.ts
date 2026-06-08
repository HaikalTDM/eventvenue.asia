import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db, schema } from "@/lib/db";

/**
 * Bookings query module. Reads and writes the `bookings` table plus the
 * `booking_services` add-on link table and the conversation that gets
 * spun up alongside every confirmed booking. Bookings inherit visibility
 * from their parent listing — the table itself does not carry an
 * `is_mock` flag — so no `includeMock` plumbing is needed here.
 *
 * Why this exists:
 *   - Centralises the customer-side and vendor-side list shapes; vendor
 *     listings need a listing-id join to scope by ownership.
 *   - Wraps the multi-write `createBookingConversation` in a single
 *     transaction so the conversation row and its two participants are
 *     either both written or both rolled back.
 *   - Provides a typed `BookingWithListing` shape so handlers can perform
 *     ownership checks against `booking.listing.vendorId` without a
 *     second round trip.
 *
 * Pure data-access: authorization (is the caller the customer or the
 * listing's vendor?) is the route handler's job.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type BookingRow = typeof schema.bookings.$inferSelect;
export type BookingServiceRow = typeof schema.bookingServices.$inferSelect;
export type ConversationRow = typeof schema.conversations.$inferSelect;

export type BookingWithListing = BookingRow & {
  listing: {
    id: string;
    title: string;
    slug: string;
    vendorId: string;
  };
};

export type CreateBookingInput = {
  customerId: string;
  listingId: string;
  inquiryId?: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  totalAmount: number | string;
};

export type AddBookingServiceInput = {
  serviceListingId: string;
  packageId?: string | null;
};

// ─── Read queries ───────────────────────────────────────────────────────────

/**
 * Lists every booking made by a given customer, newest first. Used by
 * the customer dashboard. Returns thin rows; load the listing context
 * separately via `getBooking` for detail views.
 */
export async function listCustomerBookings(customerId: string): Promise<BookingRow[]> {
  return db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.customerId, customerId))
    .orderBy(desc(schema.bookings.createdAt));
}

/**
 * Lists every booking against any of a vendor's listings, newest first.
 * Resolves the vendor's listing-ids first, then filters bookings by those
 * ids — bookings have no direct vendor_id column.
 */
export async function listVendorBookings(vendorId: string): Promise<BookingRow[]> {
  const listingIds = await db
    .select({ id: schema.listings.id })
    .from(schema.listings)
    .where(eq(schema.listings.vendorId, vendorId));

  if (listingIds.length === 0) return [];

  return db
    .select()
    .from(schema.bookings)
    .where(
      inArray(
        schema.bookings.listingId,
        listingIds.map((l) => l.id)
      )
    )
    .orderBy(desc(schema.bookings.createdAt));
}

/**
 * Loads a single booking by id and joins enough of the parent listing for
 * a handler to perform vendor-ownership checks. Returns null if the id
 * is unknown.
 */
export async function getBooking(id: string): Promise<BookingWithListing | null> {
  const [row] = await db
    .select({
      id: schema.bookings.id,
      customerId: schema.bookings.customerId,
      listingId: schema.bookings.listingId,
      inquiryId: schema.bookings.inquiryId,
      eventDate: schema.bookings.eventDate,
      startTime: schema.bookings.startTime,
      endTime: schema.bookings.endTime,
      guestCount: schema.bookings.guestCount,
      totalAmount: schema.bookings.totalAmount,
      status: schema.bookings.status,
      createdAt: schema.bookings.createdAt,
      updatedAt: schema.bookings.updatedAt,
      listing: {
        id: schema.listings.id,
        title: schema.listings.title,
        slug: schema.listings.slug,
        vendorId: schema.listings.vendorId,
      },
    })
    .from(schema.bookings)
    .innerJoin(schema.listings, eq(schema.bookings.listingId, schema.listings.id))
    .where(eq(schema.bookings.id, id))
    .limit(1);
  return row ?? null;
}

// ─── Write queries ──────────────────────────────────────────────────────────

/**
 * Inserts a new booking in the "pending" state. `totalAmount` accepts
 * a number or string; Drizzle's decimal column wants a string so we
 * normalise here. Returns the persisted row.
 */
export async function createBooking(input: CreateBookingInput): Promise<BookingRow> {
  const [row] = await db
    .insert(schema.bookings)
    .values({
      customerId: input.customerId,
      listingId: input.listingId,
      inquiryId: input.inquiryId ?? null,
      eventDate: input.eventDate,
      startTime: input.startTime,
      endTime: input.endTime,
      guestCount: input.guestCount,
      totalAmount: String(input.totalAmount),
      status: "pending",
    })
    .returning();
  return row;
}

/**
 * Transitions a booking to a new status. No state machine validation here —
 * unlike inquiries the booking lifecycle is simpler (pending -> confirmed
 * -> in_progress -> completed, with cancelled allowed from anywhere) and
 * is enforced by the calling handler. Returns the updated row, or null
 * if the id was not found.
 */
export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<BookingRow | null> {
  const [row] = await db
    .update(schema.bookings)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.bookings.id, id))
    .returning();
  return row ?? null;
}

/**
 * Bulk-inserts add-on services for a booking. Each entry pairs a service
 * listing with an optional package id. Returns the inserted rows so
 * callers can confirm the link ids.
 */
export async function addBookingServices(
  bookingId: string,
  services: AddBookingServiceInput[]
): Promise<BookingServiceRow[]> {
  if (services.length === 0) return [];
  return db
    .insert(schema.bookingServices)
    .values(
      services.map((s) => ({
        bookingId,
        serviceListingId: s.serviceListingId,
        packageId: s.packageId ?? null,
      }))
    )
    .returning();
}

/**
 * Creates a "direct" conversation tied to a booking and inserts the two
 * participants (customer + vendor user) atomically. Used by the booking
 * creation flow so a chat thread exists from the moment the booking is
 * placed. Returns the conversation row.
 */
export async function createBookingConversation(
  bookingId: string,
  customerId: string,
  vendorUserId: string
): Promise<ConversationRow> {
  return db.transaction(async (tx) => {
    const [conversation] = await tx
      .insert(schema.conversations)
      .values({
        type: "direct",
        title: null,
        bookingId,
      })
      .returning();

    await tx.insert(schema.conversationParticipants).values([
      { conversationId: conversation.id, userId: customerId },
      { conversationId: conversation.id, userId: vendorUserId },
    ]);

    return conversation;
  });
}
