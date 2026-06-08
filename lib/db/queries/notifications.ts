import "server-only";

import { and, desc, eq, sql, type SQL } from "drizzle-orm";

import { db, schema } from "@/lib/db";

/**
 * Notifications query module. Reads and writes the `notifications` table —
 * the in-app notification feed shown in the bell dropdown and broadcast
 * via Supabase Realtime to a per-user channel. The `type` column is a
 * free-form string (not an enum) so new notification kinds can ship
 * without a migration.
 *
 * Why this exists:
 *   - `markRead` does the ownership check inline (`userId` match in the
 *     WHERE clause) and returns a boolean — the calling handler can
 *     map false to a 403/404 without a separate read.
 *   - `countUnread` is split out from `listNotifications` because the
 *     bell badge re-fetches the count far more often than the full list.
 *
 * Pure data-access: authorization (does the caller own this userId?) is
 * the route handler's job for everything except `markRead`, which folds
 * the check into its WHERE clause.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type NotificationRow = typeof schema.notifications.$inferSelect;

export type ListNotificationsOptions = {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
};

export type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
};

// ─── Read queries ───────────────────────────────────────────────────────────

/**
 * Lists notifications for a user, newest first. `unreadOnly` filters to
 * `is_read=false` for the bell dropdown's default view; the full feed
 * page passes false (or omits the option) to see read history too.
 */
export async function listNotifications(
  userId: string,
  opts: ListNotificationsOptions = {}
): Promise<NotificationRow[]> {
  const { unreadOnly = false, limit = 20, offset = 0 } = opts;

  const conditions: SQL[] = [eq(schema.notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(schema.notifications.isRead, false));

  return db
    .select()
    .from(schema.notifications)
    .where(and(...conditions))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Returns the count of unread notifications for a user. Cheap enough to
 * call on every page render — there's a covering `(user_id, is_read)`
 * index that keeps it index-only.
 */
export async function countUnread(userId: string): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.isRead, false)
      )
    );
  return count;
}

// ─── Write queries ──────────────────────────────────────────────────────────

/**
 * Marks a single notification read, but only if the supplied userId
 * matches the row's owner. Returns true on a hit, false if the row was
 * not owned by the caller or didn't exist. Stamps `read_at` to the
 * current timestamp.
 */
export async function markRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .update(schema.notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(schema.notifications.id, notificationId),
        eq(schema.notifications.userId, userId)
      )
    )
    .returning({ id: schema.notifications.id });
  return result.length > 0;
}

/**
 * Marks every unread notification for a user as read. Used by the "mark
 * all read" action on the bell dropdown.
 */
export async function markAllRead(userId: string): Promise<void> {
  await db
    .update(schema.notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.isRead, false)
      )
    );
}

/**
 * Inserts a new notification. The `metadata` jsonb column accepts any
 * shape; consumers (the bell dropdown, the realtime listener) treat
 * unknown keys as opaque so adding fields here is safe.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationRow> {
  const [row] = await db
    .insert(schema.notifications)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      metadata: (input.metadata ?? null) as never,
    })
    .returning();
  return row;
}
