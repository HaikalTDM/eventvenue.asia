# EventVenue.Asia — Session Handoff

## Project Overview

AI-powered event venue marketplace for Southeast Asia (Malaysia-first). Connects customers looking for event venues with venue owners and service providers (catering, photography, DJ, etc.). Halal verification is a key differentiator.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 4  
**Brand Color:** `#EB4D4B` (coral red)  
**Font:** Inter (Google Fonts)  
**Backend:** None yet — entirely mock data and localStorage

---

## What Has Been Done

### Customer Portal (UI Complete)
- Homepage with hero search (location, date, capacity, halal filter)
- Venue browsing with grid view + sidebar filters (amenities, event types, halal)
- Venue detail page: image gallery (large banner), amenities, availability calendar + location map (side by side, full width), reviews, FAQs, booking card, related venues
- Venue comparison (up to 3 side-by-side with "Best" highlights)
- Inquiry form modal (date, time, guest count, requirements)
- Inquiry tracking dashboard with status filters and "Accept Quote" action
- Favorites/wishlist with localStorage persistence
- Customer sign-in/sign-up with role toggle ("Planning an event" / "I'm a vendor" → redirects to vendor registration)
- "List Your Venue" application form with success state
- Responsive navigation with mobile menu
- "How it Works" section
- 404 page
- Custom loading screen animation (full-screen with brand animation, expanding rings, bouncing dots)
- Route-level loading states for all major pages

### Vendor Portal (UI Fully Interactive)
- **Registration:** Multi-step vendor registration (account type → business info → personal details → document upload)
- **Login:** Demo accounts with "Register here" link
- **Dashboard:** Stats cards (venue vs service provider views), verification badge, quick tips
- **Listings:**
  - View all listings with status badges (Active/Paused)
  - "Add Venue" button → full creation form (basic info, event types, amenities, halal toggle, photos, contact)
  - "Add Service" button → full creation form (info, category, packages with pricing/unit, tags, portfolio photos)
  - "Edit" button → pre-populated edit form for existing venues
  - "Manage Availability" button → interactive calendar to block/unblock dates
  - "Pause/Unpause" toggle with visual state change
- **Inquiries:**
  - Status filters (All / New / Responded / Quoted)
  - Inline "Respond" form with message textarea
  - Inline "Send Quote" form with amount, validity period, and notes
  - Status updates on action (sent → responded → quoted)
- **Bookings:** Grouped by status (pending, confirmed, in progress, completed, cancelled)
- **Analytics:** Hardcoded metrics, traffic sources, recent activity
- **Sidebar navigation:** Role-based display with vendor info and sign out

### Data Layer
- 8 fully detailed mock venues (Malaysia, Singapore, Bangkok, Jakarta)
- 8 mock customer inquiries with various statuses
- 5 mock vendor users (2 venue owners, 3 service providers)
- 3 mock services, 6 mock vendor bookings
- Full TypeScript type system (`lib/types.ts`)

---

## What Needs To Be Done — UI First

### Priority 1 — Remaining UI Pages

- [ ] **Vendor Profile/Settings page** — Edit business profile, change password, notification preferences
- [ ] **Messaging/Chat UI** — Conversation thread between customer and vendor (inbox + chat view)
- [ ] **Booking Confirmation flow** — Customer accepts quote → booking confirmed → summary screen
- [ ] **Forgot Password page** — Email input → success message UI
- [ ] **Social login buttons** — Currently UI-only (Google, Apple), keep as mock

### Priority 2 — Admin Dashboard (Not Started)

- [ ] Admin login / layout with sidebar
- [ ] Vendor approval workflow (pending vendors list, approve/reject actions)
- [ ] User management (list customers, vendors, search, suspend)
- [ ] Content moderation (flagged reviews, reported listings)
- [ ] Platform analytics (total users, bookings, revenue charts — hardcoded)
- [ ] Document verification UI (view uploaded halal certs, business licenses, approve/reject)

### Priority 3 — UI Polish & Gaps

- [ ] Error boundaries / error states for failed loads
- [ ] Empty states for all pages (consistent design)
- [ ] SEO metadata improvements (per-page titles, descriptions, OG tags)
- [ ] Skeleton loading states for individual components (cards, lists)
- [ ] Mobile responsiveness audit and fixes
- [ ] Accessibility audit (ARIA labels, keyboard navigation, focus states)

---

## Backend (To Be Confirmed)

> Backend implementation will be planned separately. Below is a reference of what's needed when ready.

- Set up database (PostgreSQL) with schema/migrations
- Implement real authentication (NextAuth or similar, JWT)
- Create API routes / server actions for all CRUD operations
- Replace all mock data with database queries
- Environment variables and `.env` setup
- Real search (MeiliSearch or similar)
- File/image upload for venue photos
- Payment gateway (FPX, credit card, e-wallets) — Phase 2
- Real-time messaging — Phase 2
- Reviews system (post-booking, verified) — Phase 2

---

## Key Files Reference

| Path | Purpose |
|------|---------|
| `app/page.tsx` | Homepage |
| `app/venues/[id]/page.tsx` | Venue detail (SSG) |
| `app/compare/page.tsx` | Venue comparison |
| `app/dashboard/` | Customer dashboard (overview, inquiries, favorites) |
| `app/vendor/` | Vendor portal (all pages) |
| `app/vendor/register/page.tsx` | Multi-step vendor registration |
| `app/vendor/listings/new/page.tsx` | Add Venue form |
| `app/vendor/listings/new-service/page.tsx` | Add Service form |
| `app/vendor/listings/[id]/edit/page.tsx` | Edit Venue form |
| `app/vendor/listings/[id]/availability/page.tsx` | Manage Availability calendar |
| `app/(auth)/` | Sign-in / sign-up pages |
| `components/LoadingScreen.tsx` | Custom loading animation |
| `components/` | All UI components |
| `lib/types.ts` | TypeScript types |
| `lib/mock-data.ts` | 8 mock venues, inquiries, filter options |
| `lib/vendor-data.ts` | Mock vendors, services, bookings |
| `lib/auth.tsx` | Customer auth context (localStorage) |
| `lib/vendor-auth.tsx` | Vendor auth context (localStorage) |
| `lib/favorites.tsx` | Favorites context (localStorage) |

---

## Notes
- All auth is fake (localStorage only). No password hashing, no sessions.
- Vendor demo accounts exist for testing the portal UI.
- The app is a **frontend-only prototype** — polished UI but no real data persistence.
- Custom loading animations added with CSS keyframes (no external animation library).
- Tailwind CSS v4 is used (CSS-based config in `globals.css`, no `tailwind.config.js`).
- Next major milestone: complete remaining UI pages, then connect a real backend.
