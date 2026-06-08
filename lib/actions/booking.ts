"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireRole, requireUser } from "@/lib/auth/server";
import { db, schema } from "@/lib/db";
import {
  addBookingServices,
  createBooking,
  createBookingConversation,
  getBooking,
  updateBookingStatus,
  type BookingStatus,
} from "@/lib/db/queries/bookings";

/**
 * Server actions for bookings. Wraps the booking query module with auth
 * gates, Zod validation, and `revalidatePath` calls for the customer and
 * vendor dashboards. The conversation that gets spun up alongside a new
 * booking is created in the same call so the chat thread is ready as soon
 * as the booking row exists.
 */

const createBookingSchema = z.object({
  listingId: z.string().uuid(),
  inquiryId: z.string().uuid().optional().nullable(),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "eventDate must be YYYY-MM-DD"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "startTime must be HH:MM[:SS]"),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "endTime must be HH:MM[:SS]"),
  guestCount: z.coerce.number().int().min(1).max(100_000),
  totalAmount: z.coerce.number().nonnegative().max(10_000_000),
});

export type CreateBookingActionInput = z.infer<typeof createBookingSchema>;

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Customer-only. Creates a new pending booking on a listing and immediately
 * spins up a conversation between the customer and the vendor user so the
 * chat thread is ready before payment confirmation arrives.
 */
export async function createBookingAction(
  input: CreateBookingActionInput
): Promise<ActionResult<{ id: string; conversationId: string | null }>> {
  const userOrResp = await requireRole("customer");
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;

  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  const [listing] = await db
    .select({ id: schema.listings.id, vendorId: schema.listings.vendorId })
    .from(schema.listings)
    .where(eq(schema.listings.id, parsed.data.listingId))
    .limit(1);
  if (!listing) return { ok: false, error: "listing_not_found" };

  const [vendor] = await db
    .select({ userId: schema.vendorProfiles.userId })
    .from(schema.vendorProfiles)
    .where(eq(schema.vendorProfiles.id, listing.vendorId))
    .limit(1);

  const booking = await createBooking({
    customerId: user.id,
    listingId: parsed.data.listingId,
    inquiryId: parsed.data.inquiryId ?? null,
    eventDate: parsed.data.eventDate,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    guestCount: parsed.data.guestCount,
    totalAmount: parsed.data.totalAmount,
  });

  let conversationId: string | null = null;
  if (vendor) {
    const conversation = await createBookingConversation(
      booking.id,
      user.id,
      vendor.userId
    );
    conversationId = conversation.id;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/vendor/bookings");

  return { ok: true, data: { id: booking.id, conversationId } };
}

const addServicesSchema = z.object({
  bookingId: z.string().uuid(),
  services: z
    .array(
      z.object({
        serviceListingId: z.string().uuid(),
        packageId: z.string().uuid().optional().nullable(),
      })
    )
    .min(1),
});

export type AddBookingServicesActionInput = z.infer<typeof addServicesSchema>;

/**
 * Customer-only. Attaches add-on service packages to an existing booking.
 * Caller must own the booking; vendors cannot attach services on behalf
 * of customers (that flow runs through inquiry approval instead).
 */
export async function addBookingServicesAction(
  input: AddBookingServicesActionInput
): Promise<ActionResult<{ count: number }>> {
  const userOrResp = await requireRole("customer");
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;

  const parsed = addServicesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  const booking = await getBooking(parsed.data.bookingId);
  if (!booking) return { ok: false, error: "not_found" };
  if (booking.customerId !== user.id) return { ok: false, error: "forbidden" };

  const inserted = await addBookingServices(parsed.data.bookingId, parsed.data.services);
  revalidatePath(`/dashboard/bookings/${parsed.data.bookingId}`);
  return { ok: true, data: { count: inserted.length } };
}

const statusSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum([
    "pending",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
  ] as const),
});

export type UpdateBookingStatusActionInput = z.infer<typeof statusSchema>;

/**
 * Vendor-only. Transitions a booking owned by the vendor to a new status.
 * The booking lifecycle has no rigid state machine (cancelled is reachable
 * from any state, completed from in_progress) so the query module performs
 * a plain UPDATE; ownership is enforced here instead.
 */
export async function updateBookingStatusAction(
  input: UpdateBookingStatusActionInput
): Promise<ActionResult<{ status: BookingStatus }>> {
  const userOrResp = await requireUser();
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  const booking = await getBooking(parsed.data.bookingId);
  if (!booking) return { ok: false, error: "not_found" };

  const isVendorOwner = user.vendorId === booking.listing.vendorId;
  const isAdmin = user.role === "admin";
  if (!isVendorOwner && !isAdmin) return { ok: false, error: "forbidden" };

  const updated = await updateBookingStatus(parsed.data.bookingId, parsed.data.status);
  if (!updated) return { ok: false, error: "not_found" };

  revalidatePath("/vendor/bookings");
  revalidatePath("/dashboard/bookings");

  return { ok: true, data: { status: updated.status as BookingStatus } };
}
