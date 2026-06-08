-- =============================================================================
-- 0007_rls_policies_listings.sql
-- =============================================================================
-- RLS policies for listings and their child rows (photos, amenities link
-- table, event_types link table, service packages, tags, availability).
--
-- Read model:
--   - Public can read any listing where status='active'.
--   - Vendor can read their own listings regardless of status.
--   - Admin can read all.
--
-- Write model:
--   - Vendor owns CRUD for listings whose vendor_id matches their profile.
--   - Admin can override any field (suspension, force-update).
--   - Child rows piggyback on listing ownership.
-- =============================================================================

-- ─── listings ────────────────────────────────────────────────────────────────
create policy "listings public read active"
  on public.listings for select
  using (
    status = 'active'
    or vendor_id = public.current_vendor_id()
    or public.is_admin()
  );

create policy "listings vendor insert"
  on public.listings for insert
  with check (vendor_id = public.current_vendor_id());

create policy "listings vendor update"
  on public.listings for update
  using (vendor_id = public.current_vendor_id())
  with check (vendor_id = public.current_vendor_id());

create policy "listings vendor delete"
  on public.listings for delete
  using (vendor_id = public.current_vendor_id());

create policy "listings admin all"
  on public.listings for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── child rows: visibility follows the parent listing ───────────────────────
-- Photos, amenities mapping, event-types mapping, packages, tags, availability.
-- Each policy delegates the ownership check to public.owns_listing().

create policy "listing_photos read"
  on public.listing_photos for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'active' or l.vendor_id = public.current_vendor_id() or public.is_admin())
    )
  );

create policy "listing_photos write owner"
  on public.listing_photos for all
  using (public.owns_listing(listing_id) or public.is_admin())
  with check (public.owns_listing(listing_id) or public.is_admin());

create policy "listing_amenities read"
  on public.listing_amenities for select using (true);

create policy "listing_amenities write owner"
  on public.listing_amenities for all
  using (public.owns_listing(listing_id) or public.is_admin())
  with check (public.owns_listing(listing_id) or public.is_admin());

create policy "listing_event_types read"
  on public.listing_event_types for select using (true);

create policy "listing_event_types write owner"
  on public.listing_event_types for all
  using (public.owns_listing(listing_id) or public.is_admin())
  with check (public.owns_listing(listing_id) or public.is_admin());

create policy "service_packages read"
  on public.service_packages for select using (true);

create policy "service_packages write owner"
  on public.service_packages for all
  using (public.owns_listing(listing_id) or public.is_admin())
  with check (public.owns_listing(listing_id) or public.is_admin());

create policy "service_tags read"
  on public.service_tags for select using (true);

create policy "service_tags write owner"
  on public.service_tags for all
  using (public.owns_listing(listing_id) or public.is_admin())
  with check (public.owns_listing(listing_id) or public.is_admin());

-- Availability tables: read is public (so users can see what's blocked) but
-- writes are restricted to the listing owner.
create policy "availability_blocks read" on public.availability_blocks for select using (true);
create policy "availability_blocks write owner"
  on public.availability_blocks for all
  using (public.owns_listing(listing_id) or public.is_admin())
  with check (public.owns_listing(listing_id) or public.is_admin());

create policy "availability_slots read" on public.availability_slots for select using (true);
create policy "availability_slots write owner"
  on public.availability_slots for all
  using (public.owns_listing(listing_id) or public.is_admin())
  with check (public.owns_listing(listing_id) or public.is_admin());
