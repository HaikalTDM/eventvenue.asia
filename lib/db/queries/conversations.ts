import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db, schema } from "@/lib/db";

/**
 * Conversations query module. Reads and writes the four messaging tables:
 * `conversations`, `conversation_participants`, and `messages`. The booking
 * flow is a primary author of conversation rows (every booking spawns one);
 * users can also create direct threads outside of a booking.
 *
 * Why this exists:
 *   - Centralises the "list my conversations with last-message preview"
 *     shape so the inbox UI and the realtime layer share the same data.
 *   - `getConversation` doubles as the participant guard — it returns
 *     null unless the caller is in the participant table, so handlers
 *     can use it as a one-call auth check.
 *   - Multi-write paths (sending a message + bumping `lastReadAt`,
 *     creating a conversation + its participants) run inside one
 *     transaction so we never end up with orphaned half-state.
 *
 * Pure data-access: authorization (does the caller participate?) is
 * surfaced through `getConversation` returning null; the handler decides
 * whether to respond 403 or 404.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ConversationRow = typeof schema.conversations.$inferSelect;
export type MessageRow = typeof schema.messages.$inferSelect;
export type ParticipantRow = typeof schema.conversationParticipants.$inferSelect;

export type ConversationListItem = {
  id: string;
  type: "direct" | "group";
  title: string | null;
  bookingId: string | null;
  lastReadAt: Date;
  lastMessage: MessageRow | null;
  createdAt: Date;
};

// ─── Read queries ───────────────────────────────────────────────────────────

/**
 * Lists conversations a user participates in, newest-conversation first,
 * with a one-message preview attached per row. The last-message lookup
 * is a per-conversation fan-out via Promise.all — Drizzle's lateral
 * support is uneven across drivers, and the participant set per user
 * is small enough (<200 in practice) that the round trips don't matter.
 */
export async function listUserConversations(
  userId: string
): Promise<ConversationListItem[]> {
  const rows = await db
    .select({
      conversation: schema.conversations,
      lastReadAt: schema.conversationParticipants.lastReadAt,
    })
    .from(schema.conversationParticipants)
    .innerJoin(
      schema.conversations,
      eq(schema.conversationParticipants.conversationId, schema.conversations.id)
    )
    .where(eq(schema.conversationParticipants.userId, userId))
    .orderBy(desc(schema.conversations.createdAt));

  if (rows.length === 0) return [];

  const lastMessages = await Promise.all(
    rows.map(async (r) => {
      const [msg] = await db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, r.conversation.id))
        .orderBy(desc(schema.messages.createdAt))
        .limit(1);
      return msg ?? null;
    })
  );

  return rows.map((r, i) => ({
    id: r.conversation.id,
    type: r.conversation.type,
    title: r.conversation.title,
    bookingId: r.conversation.bookingId,
    lastReadAt: r.lastReadAt,
    lastMessage: lastMessages[i],
    createdAt: r.conversation.createdAt,
  }));
}

/**
 * Returns the conversation row only if the supplied user is a participant.
 * Used as the auth guard from handlers — null means "either no such
 * conversation, or the caller isn't allowed to see it"; the handler
 * decides whether to map that to a 403 or 404.
 */
export async function getConversation(
  conversationId: string,
  userId: string
): Promise<ConversationRow | null> {
  const [row] = await db
    .select({ conversation: schema.conversations })
    .from(schema.conversationParticipants)
    .innerJoin(
      schema.conversations,
      eq(schema.conversationParticipants.conversationId, schema.conversations.id)
    )
    .where(
      and(
        eq(schema.conversationParticipants.conversationId, conversationId),
        eq(schema.conversationParticipants.userId, userId)
      )
    )
    .limit(1);
  return row?.conversation ?? null;
}

/**
 * Lists messages for a conversation, oldest-first. The DB read uses
 * `desc(createdAt)` + `limit` so we always return the most recent N
 * regardless of how long the thread is, then `.reverse()` for the
 * natural top-to-bottom display order.
 */
export async function listMessages(
  conversationId: string,
  limit = 50
): Promise<MessageRow[]> {
  const rows = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(desc(schema.messages.createdAt))
    .limit(limit);
  return rows.reverse();
}

// ─── Write queries ──────────────────────────────────────────────────────────

/**
 * Inserts a message and bumps the sender's `lastReadAt` in the same
 * transaction so the sender's own message never appears as "unread" to
 * themselves. Returns the inserted message row.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<MessageRow> {
  return db.transaction(async (tx) => {
    const [message] = await tx
      .insert(schema.messages)
      .values({ conversationId, senderId, content })
      .returning();

    await tx
      .update(schema.conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(schema.conversationParticipants.conversationId, conversationId),
          eq(schema.conversationParticipants.userId, senderId)
        )
      );

    return message;
  });
}

/**
 * Bumps the participant's `lastReadAt` to "now". No-op if the user isn't
 * actually a participant of the conversation.
 */
export async function markConversationRead(
  conversationId: string,
  userId: string
): Promise<void> {
  await db
    .update(schema.conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(schema.conversationParticipants.conversationId, conversationId),
        eq(schema.conversationParticipants.userId, userId)
      )
    );
}

/**
 * Creates a "direct" conversation and its participant rows in one
 * transaction. `participantIds` is deduplicated up front so handlers
 * can pass `[currentUser, otherUser]` without worrying about whether
 * the other user accidentally equals the current user.
 */
export async function createDirectConversation(
  participantIds: string[],
  title?: string,
  bookingId?: string
): Promise<ConversationRow> {
  const uniqueIds = [...new Set(participantIds)];
  return db.transaction(async (tx) => {
    const [conversation] = await tx
      .insert(schema.conversations)
      .values({
        type: "direct",
        title: title ?? null,
        bookingId: bookingId ?? null,
      })
      .returning();

    if (uniqueIds.length > 0) {
      await tx.insert(schema.conversationParticipants).values(
        uniqueIds.map((uid) => ({
          conversationId: conversation.id,
          userId: uid,
        }))
      );
    }

    return conversation;
  });
}
