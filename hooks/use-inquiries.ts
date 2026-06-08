"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import type { ApiInquiry } from "@/lib/api";

/**
 * React Query hooks for the inquiries surface. The customer dashboard reads
 * its own inquiries; the vendor portal reads the inquiries on its listings;
 * status updates fan out via the same mutation hook.
 *
 * The mutations call the route handlers (not server actions) so the legacy
 * /vendor and /dashboard pages can adopt them without restructuring the
 * surrounding form code. Server actions remain available for new surfaces
 * that prefer the `<form action={...}>` pattern.
 */

// ─── Query keys ─────────────────────────────────────────────────────────────

export const inquiryKeys = {
  all: ["inquiries"] as const,
  mine: () => [...inquiryKeys.all, "mine"] as const,
  vendor: () => [...inquiryKeys.all, "vendor"] as const,
  detail: (id: string) => [...inquiryKeys.all, "detail", id] as const,
};

// ─── Fetchers ───────────────────────────────────────────────────────────────

async function fetchMyInquiries(): Promise<ApiInquiry[]> {
  const res = await fetch("/api/v1/inquiries", { cache: "no-store" });
  if (!res.ok) throw new Error(`my_inquiries_failed: ${res.status}`);
  const body = (await res.json()) as { data: ApiInquiry[] };
  return body.data;
}

async function fetchVendorInquiries(): Promise<ApiInquiry[]> {
  const res = await fetch("/api/v1/inquiries/vendor", { cache: "no-store" });
  if (!res.ok) throw new Error(`vendor_inquiries_failed: ${res.status}`);
  const body = (await res.json()) as { data: ApiInquiry[] };
  return body.data;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Lists the authenticated customer's inquiries, newest first. The route
 * handler returns 401 for anonymous callers, which surfaces as an error;
 * call sites typically gate the hook behind `enabled: !!user`.
 */
export function useMyInquiries(
  options?: Omit<
    UseQueryOptions<ApiInquiry[], Error, ApiInquiry[], ReturnType<typeof inquiryKeys.mine>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: inquiryKeys.mine(),
    queryFn: fetchMyInquiries,
    ...options,
  });
}

/**
 * Lists every inquiry against any of the authenticated vendor's listings.
 * The route handler joins the listing-id check internally; vendors with no
 * listings get an empty array.
 */
export function useVendorInquiries(
  options?: Omit<
    UseQueryOptions<ApiInquiry[], Error, ApiInquiry[], ReturnType<typeof inquiryKeys.vendor>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: inquiryKeys.vendor(),
    queryFn: fetchVendorInquiries,
    ...options,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export type CreateInquiryInput = {
  listingId: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  eventType?: string | null;
  specialRequirements?: string | null;
  totalPrice?: number | null;
};

/**
 * Creates an inquiry against a listing. Invalidates both the customer and
 * vendor lists on success — the customer sees the new pending row, the
 * vendor sees the incoming request.
 */
export function useCreateInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInquiryInput): Promise<ApiInquiry> => {
      const res = await fetch("/api/v1/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `create_inquiry_failed: ${res.status}`);
      }
      const body = (await res.json()) as { data: ApiInquiry };
      return body.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inquiryKeys.all });
    },
  });
}

export type UpdateInquiryStatusInput = {
  id: string;
  status:
    | "pending"
    | "accepted"
    | "completed"
    | "cancelled";
};

/**
 * Transitions an inquiry to a new status. The route handler validates the
 * STATUS_TRANSITIONS state machine; disallowed transitions surface as an
 * `Error` with a user-readable message that includes the allowed targets.
 */
export function useUpdateInquiryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateInquiryStatusInput): Promise<ApiInquiry> => {
      const res = await fetch(`/api/v1/inquiries/${input.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: input.status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `update_status_failed: ${res.status}`);
      }
      const body = (await res.json()) as { data: ApiInquiry };
      return body.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inquiryKeys.all });
    },
  });
}
