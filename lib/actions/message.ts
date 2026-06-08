"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/server";
import {
  getConversation,
  markConversationRead,
  sendMessage,
} from "@/lib/db/queries/conversations";

/**
 * Server actions for the messaging surface. Two narrow operations:
 *
 *   - send a message to a conversation the caller participates in
 *   - mark a conversation as read (bumps the caller's `lastReadAt`)
 *
 * Conversation creation runs implicitly when a booking is created (see
 * `lib/actions/booking.ts`); there's no standalone "start a chat" surface
 * yet. When that lands, add a third action here.
 *
 * Auth model: any participant can read or write. The query module's
 * `getConversation(conversationId, userId)` enforces the participant check
 * so we don't need to re-query `conversation_participants` here.
 */

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const sendSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(10_000),
});

export type SendMessageActionInput = z.infer<typeof sendSchema>;

/**
 * Sends a message into a conversation. Caller must be a participant — the
 * `getConversation(id, userId)` guard returns null if not, which we surface
 * as 403 to discourage participant-list enumeration.
 */
export async function sendMessageAction(
  input: SendMessageActionInput
): Promise<ActionResult<{ id: string }>> {
  const userOrResp = await requireUser();
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;

  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  const conversation = await getConversation(parsed.data.conversationId, user.id);
  if (!conversation) return { ok: false, error: "forbidden" };

  const message = await sendMessage(
    parsed.data.conversationId,
    user.id,
    parsed.data.content
  );

  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/messages/${parsed.data.conversationId}`);
  revalidatePath("/vendor/messages");
  revalidatePath(`/vendor/messages/${parsed.data.conversationId}`);

  return { ok: true, data: { id: message.id } };
}

const readSchema = z.object({ conversationId: z.string().uuid() });

/**
 * Bumps the caller's `lastReadAt` for a conversation. Idempotent — re-marking
 * as read is a no-op write that returns success.
 */
export async function markConversationReadAction(
  input: z.infer<typeof readSchema>
): Promise<ActionResult> {
  const userOrResp = await requireUser();
  if (userOrResp instanceof Response) return { ok: false, error: "unauthenticated" };
  const user = userOrResp;

  const parsed = readSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const conversation = await getConversation(parsed.data.conversationId, user.id);
  if (!conversation) return { ok: false, error: "forbidden" };

  await markConversationRead(parsed.data.conversationId, user.id);

  revalidatePath("/dashboard/messages");
  revalidatePath("/vendor/messages");

  return { ok: true, data: undefined };
}
