-- =============================================================================
-- 0010_rls_policies_misc.sql
-- =============================================================================
-- Remaining tables: plan_sessions, plan_recommendations, content_flags,
-- audit_log, email_verifications, password_resets.
--
-- email_verifications and password_resets are written by the server only
-- (Supabase Auth manages the canonical flow; these tables exist for legacy
-- compatibility and will be removed once all auth flows go through GoTrue).
-- They are kept admin-only at the RLS layer.
-- =============================================================================

-- ─── plan_sessions ───────────────────────────────────────────────────────────
create policy "plan_sessions self read"
  on public.plan_sessions for select
  using (customer_id = auth.uid() or public.is_admin());

create policy "plan_sessions self insert"
  on public.plan_sessions for insert
  with check (customer_id = auth.uid());

-- ─── plan_recommendations ────────────────────────────────────────────────────
create policy "plan_recommendations self read"
  on public.plan_recommendations for select
  using (
    exists (
      select 1 from public.plan_sessions s
      where s.id = session_id and (s.customer_id = auth.uid() or public.is_admin())
    )
  );

-- ─── content_flags ───────────────────────────────────────────────────────────
create policy "content_flags read admin or flagger"
  on public.content_flags for select
  using (flagger_id = auth.uid() or public.is_admin());

create policy "content_flags insert authenticated"
  on public.content_flags for insert
  with check (flagger_id = auth.uid() and auth.uid() is not null);

create policy "content_flags admin update"
  on public.content_flags for update
  using (public.is_admin())
  with check (public.is_admin());

-- ─── audit_log ───────────────────────────────────────────────────────────────
-- Read-only for admins; inserts happen via the service role only.
create policy "audit_log admin read"
  on public.audit_log for select using (public.is_admin());

-- ─── email_verifications / password_resets ──────────────────────────────────
-- No anon/auth policies = effectively service-role-only via deny-by-default.
-- Admin read is convenient for support troubleshooting.
create policy "email_verifications admin read"
  on public.email_verifications for select using (public.is_admin());

create policy "password_resets admin read"
  on public.password_resets for select using (public.is_admin());
