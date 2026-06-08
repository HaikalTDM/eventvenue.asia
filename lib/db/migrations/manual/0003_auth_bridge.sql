-- =============================================================================
-- 0003_auth_bridge.sql
-- =============================================================================
-- Bridges Supabase Auth (auth.users) to the application user table
-- (public.users). Whenever a new authenticated identity is created — by
-- email/password signup, OAuth callback, magic link, or admin invite — this
-- trigger inserts the matching public.users row so foreign keys resolve.
--
-- Metadata (`name`, `phone`, `avatar_url`, `role`) is read from
-- raw_user_meta_data, which Supabase populates from the signup options.
-- Defaults are applied when fields are missing so the row insert never fails.
--
-- Apply after 0002_triggers.sql.
-- =============================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  resolved_role public.user_role;
begin
  -- Only the literal strings 'customer' | 'vendor' | 'admin' are accepted.
  -- Any other value (or absence) defaults to customer.
  resolved_role := case
    when meta->>'role' in ('customer', 'vendor', 'admin')
      then (meta->>'role')::public.user_role
    else 'customer'::public.user_role
  end;

  insert into public.users (
    id, email, name, phone, avatar_url, role, is_verified, created_at, updated_at
  ) values (
    new.id,
    new.email,
    coalesce(meta->>'name', meta->>'full_name', split_part(new.email, '@', 1)),
    meta->>'phone',
    meta->>'avatar_url',
    resolved_role,
    new.email_confirmed_at is not null,
    now(),
    now()
  )
  on conflict (id) do nothing;

  -- Stamp role into raw_app_meta_data so the JWT carries app_metadata.role
  -- for middleware role gating (no custom access token hook needed).
  update auth.users
  set raw_app_meta_data = coalesce(new.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', resolved_role)
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Keep public.users.is_verified in sync with auth.users.email_confirmed_at so
-- a row inserted before email confirmation flips correctly when the link is clicked.
create or replace function public.handle_auth_user_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.users set is_verified = true, updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_verified on auth.users;
create trigger trg_auth_user_verified
  after update on auth.users
  for each row execute function public.handle_auth_user_verified();
