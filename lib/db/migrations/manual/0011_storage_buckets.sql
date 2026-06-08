-- =============================================================================
-- 0011_storage_buckets.sql
-- =============================================================================
-- Supabase Storage buckets and access policies.
--
-- Buckets:
--   listings   public,  vendor-write,  path: {vendor_id}/{listing_id}/...
--   avatars    public,  user-write,    path: {user_id}/...
--   documents  private, vendor-write,  path: {vendor_id}/...
--                       admin-read
--
-- Public buckets serve files via the unsigned CDN URL; the URL is what gets
-- written into listing_photos.url / users.avatar_url.
-- The documents bucket is private — clients must request a signed URL through
-- a server route handler to view a file (admin-only).
--
-- The policies use storage.foldername(name) to extract the first path segment,
-- which is the owning vendor_id or user_id.
-- =============================================================================

-- Create buckets (idempotent).
insert into storage.buckets (id, name, public)
values
  ('listings',  'listings',  true),
  ('avatars',   'avatars',   true),
  ('documents', 'documents', false)
on conflict (id) do nothing;

-- ─── listings bucket ─────────────────────────────────────────────────────────
create policy "listings bucket public read"
  on storage.objects for select
  using (bucket_id = 'listings');

create policy "listings bucket vendor write"
  on storage.objects for insert
  with check (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = public.current_vendor_id()::text
  );

create policy "listings bucket vendor update"
  on storage.objects for update
  using (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = public.current_vendor_id()::text
  );

create policy "listings bucket vendor delete"
  on storage.objects for delete
  using (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = public.current_vendor_id()::text
  );

-- ─── avatars bucket ──────────────────────────────────────────────────────────
create policy "avatars bucket public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars bucket self write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars bucket self update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars bucket self delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── documents bucket (private) ──────────────────────────────────────────────
create policy "documents bucket vendor read own"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = public.current_vendor_id()::text
      or public.is_admin()
    )
  );

create policy "documents bucket vendor write"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_vendor_id()::text
  );

create policy "documents bucket vendor delete"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_vendor_id()::text
  );
