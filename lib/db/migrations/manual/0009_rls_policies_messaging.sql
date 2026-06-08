-- =============================================================================
-- 0009_rls_policies_messaging.sql
-- =============================================================================
-- Conversations, conversation_participants, messages, notifications.
-- Membership is stored explicitly in conversation_participants and checked
-- via the helper public.is_conversation_member().
-- =============================================================================

-- ─── conversations ───────────────────────────────────────────────────────────
create policy "conversations read members"
  on public.conversations for select
  using (public.is_conversation_member(id) or public.is_admin());

create policy "conversations insert authenticated"
  on public.conversations for insert
  with check (auth.uid() is not null);

-- ─── conversation_participants ───────────────────────────────────────────────
create policy "participants self read"
  on public.conversation_participants for select
  using (user_id = auth.uid() or public.is_conversation_member(conversation_id) or public.is_admin());

create policy "participants self insert"
  on public.conversation_participants for insert
  with check (auth.uid() is not null);

create policy "participants self update last_read"
  on public.conversation_participants for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── messages ────────────────────────────────────────────────────────────────
create policy "messages read members"
  on public.messages for select
  using (public.is_conversation_member(conversation_id) or public.is_admin());

create policy "messages insert sender"
  on public.messages for insert
  with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

-- ─── notifications ───────────────────────────────────────────────────────────
create policy "notifications self read"
  on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());

create policy "notifications self update read"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
