"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

/**
 * React Query hooks for the bookings surface. Mirrors the shape of
 * `use-inquiries.ts` — a customer-side list, a vendor-side list, a single
 * detail query, and mutation hooks for creation and status flips.
 *
 * All mutations invalidate the entire bookings cache so the customer's
 * "My bookings" page and the vendor's incoming-bookings dashboard both
 * pick up the new state on the next render.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ApiBooking = {
  id: string;
  customerId: string;
  listingId: string;
  inquiryId: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  totalAmount: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
};

// ─── Query keys ─────────────────────────────────────────────────────────────

export const bookingKeys = {
  all: ["bookings"] as const,
  mine: () => [...bookingKeys.all, "mine"] as const,
  vendor: () => [...bookingKeys.all, "vendor"] as const,
  detail: (id: string) => [...bookingKeys.all, "detail", id] as const,
};

// ─── Fetchers ───────────────────────────────────────────────────────────────

async function fetchMyBookings(): Promise<ApiBooking[]> {
  const res = await fetch("/api/v1/bookings", { cache: "no-store" });
  if (!res.ok) throw new Error(`my_bookings_failed: ${res.status}`);
  const body = (await res.json()) as { data: ApiBooking[] };
  return body.data;
}

async function fetchVendorBookings(): Promise<ApiBooking[]> {
  const res = await fetch("/api/v1/bookings/vendor", { cache: "no-store" });
  if (!res.ok) throw new Error(`vendor_bookings_failed: ${res.status}`);
  const body = (await res.json()) as { data: ApiBooking[] };
  return body.data;
}

async function fetchBooking(id: string): Promise<ApiBooking> {
  const res = await fetch(`/api/v1/bookings/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`booking_detail_failed: ${res.status}`);
  const body = (await res.json()) as { data: ApiBooking };
  return body.data;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Lists the authenticated customer's bookings, newest first.
 */
export function useMyBookings(
  options?: Omit<
    UseQueryOptions<ApiBooking[], Error, ApiBooking[], ReturnType<typeof bookingKeys.mine>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: bookingKeys.mine(),
    queryFn: fetchMyBookings,
    ...options,
  });
}

/**
 * Lists every booking against any of the authenticated vendor's listings.
 */
export function useVendorBookings(
  options?: Omit<
    UseQueryOptions<ApiBooking[], Error, ApiBooking[], ReturnType<typeof bookingKeys.vendor>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: bookingKeys.vendor(),
    queryFn: fetchVendorBookings,
    ...options,
  });
}

/**
 * Single-booking detail for confirmation and message-thread pages. Caller
 * may be the customer, the listing's vendor, or an admin — the route handler
 * gates accordingly and returns 403 to anyone else.
 */
export function useBooking(
  id: string | null | undefined,
  options?: Omit<
    UseQueryOptions<ApiBooking, Error, ApiBooking, ReturnType<typeof bookingKeys.detail>>,
    "queryKey" | "queryFn" | "enabled"
  > & { enabled?: boolean }
) {
  return useQuery({
    queryKey: bookingKeys.detail(id ?? "__missing__"),
    queryFn: () => fetchBooking(id as string),
    enabled: Boolean(id) && options?.enabled !== false,
    ...options,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export type CreateBookingInput = {
  listingId: string;
  inquiryId?: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  totalAmount: number | string;
};

/**
 * Creates a booking. The route handler also spins up the conversation row
 * between the customer and the vendor user, so callers don't need a follow-up
 * call — the conversation id will appear on the next /api/v1/messages/conversations
 * fetch.
 */
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBookingInput): Promise<ApiBooking> => {
      const res = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `create_booking_failed: ${res.status}`);
      }
      const body = (await res.json()) as { data: ApiBooking };
      return body.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export type UpdateBookingStatusInput = {
  id: string;
  status: BookingStatus;
};

/**
 * Vendor-only. Transitions a booking to a new status. The booking lifecycle
 * has no rigid state machine; ownership is enforced by the route handler.
 */
export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateBookingStatusInput): Promise<ApiBooking> => {
      const res = await fetch(`/api/v1/bookings/${input.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: input.status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `update_status_failed: ${res.status}`);
      }
      const body = (await res.json()) as { data: ApiBooking };
      return body.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}
