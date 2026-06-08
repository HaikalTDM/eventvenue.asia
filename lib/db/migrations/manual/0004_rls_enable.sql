-- =============================================================================
-- 0004_rls_enable.sql
-- =============================================================================
-- Enables row-level security on every public-schema table that holds user data.
-- This file ONLY turns RLS on; the actual policies live in 0005_rls_policies.sql.
--
-- Why split: enabling RLS without policies blocks all access (deny-by-default).
-- Splitting lets us apply 0004 in a maintenance window, verify deny behavior,
-- then apply 0005 to grant the right reads/writes back.
--
-- Tables that intentionally do NOT enable RLS:
--   - amenities, event_types: lookup tables, world-readable, server-only writes.
-- =============================================================================

alter table public.users                      enable row level security;
alter table public.vendor_profiles            enable row level security;
alter table public.vendor_documents           enable row level security;
alter table public.listings                   enable row level security;
alter table public.listing_photos             enable row level security;
alter table public.listing_amenities          enable row level security;
alter table public.listing_event_types        enable row level security;
alter table public.service_packages           enable row level security;
alter table public.service_tags               enable row level security;
alter table public.availability_blocks        enable row level security;
alter table public.availability_slots         enable row level security;
alter table public.inquiries                  enable row level security;
alter table public.bookings                   enable row level security;
alter table public.booking_services           enable row level security;
alter table public.reviews                    enable row level security;
alter table public.favorites                  enable row level security;
alter table public.conversations              enable row level security;
alter table public.conversation_participants  enable row level security;
alter table public.messages                   enable row level security;
alter table public.plan_sessions              enable row level security;
alter table public.plan_recommendations       enable row level security;
alter table public.content_flags              enable row level security;
alter table public.email_verifications        enable row level security;
alter table public.password_resets            enable row level security;
alter table public.notifications              enable row level security;
alter table public.audit_log                  enable row level security;

-- Lookup tables: world-readable, no writes from anon/auth roles.
alter table public.amenities                  enable row level security;
alter table public.event_types                enable row level security;

create policy "amenities readable by everyone"
  on public.amenities for select using (true);

create policy "event_types readable by everyone"
  on public.event_types for select using (true);
