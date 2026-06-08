"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole, requireUser } from "@/lib/auth/server";
import {
  createInquiry,
  getInquiry,
  updateInquiryStatus,
  type InquiryStatus,
} from "@/lib/db/queries/inquiries";

/**
 * Server actions for inquiries. Forms POST directly to these via React's
 * `<form action={...}>` or `useFormState` plumbing, instead of round-tripping
 * through a JSON API. Each action is its own auth boundary; query module calls
 * happen only after the role check passes.
 *
 * Return shape is a discriminated `{ ok: true, ... }` / `{ ok: false, error }`
 * so callers can inline branch without a try/catch around server actions.
 */

const createInquirySchema = z.object({
  listingId: z.string().uuid(),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "eventDate must be YYYY-MM-DD"),
  eventTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "eventTime must be HH:MM or HH:MM:SS"),
  guestCount: z.coerce.number().int().min(1).max(100_000),
  eventType: z.string().max(50).optional().nullable(),
  specialRequirements: z.string().max(2_000).optional().nullable(),
});

export type CreateInquiryActionInput = z.infer<typeof createInquirySchema>;

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Customer-only. Creates a pending inquiry on a listing. Refreshes the
 * customer's inquiry list and the listing detail page so the new row shows
 * up immediately.
 */
export async function createInquiryAction(
  input: CreateInquiryActionInput
): Promise<ActionResult<{ id: string }>> {
  const userOrResp = await requireRole("customer");
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;

  const parsed = createInquirySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  const row = await createInquiry({
    customerId: user.id,
    listingId: parsed.data.listingId,
    eventDate: parsed.data.eventDate,
    eventTime: parsed.data.eventTime,
    guestCount: parsed.data.guestCount,
    eventType: parsed.data.eventType ?? null,
    specialRequirements: parsed.data.specialRequirements ?? null,
  });

  revalidatePath("/dashboard/inquiries");
  revalidatePath(`/venues/${parsed.data.listingId}`);

  return { ok: true, data: { id: row.id } };
}

const updateStatusSchema = z.object({
  inquiryId: z.string().uuid(),
  status: z.enum([
    "pending",
    "accepted",
    "completed",
    "cancelled",
  ] as const),
});

export type UpdateInquiryStatusActionInput = z.infer<typeof updateStatusSchema>;

/**
 * Updates an inquiry's status. Authorised callers: the inquiry's customer,
 * the parent listing's vendor, or an admin. Validation against the
 * `STATUS_TRANSITIONS` table happens inside the query module — disallowed
 * transitions surface as `{ ok: false, error }` with the allowed targets.
 */
export async function updateInquiryStatusAction(
  input: UpdateInquiryStatusActionInput
): Promise<ActionResult<{ status: InquiryStatus }>> {
  const userOrResp = await requireUser();
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;

  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  const inquiry = await getInquiry(parsed.data.inquiryId);
  if (!inquiry) return { ok: false, error: "not_found" };

  const isCustomer = inquiry.customerId === user.id;
  const isVendorOwner = user.vendorId === inquiry.listing.vendorId;
  const isAdmin = user.role === "admin";
  if (!isCustomer && !isVendorOwner && !isAdmin) {
    return { ok: false, error: "forbidden" };
  }

  const result = await updateInquiryStatus(parsed.data.inquiryId, parsed.data.status);
  if (!result.ok) {
    return {
      ok: false,
      error: `Status transition not allowed. Allowed: ${result.allowed.join(", ") || "(none)"}.`,
    };
  }

  revalidatePath("/dashboard/inquiries");
  revalidatePath("/vendor/inquiries");

  return { ok: true, data: { status: result.row.status as InquiryStatus } };
}
