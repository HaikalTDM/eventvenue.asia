# Session Handoff: Phase 3 Migration Complete

**Date:** 2026-05-28
**Working dir:** `C:\Projects\eventvenue-production` (branch: `production`)
**Build status:** `npm run build` green (Compiled successfully in ~6s)

---

## TL;DR

Phase 1 (Supabase data layer) and Phase 2 (auth + queries + actions +
storage) were completed previously. This session finished Phase 3:
every customer-facing form, vendor portal form, and admin surface is now
wired to React Query hooks or server actions. The legacy `lib/api.ts`
fetch wrapper, `lib/favorites.tsx` context, `lib/mock-data.ts`,
`lib/vendor-data.ts`, and `lib/data-mode.tsx` have all been removed.
`lib/api.ts` survives only as a types module so hooks/pages share a
single response shape.

Working tree is dirty — none of this work has been committed yet.
Build is verified green. The remaining work is cleanup of the auth
compat shims, RLS migration runner, and polish (a11y / E2E).

---

## What landed this session

### Phase 3 form migrations

- **`components/InquiryFormModal.tsx`** — switched the manual fetch to
  `useCreateInquiry` from `hooks/use-inquiries.ts`. Loading state now
  comes from the mutation's `isPending`; cache invalidation flows
  through React Query so the customer dashboard and vendor inquiries
  list both refresh on success.
- **`components/BookingCard.tsx`** — replaced the `setTimeout` mock
  with `useCreateBooking`. Confirms via `mutateAsync`, redirects to
  `/dashboard` on success, and gates anonymous clicks to `/sign-in`.
- **`components/VenueCard.tsx`** — heart icon now reads with
  `useIsFavorited` and writes with `useToggleFavorite` (both from
  `hooks/use-favorites.ts`). The legacy `lib/favorites.tsx` context
  and its `<FavoritesProvider>` wrapper are deleted; `app/layout.tsx`
  no longer mounts it.
- **`app/vendor/listings/page.tsx`** — publish/pause/unpause buttons
  now call `updateListingStatusAction` from `lib/actions/listing.ts`
  instead of the route handler.
- **`app/vendor/listings/[id]/edit/page.tsx`** — listing detail load
  switched from `getListingDetail` to `useListing`. State is hydrated
  from the React Query cache via a `useEffect` on the returned data.
- **`app/vendor/listings/[id]/availability/page.tsx`** — same swap;
  `useListing` replaces the bespoke `getListingDetail` loader.
- **`app/vendor/settings/page.tsx`** — business profile save now calls
  `updateVendorProfileAction` from `lib/actions/vendor-profile.ts`.
  The mock `setTimeout` is gone; profile errors surface inline.
- **`app/compare/page.tsx`** — list and favorites both read through
  hooks (`useListings`, `useFavorites`); selection seeds once from
  localStorage / favorites on first data, then is user-driven.

### Cleanup

- **Deleted** `lib/favorites.tsx`, `lib/mock-data.ts`,
  `lib/vendor-data.ts`, `lib/data-mode.tsx`.
- **Trimmed** `lib/api.ts` to types only (`ApiListing`,
  `ApiListingDetail`, `ApiInquiry`, etc.). The fetch helpers
  (`getListings`, `createInquiry`, `addFavorite`, ...) are gone — every
  consumer now imports from `hooks/*` or `lib/actions/*`.
- **`app/kael/page.tsx`** — replaced the live/mock data toggle with a
  static "Live" indicator and a deprecation note. Page-visibility
  toggles still work.

---

## Remaining work

### Auth compat shims (low priority)

`lib/auth.tsx` and `lib/vendor-auth.tsx` still exist as compat shims
that re-export the new `<AuthProvider>` with the legacy method shapes
(`signIn`, `login`, `updateProfile`, ...). 14 files still import from
these paths. Migrating them in a follow-up session is mechanical:

```
# Customer-facing
app/page.tsx, app/dashboard/layout.tsx, app/dashboard/settings/page.tsx
components/StickyNav.tsx
components/{InquiryFormModal,BookingCard,VenueCard}.tsx
app/compare/page.tsx

# Vendor-facing
app/vendor/{layout,page,login,settings,bookings,dashboard,analytics}/page.tsx
app/vendor/listings/page.tsx
components/VendorPortalLayout.tsx
```

Plan: replace every `useAuth` from `@/lib/auth` with the new context
from `@/lib/auth/provider`, and replace `useVendorAuth().vendor` /
`vendor.vendorName` etc. with `useAuth().user` accesses keyed off
`role === "vendor"`. Delete both shim files once empty.

### Migrations + DB

- **Drizzle vs manual SQL:** `lib/db/migrations/0000_flowery_luckman.sql`
  is Drizzle-generated; the manual `lib/db/migrations/manual/0001..0011_*.sql`
  files cover extensions, triggers, RLS, storage policies. Build a
  runner script that applies them in order before the next prod deploy.
- **`is_mock` columns:** every list query in `lib/db/queries/*` defaults
  to `includeMock=false`. Admin surfaces flip it on. Once the column is
  dropped via a final migration, delete the `includeMock` plumbing.

### Polish

- Accessibility / Lighthouse pass on the public pages.
- Set up Playwright + write the smoke E2E suite (sign-in, search,
  inquiry submit, vendor approve, admin moderate).

---

## Known caveats / gotchas

- **Optimistic mutations:** favorites toggle and message send both use
  optimistic updates with rollback on error. They don't share state
  across tabs; a TanStack `Realtime` bridge would close that gap.
- **`lib/auth.tsx` `updateProfile`:** the shim writes to
  `/api/v1/users/me` (PATCH) and then calls `refresh()` on the new
  context. If a settings save appears not to persist, check that the
  consumer is on the shim and not calling Supabase directly.
- **`compare` page:** seeds the comparison slots once from
  localStorage (`ev_mock_favorites`) before falling back to
  `useFavorites()`. The localStorage key was kept for back-compat with
  bookmarks shared during demos; it can be removed when E2E lands.

---

## Quick orientation commands

```powershell
# Confirm git state and recent activity
git -C C:\Projects\eventvenue-production status
git -C C:\Projects\eventvenue-production log --oneline -10
git -C C:\Projects\eventvenue-production diff --stat HEAD

# Re-verify the build
cd C:\Projects\eventvenue-production
npm run build

# Look for any stragglers still pointing at the legacy auth shim
findstr /s /i "from \"@/lib/auth\"" components app
findstr /s /i "from \"@/lib/vendor-auth\"" components app
```

Expected current branch state:

```
* production    e14d8b6 chore(prod): add production deployment config
  master        633a71f docs: rewrite README ...
```

Working tree shows ~85 modified files and ~15 untracked dirs (the
`hooks/`, `lib/actions/`, `lib/auth/`, `lib/db/queries/`,
`lib/db/migrations/`, `lib/storage/`, `lib/query-provider.tsx`,
`middleware.ts`, `app/auth/callback/`, `app/api/v1/auth/me/`,
`app/api/v1/users/`, `SUPABASE_SETUP.md`).

---

## Stack reference

- **Framework:** Next.js 15.5.18 (App Router, Turbopack in dev)
- **Runtime:** React 19.1.0, Node 20+
- **DB:** Supabase Postgres via Drizzle ORM 0.45.2 + `postgres` 3.4
- **Auth:** Supabase Auth via `@supabase/ssr`
- **Data layer:** TanStack Query 5.62 (React Query)
- **Validation:** Zod 4
- **Storage:** Supabase Storage (3 buckets: listings, avatars, documents)
- **Infra targets:** Supabase (DB + Auth + Storage + Realtime), Cloudflare
  R2 (legacy, optional), Upstash Redis, Pusher, Resend, Sentry, Axiom

---

## Original Phase 1 deployment notes

The original handoff covered the production clone setup, Docker config,
security headers, and deploy runbook. Those steps are still valid — see
`DEPLOYMENT.md` for Vercel / Docker / self-hosted options and
`.env.production.example` for the secrets template. The deploy story
itself has not changed; only the application surface area has grown.
