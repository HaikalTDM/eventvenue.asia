-- =============================================================================
-- 0012_role_in_jwt.sql
-- =============================================================================
-- Ensures the user's application role (public.users.role) appears in every
-- Supabase access-token JWT as app_metadata.role so middleware can gate by role
-- without a database query.
--
-- APROACH: Sync role into auth.users.raw_app_meta_data via triggers. GoTrue
-- automatically includes raw_app_meta_data in the JWT under app_metadata.
-- This works on ALL Supabase versions without the Hooks dashboard.
--
-- Two triggers:
--   1. handle_new_auth_user (updated in 0003_auth_bridge.sql) — stamps role
--      into raw_app_meta_data on signup.
--   2. trg_sync_user_role (below) — syncs role when updated on public.users.
--
-- Backfill existing users (run once):
--   UPDATE auth.users au
--   SET raw_app_meta_data = coalesce(au.raw_app_meta_data, '{}'::jsonb)
--       || jsonb_build_object('role', pu.role)
--   FROM public.users pu
--   WHERE au.id = pu.id
--     AND coalesce(au.raw_app_meta_data->>'role', '') != pu.role::text;
-- =============================================================================

create or replace function public.sync_user_role_to_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('role', new.role)
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_user_role on public.users;
create trigger trg_sync_user_role
  after update on public.users
  for each row execute function public.sync_user_role_to_auth();
