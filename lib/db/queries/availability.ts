import "server-only";

import { and, asc, eq, inArray, sql } from "drizzle-orm";

import { db, schema } from "@/lib/db";

/**
 * Availability query module. Reads and writes the two child tables that
 * govern when a listing can be booked: `availability_blocks` (date-level
 * blocked/unblocked flags) and `availability_slots` (timed open windows).
 * Neither table carries the mock flag; visibility is inherited from the
 * parent listing.
 *
 * Why this exists:
 *   - Centralises the "blocked dates + slots" merge so the calendar UI
 *     and the booking validator both see the same shape.
 *   - Hides the `onConflictDoUpdate` upsert pattern used by
 *     `setAvailabilityBlocks` — bulk flipping a set of dates between
 *     blocked/unblocked is the common path and routing it through one
 *     statement avoids dirty per-date round trips.
 *
 * Pure data-access: authorization (is the caller the listing's vendor?)
 * is the route handler's job.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type AvailabilityBlockRow = typeof schema.availabilityBlocks.$inferSelect;
export type AvailabilitySlotRow = typeof schema.availabilitySlots.$inferSelect;

export type AvailabilitySnapshot = {
  blockedDates: string[];
  slots: AvailabilitySlotRow[];
};

export type CreateAvailabilitySlotInput = {
  listingId: string;
  startTime: Date;
  endTime: Date;
  label?: string | null;
  source?: string | null;
};

// ─── Read queries ───────────────────────────────────────────────────────────

/**
 * Returns the blocked-date list and slot windows for a listing in one
 * call, ordered for direct rendering. `blockedDates` is the YYYY-MM-DD
 * subset that has `is_blocked=true`; rows with `is_blocked=false` are
 * intentionally elided since they convey "explicitly available" which
 * the calendar treats the same as "not yet decided".
 */
export async function getListingAvailability(
  listingId: string
): Promise<AvailabilitySnapshot> {
  const [blocks, slots] = await Promise.all([
    db
      .select({ date: schema.availabilityBlocks.date })
      .from(schema.availabilityBlocks)
      .where(
        and(
          eq(schema.availabilityBlocks.listingId, listingId),
          eq(schema.availabilityBlocks.isBlocked, true)
        )
      )
      .orderBy(asc(schema.availabilityBlocks.date)),

    db
      .select()
      .from(schema.availabilitySlots)
      .where(eq(schema.availabilitySlots.listingId, listingId))
      .orderBy(asc(schema.availabilitySlots.startTime)),
  ]);

  return {
    blockedDates: blocks.map((b) => b.date),
    slots,
  };
}

// ─── Write queries ──────────────────────────────────────────────────────────

/**
 * Bulk-flips a set of dates for a listing between blocked and unblocked.
 * Uses `onConflictDoUpdate` keyed on the unique (listing_id, date) index
 * so re-flipping a date never produces duplicate rows. `action="block"`
 * sets `is_blocked=true`; `action="unblock"` sets `is_blocked=false` while
 * keeping the row around so the audit trail (`createdAt`) is preserved.
 */
export async function setAvailabilityBlocks(
  listingId: string,
  dates: string[],
  action: "block" | "unblock"
): Promise<void> {
  if (dates.length === 0) return;

  const isBlocked = action === "block";

  await db
    .insert(schema.availabilityBlocks)
    .values(
      dates.map((date) => ({
        listingId,
        date,
        isBlocked,
      }))
    )
    .onConflictDoUpdate({
      target: [
        schema.availabilityBlocks.listingId,
        schema.availabilityBlocks.date,
      ],
      set: { isBlocked },
    });
}

/**
 * Inserts a single availability slot (a timed open window with optional
 * label and source). The `valid_time_range` check constraint enforces
 * `endTime > startTime` at the DB level; callers should pre-validate to
 * surface a friendlier error message. Returns the persisted row.
 */
export async function createAvailabilitySlot(
  input: CreateAvailabilitySlotInput
): Promise<AvailabilitySlotRow> {
  const [row] = await db
    .insert(schema.availabilitySlots)
    .values({
      listingId: input.listingId,
      startTime: input.startTime,
      endTime: input.endTime,
      label: input.label ?? null,
      source: input.source ?? null,
    })
    .returning();
  return row;
}
