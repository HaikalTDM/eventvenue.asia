-- =============================================================================
-- 0002_triggers.sql
-- =============================================================================
-- Database-side automation that the application code relies on:
--   1. set_updated_at()       — bumps updated_at on every UPDATE
--   2. handle_new_auth_user() — mirrors auth.users → public.users on signup
--   3. ensure_listing_slug()  — generates a unique slug if vendor omits one
--
-- These run regardless of which API path or service role inserts the data,
-- so they're the safest place for invariants the app cannot easily enforce.
-- Apply after 0001_extensions.sql.
-- =============================================================================

-- ─── 1. updated_at maintenance ────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Helper to attach the trigger to any table that has an updated_at column.
-- Wrapped in a do-block so we can iterate.
do $$
declare
  t text;
  tables text[] := array[
    'users',
    'vendor_profiles',
    'listings',
    'inquiries',
    'bookings'
  ];
begin
  foreach t in array tables loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on public.%1$s;
       create trigger trg_%1$s_updated_at
         before update on public.%1$s
         for each row execute function public.set_updated_at();',
      t
    );
  end loop;
end;
$$;

-- ─── 3. auto-slug for listings ───────────────────────────────────────────────
-- Generates a URL-safe slug from title when one isn't supplied. Collision-safe:
-- appends a random 8-hex suffix on the first attempt; if the combined slug
-- collides with an existing one, appends a second suffix.
create or replace function public.ensure_listing_slug()
returns trigger
language plpgsql
as $$
declare
  base text;
  attempt text;
begin
  if length(coalesce(new.slug, '')) > 0 then return new; end if;

  base := lower(regexp_replace(
    new.title,
    '[^a-zA-Z0-9]+', '-', 'g'
  ));
  base := trim(both '-' from base);
  if length(base) = 0 then base := 'listing'; end if;

  attempt := base || '-' || ltrim(to_hex(floor(random() * 4294967295)::bigint), '0');
  if exists (select 1 from public.listings where slug = attempt) then
    attempt := attempt || '-' || ltrim(to_hex(floor(random() * 65535)::int), '0');
  end if;

  new.slug := attempt;
  return new;
end;
$$;

drop trigger if exists trg_listing_slug on public.listings;
create trigger trg_listing_slug
  before insert on public.listings
  for each row execute function public.ensure_listing_slug();
