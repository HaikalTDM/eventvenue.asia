-- =============================================================================
-- 0006_rls_policies_users.sql
-- =============================================================================
-- RLS policies for user-identity tables: users, vendor_profiles, vendor_documents.
--
-- Principles:
--   * Public reads are limited to non-sensitive fields by exposing dedicated
--     views (handled in queries layer); the base tables stay private.
--   * Self can read self; admin can read all.
--   * Verification status changes flow through admin only.
-- =============================================================================

-- ─── public.users ────────────────────────────────────────────────────────────
create policy "users self read"
  on public.users for select
  using (id = auth.uid() or public.is_admin());

create policy "users self update"
  on public.users for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- Prevent self-elevation: the row's role/suspension fields cannot change
    -- through this policy. Admin updates go through the service role.
    and role = (select role from public.users where id = auth.uid())
    and is_suspended = (select is_suspended from public.users where id = auth.uid())
  );

create policy "users admin all"
  on public.users for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── public.vendor_profiles ──────────────────────────────────────────────────
create policy "vendor_profiles public read approved"
  on public.vendor_profiles for select
  using (verification_status = 'approved' or user_id = auth.uid() or public.is_admin());

create policy "vendor_profiles self insert"
  on public.vendor_profiles for insert
  with check (user_id = auth.uid());

create policy "vendor_profiles self update non-status"
  on public.vendor_profiles for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and verification_status = (
      select verification_status from public.vendor_profiles where user_id = auth.uid()
    )
    and verification_badge = (
      select verification_badge from public.vendor_profiles where user_id = auth.uid()
    )
  );

create policy "vendor_profiles admin all"
  on public.vendor_profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── public.vendor_documents ─────────────────────────────────────────────────
create policy "vendor_documents owner read"
  on public.vendor_documents for select
  using (
    public.is_admin()
    or vendor_id = public.current_vendor_id()
  );

create policy "vendor_documents owner insert"
  on public.vendor_documents for insert
  with check (vendor_id = public.current_vendor_id());

create policy "vendor_documents admin update"
  on public.vendor_documents for update
  using (public.is_admin())
  with check (public.is_admin());
