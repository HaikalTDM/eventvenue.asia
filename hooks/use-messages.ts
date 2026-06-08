"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

/**
 * React Query hooks for messages and conversations. Two read paths and two
 * write paths: list the user's conversations, read messages for one
 * conversation, send a message, and mark a conversation read.
 *
 * Conversation creation isn't surfaced as a hook here — it happens
 * implicitly when a booking is created (see `use-bookings.ts`). When a
 * standalone "start a chat" UI lands, add a `useCreateConversation` hook
 * that calls `POST /api/v1/messages/conversations`.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ConversationListItem = {
  id: string;
  type: "direct" | "group";
  title: string | null;
  lastReadAt: string;
  lastMessage: ApiMessage | null;
  createdAt: string;
};

export type ApiMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

// ─── Query keys ─────────────────────────────────────────────────────────────

export const messageKeys = {
  all: ["messages"] as const,
  conversations: () => [...messageKeys.all, "conversations"] as const,
  thread: (conversationId: string) =>
    [...messageKeys.all, "thread", conversationId] as const,
};

// ─── Fetchers ───────────────────────────────────────────────────────────────

async function fetchConversations(): Promise<ConversationListItem[]> {
  const res = await fetch("/api/v1/messages/conversations", { cache: "no-store" });
  if (!res.ok) throw new Error(`conversations_failed: ${res.status}`);
  const body = (await res.json()) as { data: ConversationListItem[] };
  return body.data;
}

async function fetchMessages(
  conversationId: string,
  limit = 50
): Promise<ApiMessage[]> {
  const res = await fetch(
    `/api/v1/messages/conversations/${conversationId}?limit=${limit}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`messages_failed: ${res.status}`);
  const body = (await res.json()) as { data: ApiMessage[] };
  return body.data;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Lists every conversation the authenticated user participates in. The
 * payload includes a last-message preview and the user's last-read
 * timestamp so the inbox can render unread badges without follow-up
 * fetches.
 */
export function useConversations(
  options?: Omit<
    UseQueryOptions<
      ConversationListItem[],
      Error,
      ConversationListItem[],
      ReturnType<typeof messageKeys.conversations>
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: messageKeys.conversations(),
    queryFn: fetchConversations,
    ...options,
  });
}

/**
 * Loads messages for a single conversation, oldest-first. Returns 403 if
 * the caller isn't a participant (the route handler enforces this), which
 * surfaces as an error here.
 */
export function useConversationMessages(
  conversationId: string | null | undefined,
  limit = 50,
  options?: Omit<
    UseQueryOptions<ApiMessage[], Error, ApiMessage[], ReturnType<typeof messageKeys.thread>>,
    "queryKey" | "queryFn" | "enabled"
  > & { enabled?: boolean }
) {
  return useQuery({
    queryKey: messageKeys.thread(conversationId ?? "__missing__"),
    queryFn: () => fetchMessages(conversationId as string, limit),
    enabled: Boolean(conversationId) && options?.enabled !== false,
    ...options,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Sends a message to a conversation. Optimistically appends to the thread
 * cache so the bubble renders before the round-trip completes; rolls back
 * on failure.
 */
export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation<
    ApiMessage,
    Error,
    { conversationId: string; content: string },
    { previous?: ApiMessage[] }
  >({
    mutationFn: async ({ conversationId, content }) => {
      const res = await fetch(
        `/api/v1/messages/conversations/${conversationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      if (!res.ok) throw new Error(`send_message_failed: ${res.status}`);
      const body = (await res.json()) as { data: ApiMessage };
      return body.data;
    },
    onMutate: async ({ conversationId, content }) => {
      await qc.cancelQueries({ queryKey: messageKeys.thread(conversationId) });
      const previous = qc.getQueryData<ApiMessage[]>(messageKeys.thread(conversationId));
      const optimistic: ApiMessage = {
        id: `optimistic-${Date.now()}`,
        conversationId,
        // Optimistic sender id — we don't know it here without an extra
        // /me round-trip; the bubble's UI uses it only for "is this me?"
        // so passing a placeholder is acceptable for the brief window
        // before the real row replaces it.
        senderId: "__me__",
        content,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<ApiMessage[]>(messageKeys.thread(conversationId), (prev) =>
        prev ? [...prev, optimistic] : [optimistic]
      );
      return { previous };
    },
    onError: (_err, { conversationId }, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(messageKeys.thread(conversationId), ctx.previous);
      }
    },
    onSettled: (_data, _err, { conversationId }) => {
      qc.invalidateQueries({ queryKey: messageKeys.thread(conversationId) });
      qc.invalidateQueries({ queryKey: messageKeys.conversations() });
    },
  });
}

/**
 * Bumps the caller's `lastReadAt` for a conversation. Idempotent — calling
 * twice is the same as calling once.
 */
export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string): Promise<void> => {
      const res = await fetch(
        `/api/v1/messages/conversations/${conversationId}`,
        { method: "PUT" }
      );
      if (!res.ok) throw new Error(`mark_read_failed: ${res.status}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.conversations() });
    },
  });
}
