# Testing Guide — End-to-End System Flows

**Stack:** Next.js 15 + Supabase Auth/DB/Storage + React Query + server actions.
**Goal:** validate every migrated surface with manual smoke tests across the
three personas. Run after `npm run dev` (or against a deployed preview).

Each flow lists the **prerequisites**, **steps**, and the **expected result**
plus the **DB or storage** rows the action should produce. If a step doesn't
match expectations, capture the failing route and the network response — the
post-Phase-3 surface area is wired through `hooks/*` and `lib/actions/*`, so
the failing layer is usually obvious from the request URL.

---

## 0. Test data setup

Before running the flows, seed at least one of each. Vendors come in two
flavours — `vendor_type='venue_owner'` (lists physical venues) and
`vendor_type='service_provider'` (lists services like catering / photography).
The two share a portal but list through different forms and see slightly
different dashboard labels.

| Persona         | Email                     | Notes                                                   |
|-----------------|---------------------------|---------------------------------------------------------|
| Admin           | `admin@test.local`        | role=admin, is_verified=true                            |
| Venue vendor    | `venue1@test.local`       | role=vendor, vendor_type=venue_owner, approved          |
| Service vendor  | `service1@test.local`     | role=vendor, vendor_type=service_provider, approved     |
| Pending vendor  | `pending@test.local`      | role=vendor, verification=pending (any type)            |
| Customer        | `customer@test.local`     | role=customer                                           |

Set passwords manually in Supabase Studio (Auth → Users → ⋯ → Reset). Promote
the admin via SQL: `UPDATE public.users SET role='admin', is_verified=true
WHERE email='admin@test.local';`

You'll also want, owned by `venue1`: one **active** venue listing and one
**draft**. Owned by `service1`: one **active** service listing and one
**draft**. That covers publish/pause and the vendor-type branches in one pass.

---

## 1. Customer flow

### 1.1 Sign-up + email verification
- Visit `/sign-up`, fill name/email/password/phone.
- **Expect:** "Check your email" view; Supabase sends a verification email.
- **DB:** new row in `auth.users` and in `public.users` (via trigger) with
  `role='customer'` and `is_verified=false`.
- Click the email link → lands on `/auth/callback` → redirects to `/`.

### 1.2 Sign-in
- `/sign-in` → submit credentials.
- **Expect:** redirected to `/` (customer) or `/vendor/dashboard` (vendor) or
  `/admin/dashboard` (admin) by role.
- Session cookie present; nav shows the avatar dropdown.

### 1.3 Forgot / reset password
- `/forgot-password` → submit email.
- **Expect:** Supabase emails a recovery link.
- Click link → lands on `/reset-password` (gated on the recovery session).
- Submit new password → sign-in works with the new credential.

### 1.4 Browse + search + filter
- `/` (or `/venues`) loads the discovery grid. The grid mixes both
  `listing_type='venue'` and `'service'` rows by default; filter by type
  to verify each scopes correctly (`type=venue` shows only venues,
  `type=service` shows only services).
- Apply filters (state, price, capacity, halal-only, amenities, event types).
- **Expect:** URL params update; grid re-fetches via `useListings`; pagination
  works; filter sidebar counts reflect the active query. Capacity filters
  do not apply to service listings (services have no capacity).

### 1.5 Compare
- `/compare` — pick up to 3 listings.
- **Expect:** seeded from `localStorage` or favorites the first time, fully
  user-driven afterward; "Best" highlight on price/capacity/rating columns.

### 1.6 Favorites (heart toggle)
- Anonymous: clicking the heart on a `VenueCard` opens the sign-in prompt.
- Signed-in: heart fills immediately (optimistic), syncs to
  `/api/v1/favorites`. Refresh → heart still filled.
- `/dashboard/favorites` lists the favorited listings.
- **DB:** row in `favorites` for `(user_id, listing_id)`.

### 1.7 Send inquiry
- Open a venue or service listing → click "Send Inquiry" → fill the modal.
- For service listings, the booking card variant adapts: no per-hour pricing
  or capacity field, just the inquiry CTA. Inquiry payload is the same
  shape; the route handler accepts inquiries against either listing type.
- **Expect:** modal closes with success state; inquiry appears in
  `/dashboard/inquiries` (status=`pending`) and on the vendor's
  `/vendor/inquiries`.
- **DB:** row in `inquiries` with `customer_id`, `listing_id`, `status='pending'`.

### 1.8 Book a venue
- Venue listings only — service inquiries don't currently produce a
  `bookings` row directly. The vendor accepts the inquiry, then the
  customer is invited to confirm dates which materialises the booking.
- On the venue detail page, fill the date/time + guest count → "Book Now"
  → "Confirm".
- **Expect:** redirects to `/dashboard`; new row visible.
- **DB:** row in `bookings` with `status='pending'`, plus a `conversation`
  row joining the customer and the listing's vendor.

### 1.9 Customer dashboard
- `/dashboard` — sidebar links work, stats are accurate.
- `/dashboard/inquiries` — sees their pending/accepted/cancelled rows.
- `/dashboard/favorites` — favorited listings list; unfavoriting drops the row.
- `/dashboard/settings` — edit name/phone/avatar; save persists after refresh.

### 1.10 Messages
- From a booking confirmation, open the conversation thread.
- Send a message → appears immediately (optimistic) → vendor sees it.
- **DB:** row in `messages`; `conversations.last_message_at` updates.

### 1.11 Sign out
- Avatar menu → Sign out.
- **Expect:** redirect to `/`; protected routes (`/dashboard/*`) bounce to
  `/sign-in`.

---

## 2. Vendor flow

The portal is shared between **venue owners** and **service providers**.
Run sections 2.1–2.2 once per type; the listing-specific sections (2.3–2.6)
have separate steps for each. Sections 2.7 onwards apply to both.

### 2.0 Vendor self-registration

- `/vendor/register` — 4-step wizard.
- **Step 1:** pick "Venue Owner" or "Service Provider" → maps to
  `vendor_type='venue_owner'` or `'service_provider'` server-side.
- **Step 2:** business name, location, description, and (service vendors
  only) a `service_category` (catering / photography / videography /
  decoration / dj_entertainment / makeup / planning).
- **Step 3:** account credentials (name, email, phone, password).
- **Step 4:** documents — currently optional; the upload wires to
  Storage in a follow-up.
- **Expect:** lands on `/vendor/dashboard`. New rows in `auth.users`,
  `public.users` (role=`vendor`), and `vendor_profiles` with
  `verification_status='pending'`. Until an admin approves, the vendor
  can browse the portal but listings remain in draft.

### 2.1 Vendor sign-in
- `/vendor/login` → submit credentials.
- **Expect:** if role=`vendor`, redirected to `/vendor/dashboard`.
  Customers who sign in here are signed back out.

### 2.2 Vendor dashboard (type-aware)
- `/vendor/dashboard` — labels and stat tiles flex on `vendor_type`:
  - **Venue owner:** "Active Listings", "Pending Inquiries",
    "Confirmed Bookings".
  - **Service provider:** "Active Services", "New Requests",
    "Upcoming Jobs".
- Numbers must match `listings` / `inquiries` / `bookings` filtered by
  the vendor's id.

### 2.3a Create a listing — Venue owner
- `/vendor/listings/new`.
- Form fields: title, hierarchical location cascade
  (state → city → district), address, capacity, price-per-hour,
  currency, halal-certified flag, amenities, event types.
- Save → success view; appears in `/vendor/listings` as
  `status='draft'`.
- **DB:** row in `listings` with `listing_type='venue'`, plus child
  rows in `listing_amenities` and `listing_event_types`.

### 2.3b Create a listing — Service provider
- `/vendor/listings/new-service`.
- Form fields differ from venues: title, description, base price (no
  capacity / per-hour), service category (auto-filled from the vendor
  profile but editable), event types served, optional packages.
- Save → success view; appears in `/vendor/listings` as
  `status='draft'`.
- **DB:** row in `listings` with `listing_type='service'`, plus
  `service_packages` rows when packages were added.

### 2.4 Edit a listing
- `/vendor/listings/[id]/edit` — works for both types. The form
  detects `listingType` from the loaded row and shows the relevant
  fields.
- Pre-fills via `useListing`; save updates the row.
- *Known gap:* the save handler is currently a `setTimeout` no-op (see
  `app/vendor/listings/[id]/edit/page.tsx:96`). Wire to a future
  `updateListingAction` next session.

### 2.5 Publish / pause / unpause
- `/vendor/listings` — vendor sees only their own listings, scoped to
  their type. The page header reads "Venue Listings" or "Service
  Listings" depending on `vendor_type`. The "Add" button routes to
  `/vendor/listings/new` (venue) or `/vendor/listings/new-service`
  (service).
- Click **Publish** on a draft → `status='active'`; the listing now
  appears in the public grid.
- Click **Pause** on an active listing → `status='paused'`, hidden
  from public search.
- **DB:** `listings.status` updated via `updateListingStatusAction`.

### 2.6 Manage availability — Venue owner only
- `/vendor/listings/[id]/availability` — the "Manage Availability"
  link is only rendered for `listing_type='venue'` rows. Service
  providers don't have a calendar surface; their availability is
  captured per-inquiry / per-booking instead.
- Block / unblock a date with optional reason.
- Add a manual appointment.
- **Expect:** blocked dates surface on the public booking widget; the
  customer flow rejects those dates.
- **DB:** rows in `availability_blocks` and `availability_slots`.

### 2.7 Inquiries triage
- `/vendor/inquiries` — list of incoming customer inquiries.
- For a pending row, click **Accept** → status flips to `accepted`. The
  customer's `/dashboard/inquiries` shows the new status.
- Try **Cancel** on an accepted row → only allowed transitions succeed
  (route handler enforces the state machine; disallowed targets surface a
  user-visible error like "Cannot transition from accepted to pending").

### 2.8 Bookings
- `/vendor/bookings` — list of bookings on the vendor's listings.
- Status flips (`pending` → `confirmed` → `in_progress` → `completed`) work
  via `useUpdateBookingStatus`.

### 2.9 Calendar
- `/vendor/calendar` — month view with all listings overlaid; clicking a
  date shows the day's appointments + bookings + blocks.

### 2.10 Vendor settings
- `/vendor/settings` → Business Profile tab.
- Edit business name / website / location / bio → Save.
- **Expect:** server action returns ok; `vendor_profiles` row updates;
  next page load reflects the change (re-fetched after `revalidatePath`).
- Password tab: change works through Supabase (still a mock setTimeout in
  the UI today; safe to ship as long as no one relies on it). **Known gap.**

### 2.11 Vendor documents
- Upload a document (license / halal cert / identity) via the documents
  surface (server action `uploadVendorDocumentAction`).
- **Expect:** file lands in the `documents` Storage bucket under
  `vendor/<vendorId>/...`; `vendor_documents` row created with
  `status='pending'`.

### 2.12 Sign out
- Same as customer; `/vendor/*` routes redirect to `/vendor/login` afterward.

---

## 3. Admin flow

### 3.1 Admin login
- `/admin/login` → submit credentials.
- Non-admin accounts are signed back out and shown an error.
- **Expect:** admins land on `/admin/dashboard`.

### 3.2 Admin dashboard
- `/admin/dashboard` — global counts (users, vendors, listings, inquiries,
  bookings, flagged content).
- Numbers should match `SELECT COUNT(*) FROM ...` in Supabase Studio.

### 3.3 Users
- `/admin/users` — list, search, filter by role.
- Suspend a user → `users.is_suspended=true`, suspended user can't sign in.
- Unsuspend → access restored.

### 3.4 Vendors / verification queue
- `/admin/vendors` — list of vendors with their `vendor_type` badge and
  verification status. Filter by type (`venue_owner` / `service_provider`)
  to verify both surfaces.
- For a `pending` vendor, click **Approve** → `verification_status='approved'`,
  the vendor's `users.is_verified=true`. Vendor portal now allows publishing.
- **Reject** with a reason → `verification_status='rejected'`, vendor user
  is suspended with the supplied reason.

### 3.5 Moderation queue
- `/admin/moderation` — list of `content_flags` rows.
- Resolve a flag (accept / dismiss / escalate) → status updates; flagged
  listing or review surfaces (or is hidden) accordingly.

### 3.6 Document review
- `/admin/documents` — list of pending `vendor_documents`.
- Click **View** → opens a signed URL (≤60s expiry) for the file in storage.
- **Approve** → `vendor_documents.status='approved'`; downstream verification
  badge updates on the vendor profile.
- **Reject** with a reason → status=`rejected`, vendor sees the reason in
  their settings.

### 3.7 Analytics
- `/admin/analytics` — charts for users / listings / inquiries / bookings
  by week.
- Switch the time range; chart re-renders via React Query.

### 3.8 Audit trail (sanity check)
- After approve/reject actions, verify the corresponding rows have updated
  `updated_at` timestamps and any `*_reason` columns are populated.

---

## 4. Cross-cutting checks

### 4.1 Middleware route gating
- Sign in as a customer → try `GET /vendor/dashboard` → redirected to `/`
  with a forbidden state.
- Sign in as a vendor → try `GET /admin/dashboard` → same.
- Sign out → try any of `/dashboard`, `/vendor/dashboard`, `/admin/*` →
  redirected to `/sign-in` (or `/vendor/login`, `/admin/login`).

### 4.2 RLS sanity
- Open Supabase Studio → SQL editor with a customer JWT.
- `SELECT * FROM listings WHERE status='draft'` → returns 0 rows for the
  customer (only `active` listings are public).
- Same query as the listing's vendor → returns the draft.

### 4.3 React Query cache behaviour
- Open `/dashboard/inquiries` in two browser tabs.
- In tab A, accept an inquiry from `/vendor/inquiries`.
- Tab B picks up the change after the next focus event (no realtime bridge
  yet — this is a known gap).

### 4.4 Optimistic mutations rollback
- Take the network offline → click the heart icon.
- **Expect:** UI flips immediately, then reverts when the request fails.

### 4.5 Storage cleanup
- Delete a listing → child rows cascade (photos, amenities, packages).
- The image objects themselves remain in Storage (cleanup runs on a separate
  schedule). Verify via the `listings` bucket in Supabase Studio.

---

## 5. What's still mocked / not real

These surfaces still have placeholder behaviour; flag bugs against the
remaining-work list, not the migration:

- **Photo upload** on `/vendor/listings/new` (file inputs preview only).
- **Save** on `/vendor/listings/[id]/edit` is a `setTimeout` no-op.
- **Password change** on `/vendor/settings` is a `setTimeout` no-op.
- **Notifications tab** on `/vendor/settings` does not persist preferences.
- **`is_mock` filter** is still in the query layer; admin pages opt in to
  see seeded mock rows. Will be removed when the column is dropped.

---

## 6. Recommended automation hooks

When Playwright lands, the smoke set should cover at minimum:

1. Customer sign-up → sign-in → send inquiry → see it in dashboard.
2. **Venue vendor** sign-in → publish a draft venue → it shows on `/`.
3. **Service vendor** sign-in → publish a draft service → it shows in
   the discovery grid filtered by `type=service`.
4. Vendor accept inquiry → customer sees `accepted` status.
5. Admin approve a pending vendor (one of each type) → vendor can now
   publish.
6. Admin moderate a flagged listing → listing hidden from public grid.

Anything beyond that is bonus — these six exercise every layer the Phase 2
+ Phase 3 migration touched, and both vendor variants.
