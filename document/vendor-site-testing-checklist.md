# Vendor Site — Testing Checklist

## 1. Authentication

- [ ] `/vendor/login` — Sign in with valid vendor credentials → redirects to `/vendor/dashboard`
- [ ] `/vendor/login` — Sign in with customer credentials → signed out + error shown
- [ ] `/vendor/login` — Sign in with invalid credentials → error message displayed
- [ ] `/vendor/login` — Sign in with suspended vendor → rejected with suspension reason
- [ ] `/vendor/register` — 4-step wizard flow (vendor type → business info → account → documents)
- [ ] `/vendor/register` — Step 1: pick "Venue Owner" → maps to `vendor_type='venue_owner'`
- [ ] `/vendor/register` — Step 1: pick "Service Provider" → shows service category dropdown
- [ ] `/vendor/register` — Step 2: business name, description, website (optional), location
- [ ] `/vendor/register` — Step 2: service vendors only — `service_category` field visible
- [ ] `/vendor/register` — Step 3: name, email, phone (+60 prefix), password, confirm password
- [ ] `/vendor/register` — Step 3: phone validation (Malaysian format normalization)
- [ ] `/vendor/register` — Step 4: document upload (license, halal cert, identity) → lands in `documents` Storage bucket
- [ ] `/vendor/register` — Submit → `auth.users` + `public.users` (role=vendor) + `vendor_profiles` (status=pending) created
- [ ] `/vendor/register` — After submit → lands on `/vendor/dashboard`
- [ ] Sign out → `/vendor/*` routes redirect to `/vendor/login`
- [ ] Middleware gating: unauthenticated → `/vendor/*` (except `/login`, `/register`) redirects to `/vendor/login`

## 2. Vendor Dashboard

- [ ] `/vendor/dashboard` — Venue owner: shows "Active Listings", "Pending Inquiries", "Confirmed Bookings" stats
- [ ] `/vendor/dashboard` — Service provider: shows "Active Services", "New Requests", "Upcoming Jobs" stats
- [ ] `/vendor/dashboard` — Stat numbers match actual `listings`/`inquiries`/`bookings` for that vendor
- [ ] `/vendor/dashboard` — Sidebar nav links all functional (listings, inquiries, bookings, calendar, analytics, messages, settings)
- [ ] `/vendor/dashboard` — Business name displays correctly in sidebar header

## 3. Venue Listings (Venue Owner)

### Create
- [ ] `/vendor/listings/new` — Form renders: title, location cascade (state → city → district), address, capacity, price/hr, currency, halal toggle, amenities, event types
- [ ] Fill all fields → Save → success toast/redirect → listing shows in `/vendor/listings` as `status='draft'`
- [ ] DB: row in `listings` with `listing_type='venue'` + child rows in `listing_amenities` + `listing_event_types`
- [ ] Save with missing required fields → validation errors displayed

### Edit
- [ ] `/vendor/listings/[id]/edit` — Form pre-fills with existing listing data via `useListing`
- [ ] Modify fields → Save → row updated (⚠ known gap: save handler may be no-op)
- [ ] Form detects `listing_type` and shows venue vs service fields accordingly

### List
- [ ] `/vendor/listings` — Shows only vendor's own listings
- [ ] Page header: "Venue Listings" for venue owners, "Service Listings" for service providers
- [ ] "Add" button routes to correct create page per vendor type
- [ ] Drafts, active, and paused listings all visible

### Publish / Pause / Delete
- [ ] Publish a draft → `status='active'` → listing appears in public `/venues` grid
- [ ] Pause an active listing → `status='paused'` → hidden from public search
- [ ] Unpause a paused listing → `status='active'` → visible again
- [ ] Delete a listing → listing removed from vendor's list → child rows cascade (photos, amenities, packages)
- [ ] Delete a listing → DB cleanup: `listing_photos`, `listing_amenities`, `listing_event_types`, `service_packages` removed
- [ ] Cannot delete another vendor's listing (RLS enforcement)

## 4. Service Listings (Service Provider)

### Create
- [ ] `/vendor/listings/new-service` — Form renders: title, description, base price, service category (auto-filled from profile, editable), event types, packages
- [ ] Add service packages (name, description, price, unit) → multiple packages accepted
- [ ] Add service tags → persisted to `service_tags`
- [ ] Save → `listing_type='service'` + `service_packages` rows created
- [ ] Form differs from venue: no capacity, no price-per-hour fields

### Edit & Manage
- [ ] Edit service listing → packages and tags pre-fill
- [ ] Add/remove/modify packages → save → updates reflected
- [ ] Publish/Pause/Delete same as venue listings
- [ ] Service listings appear in public grid with appropriate card variant (no capacity display)

## 5. Availability Management (Venue Owner Only)

- [ ] `/vendor/listings/[id]/availability` — "Manage Availability" link visible only for `listing_type='venue'`
- [ ] Service providers do not see availability management link
- [ ] Block a date → `availability_blocks` row created → date greyed out on public booking widget
- [ ] Unblock a date → row removed → date available again
- [ ] Block/unblock with optional reason → reason persisted
- [ ] Add manual appointment slot → `availability_slots` row created
- [ ] Calendar renders blocked dates and appointment slots visually
- [ ] Customer booking flow rejects blocked dates

## 6. Inquiries Triage

- [ ] `/vendor/inquiries` — Lists all incoming inquiries on vendor's listings
- [ ] Each inquiry card shows: venue name, location, thumbnail image, event type, guest count, date/time, special requirements
- [ ] Each inquiry card shows sender info: customer name, email (clickable), phone (WhatsApp link)
- [ ] Inquiry state machine: `pending → accepted → completed | cancelled`
- [ ] Accept a pending inquiry → status flips to `accepted` → customer sees change
- [ ] Complete an accepted inquiry → status flips to `completed`
- [ ] Cancel an inquiry from any active state → status becomes `cancelled`
- [ ] Filter tabs: All, Pending, Accepted, Completed, Cancelled — counts are accurate
- [ ] Inquiry detail shows customer info, event date/time, guest count, special requirements

## 7. Bookings Management

- [ ] `/vendor/bookings` — Lists all bookings on vendor's listings
- [ ] Bookings grouped by status (pending, confirmed, in_progress, completed, cancelled)
- [ ] Status transitions: `pending → confirmed → in_progress → completed`
- [ ] Update booking to `cancelled` → customer sees cancelled status
- [ ] Booking detail shows event date/time, guest count, total amount, service add-ons
- [ ] `totalAmount` field populated from booking creation

## 8. Calendar

- [ ] `/vendor/calendar` — Month view renders with all vendor's listings overlaid
- [ ] Color-coded dots per listing (legend visible)
- [ ] Click a date → day detail modal shows appointments + bookings + blocks
- [ ] Calendar handles multiple listings concurrently
- [ ] Month navigation (prev/next) works correctly

## 9. Messages / Conversations

- [ ] `/vendor/messages` — Conversation list renders with last message preview
- [ ] Select a conversation → message thread loads with scroll history
- [ ] Send a message → appears immediately (optimistic) → persisted to `messages` table
- [ ] New message → conversation moves to top of list → `last_message_at` updates
- [ ] Unread indicator on conversations with new messages
- [ ] Mark conversation as read → unread indicator clears
- [ ] Conversation auto-created when booking is placed

## 10. Vendor Settings

### Business Profile
- [ ] `/vendor/settings` → Business Profile tab
- [ ] Edit business name → Save → `vendor_profiles.business_name` updated → next load reflects change
- [ ] Edit website → URL validation
- [ ] Edit location → saved and reflected
- [ ] Edit business description → saved and reflected

### Account
- [ ] Edit name → `users.name` updated
- [ ] Edit phone → `users.phone` updated (Malaysian format)
- [ ] Password change (⚠ known gap: may be setTimeout no-op)

### Documents
- [ ] Upload document → file lands in `documents` Storage bucket under `vendor/<vendorId>/...`
- [ ] `vendor_documents` row created with `status='pending'`
- [ ] Multiple document types: license, halal cert, identity
- [ ] Document list shows verified/pending/rejected status

### Notifications
- [ ] Notifications tab visible (⚠ known gap: does not persist preferences)

## 11. Analytics

- [ ] `/vendor/analytics` — Page renders with time period selector
- [ ] Default period shows relevant vendor metrics
- [ ] Switch time period → data re-fetches via React Query
- [ ] Charts render: listing views, inquiries, bookings by time period
- [ ] Traffic sources section displays
- [ ] Recent activity log visible

## 12. Photos

- [ ] Upload photos on listing create/edit → multipart upload to `listings` Storage bucket (⚠ known gap: preview only on create)
- [ ] Max 10MB per file
- [ ] Max 10 files per request
- [ ] First photo auto-set as primary
- [ ] Reorder photos
- [ ] Delete a photo
- [ ] Primary photo displays on venue card and detail page

## 13. Cross-Cutting & Security

- [ ] RLS: vendor can only see/edit their own listings
- [ ] RLS: vendor can only see inquiries/bookings on their own listings
- [ ] RLS: vendor cannot access another vendor's messages
- [ ] Middleware: customer cannot access `/vendor/*` routes
- [ ] Middleware: admin cannot perform vendor actions on behalf of a vendor
- [ ] Suspended vendor: sign-in rejected with message
- [ ] Pending vendor (not yet admin-approved): can create listings but cannot publish
- [ ] Approved vendor: can publish listings that appear in public search
- [ ] `isMock` flag does not leak mock data to real vendor views

---

## Test Accounts (configure in Supabase Studio)

| Persona | Email | vendor_type | Status |
|---------|-------|-------------|--------|
| Venue vendor (approved) | `venue1@test.local` | `venue_owner` | approved |
| Venue vendor (pending) | `pending@test.local` | `venue_owner` | pending |
| Service vendor (approved) | `service1@test.local` | `service_provider` | approved |
| Customer | `customer@test.local` | — | verified |
| Admin | `admin@test.local` | — | admin |
