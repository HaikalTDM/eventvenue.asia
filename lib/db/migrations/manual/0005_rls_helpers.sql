-- =============================================================================
-- 0005_rls_helpers.sql
-- =============================================================================
-- Reusable SECURITY DEFINER helpers used by the policies in 0006/0007/0008.
-- Centralising these keeps policy SQL short and avoids duplicated subqueries.
--
--   public.is_admin()             — true if auth.uid() has role='admin'.
--   public.is_vendor()            — true if auth.uid() has role='vendor'.
--   public.current_vendor_id()    — the vendor_profiles.id owned by auth.uid(),
--                                   or null if the user is not a vendor.
--   public.owns_listing(uuid)     — true when the listing is owned by the
--                                   current user's vendor profile.
--   public.is_conversation_member(uuid)
--                                 — true when auth.uid() participates in the
--                                   given conversation.
-- =============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin' and is_suspended = false
  );
$$;

create or replace function public.is_vendor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'vendor' and is_suspended = false
  );
$$;

create or replace function public.current_vendor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.vendor_profiles where user_id = auth.uid();
$$;

create or replace function public.owns_listing(p_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.listings l
    join public.vendor_profiles v on v.id = l.vendor_id
    where l.id = p_listing_id and v.user_id = auth.uid()
  );
$$;

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = p_conversation_id and user_id = auth.uid()
  );
$$;
