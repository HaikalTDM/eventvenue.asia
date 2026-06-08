-- =============================================================================
-- 0008_rls_policies_transactions.sql
-- =============================================================================
-- RLS for the transactional tables: inquiries, bookings, booking_services,
-- reviews, favorites.
--
-- Read-side rule of thumb: a row is visible to its customer, the vendor that
-- owns the related listing, and to admins. Writes are tighter — see comments
-- on each policy.
-- =============================================================================

-- ─── inquiries ───────────────────────────────────────────────────────────────
create policy "inquiries read participants"
  on public.inquiries for select
  using (
    customer_id = auth.uid()
    or public.owns_listing(listing_id)
    or public.is_admin()
  );

create policy "inquiries customer insert"
  on public.inquiries for insert
  with check (customer_id = auth.uid());

create policy "inquiries vendor status update"
  on public.inquiries for update
  using (public.owns_listing(listing_id) or public.is_admin())
  with check (public.owns_listing(listing_id) or public.is_admin());

-- ─── bookings ────────────────────────────────────────────────────────────────
-- Bookings are server-mutated only (created when an inquiry is confirmed).
-- Clients have no direct write path; the service role bypasses RLS for those.
create policy "bookings read participants"
  on public.bookings for select
  using (
    customer_id = auth.uid()
    or public.owns_listing(listing_id)
    or public.is_admin()
  );

create policy "bookings admin write"
  on public.bookings for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── booking_services ────────────────────────────────────────────────────────
create policy "booking_services read"
  on public.booking_services for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (
          b.customer_id = auth.uid()
          or public.owns_listing(b.listing_id)
          or public.is_admin()
        )
    )
  );

-- ─── reviews ─────────────────────────────────────────────────────────────────
-- Anyone can read; only the customer who has a completed booking on the
-- listing can post a review (the customer_id check + a NOT-EXISTS on completed
-- bookings is enforced server-side as defence-in-depth).
create policy "reviews public read"
  on public.reviews for select using (true);

create policy "reviews customer insert"
  on public.reviews for insert
  with check (
    customer_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.customer_id = auth.uid()
        and b.listing_id = listing_id
        and b.status = 'completed'
    )
  );

create policy "reviews customer delete own"
  on public.reviews for delete
  using (customer_id = auth.uid() or public.is_admin());

-- ─── favorites ───────────────────────────────────────────────────────────────
create policy "favorites self all"
  on public.favorites for all
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());
