# Testing Guide: Sign-Up Walkthrough Per Role

This guide walks through how to create real accounts in your local dev
environment for each of the four roles: **admin**, **customer**, **venue
vendor**, and **service vendor**. All flows use the live API (not mock
mode) so the data lands in your real Postgres.

---

## Prerequisites (do this once)

### 1. Database connection

`.env` already has a `DATABASE_URL`. Confirm it points at the database you
want to test against (Supabase dev project or local Postgres). To use the
local Docker DB instead:

```powershell
docker compose up -d postgres
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/eventvenue
```

### 2. Apply the schema changes

The Phase A schema added two tables (`email_verifications`,
`password_resets`). The project doesn't have a versioned migration history
yet, so apply schema changes by diffing directly against the live DB:

```powershell
npx drizzle-kit push
```

This compares `lib/db/schema/index.ts` to the database connected via
`DATABASE_URL` and applies only what's missing. On a fresh DB it creates
every table; on a DB that's already seeded it adds only the two new
tables.

> A versioned migration workflow (`drizzle-kit generate` +
> `drizzle-kit migrate`) will be set up properly in a later phase, once
> the prod DB is on its own connection string distinct from dev.

### 3. Set verification gate to OFF (for now)

Until Resend is configured, leave email verification disabled so signups
can sign in immediately. Open `.env` and confirm:

```
EMAIL_VERIFICATION_REQUIRED=false
```

When you flip this to `true` later, every credentials signup will be
forced to click a verify link before signing in. The link still gets
generated either way; if Resend is missing it just prints to your dev
terminal instead of being delivered.

### 4. Force live mode (skip the mock toggle)

The app defaults to **live** but the `/kael` page lets anyone toggle to
mock mode, which writes to localStorage instead of your DB. To stay in
live mode while testing:

- Open the browser, go to `http://localhost:3000/kael`, set the toggle
  to **Live**. It persists in localStorage.
- Or, in DevTools console: `localStorage.setItem('ev_data_mode', 'live')`

### 5. Start the dev server

```powershell
npm run dev
```

Watch the terminal — verification and reset emails are printed there
when Resend isn't configured.

---

## Role 1 — Admin (you)

Admins are bootstrapped via CLI. They skip email verification and can sign
in immediately. There is no `/admin/sign-up` page by design (admins are
trusted, not self-served).

### Create your admin account

```powershell
npm run create:admin -- --email haikaltdm46@gmail.com --name "Haikal"
```

You'll be prompted for a password (hidden input, min 8 chars). To pipe a
password without prompting (CI use only):

```powershell
$env:EV_ADMIN_PASSWORD="your-strong-pw"; npm run create:admin -- --email haikaltdm46@gmail.com --name "Haikal"
Remove-Item Env:\EV_ADMIN_PASSWORD
```

The script either creates a new user with `role=admin, isVerified=true,
isMock=false`, or upgrades an existing user with that email to admin. To
also reset the password on an upgrade, add `--reset-password`.

### Sign in as admin

1. Visit `http://localhost:3000/sign-in`
2. Enter `haikaltdm46@gmail.com` and the password you set
3. After sign-in, navigate to `http://localhost:3000/admin`

### What admin can do

| Page | What it shows |
| --- | --- |
| `/admin/dashboard` | Platform stats |
| `/admin/users` | All users; suspend/reactivate |
| `/admin/vendors` | Pending vendor applications; approve/reject |
| `/admin/documents` | Vendor document review |
| `/admin/moderation` | Flagged content queue |
| `/admin/analytics` | Aggregate platform metrics |

> **Note:** Admins bypass the email-verification gate even when
> `EMAIL_VERIFICATION_REQUIRED=true`.

---

## Role 2 — Customer

Customers self-serve via the public sign-up page. Use **Gmail plus
aliases** so every test account lands in your real inbox.

### Sign up

1. Visit `http://localhost:3000/sign-up`
2. Make sure the role toggle at the top says **I'm planning an event**
3. Fill in the form:
   - **Full name:** `Test Customer 1`
   - **Email:** `haikaltdm46+cust1@gmail.com` (Gmail treats this as
     `haikaltdm46@gmail.com` — change `cust1` per test account)
   - **Phone:** `12 345 6789` (the +60 prefix is added automatically)
   - **Password:** any 8+ chars
   - **Confirm password:** same
   - Tick the terms checkbox
4. Click **Create Account**

### Behaviour with verification gate OFF (default)

You're signed in immediately. A welcome email is logged in the dev
terminal:

```
[email:console] welcome
  to:      haikaltdm46+cust1@gmail.com
  subject: Welcome to EventVenue.Asia
  (RESEND_API_KEY not set — email not delivered)
```

You land on the homepage as an authenticated customer.

### Behaviour with verification gate ON

Set `EMAIL_VERIFICATION_REQUIRED=true` in `.env`, restart `npm run dev`,
then sign up again with a different alias (e.g. `+cust2`).

The signup request returns `{ requiresVerification: true }`. The current
sign-up UI will treat this as a non-success and show the error
"Could not create account. The email may already be in use." That's a
known UI gap — the account **was** created, it just can't sign in until
verified. To verify it:

1. Open the dev terminal where `npm run dev` is running. Find the line:
   ```
   [email:console] verify-email (signup)
     to:      haikaltdm46+cust2@gmail.com
     link:    http://localhost:3000/verify-email?token=...
   ```
2. Copy the link and paste it into your browser.
3. The page confirms the email was verified. Click **Sign in** and use
   the credentials you registered.

### What customer can do

| Page | What it shows |
| --- | --- |
| `/` | Homepage with search and AI Smart Planner |
| `/venues` | Browse and filter venues |
| `/venues/[id]` | Venue detail, photos, reviews, inquiry form |
| `/compare` | Side-by-side compare of up to 3 venues |
| `/dashboard` | Customer home (your inquiries, bookings, favourites) |
| `/dashboard/inquiries` | Track inquiry status |
| `/dashboard/favorites` | Saved venues |
| `/dashboard/messages` | Direct chat with vendors |
| `/dashboard/settings` | Profile and password change |

### Test the forgot-password flow

1. Sign out (top-right user menu).
2. Visit `/sign-in`, click **Forgot password?**
3. Enter `haikaltdm46+cust1@gmail.com`, click **Send Reset Link**
4. UI says "Check your email" regardless of whether the email exists
   (anti-enumeration). Look at the dev terminal:
   ```
   [email:console] password reset
     link:    http://localhost:3000/reset-password?token=...
   ```
5. Open the link, set a new password (min 8 chars), confirm.
6. After success you're redirected to `/sign-in`. Use the new password.

> **Reset tokens expire in 60 minutes. Verification tokens last 24 hours.
> Both are single-use.**

---

## Role 3 — Vendor (Venue Owner)

Venue vendors register through a dedicated multi-step flow. They land in
`verificationStatus: "pending"` and need an admin to approve them before
their listings become visible.

### Sign up

1. Visit `http://localhost:3000/sign-up`
2. Switch the role toggle to **I'm a vendor**
3. Click **Continue to Vendor Registration** (sends you to
   `/vendor/register`)
4. Step 1 — Vendor type: choose **Venue Owner**
5. Step 2 — Business details:
   - **Business name:** `Test Venue Co.`
   - **Description:** any text
   - **Website:** `https://example.com` (optional, but if filled must be
     a valid URL)
   - **Location:** `Kuala Lumpur, Malaysia`
6. Step 3 — Account details:
   - **Full name:** `Venue Owner 1`
   - **Email:** `haikaltdm46+venue1@gmail.com`
   - **Phone:** `12 111 1111`
   - **Password:** 8+ chars
7. Step 4 — Document uploads (optional in dev; in prod this requires R2)
8. Submit

The form posts to `POST /api/v1/vendors/register`, which atomically
creates a `users` row (`role=vendor`) and a `vendor_profiles` row
(`vendorType=venue_owner`, `verificationStatus=pending`). You're signed
in immediately and routed to `/vendor/dashboard`, but listings you create
won't be public until the verification status flips to `approved`.

> **Email-verification gate behaviour:** the vendor register route
> currently does NOT honour the verification gate (it issues tokens
> unconditionally). That's intentional for now — vendor onboarding will
> be fully hardened in Phase C. Customers are the only role gated by
> `EMAIL_VERIFICATION_REQUIRED` right now.

### Approve the vendor (as admin)

In a different browser (or after signing out), sign in as your admin:

1. Visit `/admin/vendors`
2. Find `Test Venue Co.` in the **Pending** list
3. Click **Approve**
4. The status flips to `approved` and `verificationBadge: verified`

Now switch back to the vendor browser and refresh — listings created
from this vendor will be visible to customers.

### Create a venue listing

1. As the venue vendor, visit `/vendor/listings/new`
2. Fill in title, description, location, capacity, price per hour,
   currency, halal certification, amenities, event types
3. Save as draft, then publish

### What venue vendor can do

| Page | What it shows |
| --- | --- |
| `/vendor/dashboard` | Listing performance overview |
| `/vendor/listings` | All your listings |
| `/vendor/listings/new` | Create a new venue listing |
| `/vendor/listings/[id]/edit` | Edit existing listing |
| `/vendor/listings/[id]/availability` | Block dates, schedule appointments |
| `/vendor/inquiries` | Customer inquiries to respond to |
| `/vendor/bookings` | Confirmed bookings |
| `/vendor/calendar` | Availability calendar |
| `/vendor/messages` | Direct chat with customers |
| `/vendor/analytics` | Listing views, response rate, revenue |
| `/vendor/settings` | Business profile and payout |

---

## Role 4 — Vendor (Service Provider)

Identical flow to the venue vendor, with two differences:

1. In step 1 of `/vendor/register`, choose **Service Provider**.
2. The form asks for a **Service category** (catering, photography,
   decoration, dj_entertainment, planning, etc.) — pick whichever you
   want to test.

### Sign up

- Email alias: `haikaltdm46+svc1@gmail.com`
- Business name: e.g. `Test Catering Co.`
- Vendor type: **Service Provider**
- Service category: `catering`
- Everything else: same as venue vendor

After signup the user has `role=vendor` and the profile has
`vendorType=service_provider, verificationStatus=pending`. Approval
flow is the same — admin approves at `/admin/vendors`.

### Create a service listing

Service vendors create listings at `/vendor/listings/new-service`. The
form differs from venue listing in that:

- No capacity / price-per-hour fields
- Add **service packages** (e.g. Silver / Gold / Platinum) with prices
- Add **service tags** for search

### Quick reference

| Vendor sub-type | Registration step 1 | Listing creation page |
| --- | --- | --- |
| Venue Owner | Pick "Venue Owner" | `/vendor/listings/new` |
| Service Provider | Pick "Service Provider" + category | `/vendor/listings/new-service` |

Both share the same dashboard, inquiries, bookings, calendar, and
messages pages.

---

## Full end-to-end test scenario

Run this once to confirm the whole pipeline works against your real DB.

1. **Create admin** — `npm run create:admin -- --email haikaltdm46@gmail.com --name "Haikal"`
2. **Create venue vendor** in browser A — `/vendor/register` as
   `haikaltdm46+venue1@gmail.com`
3. **Create service vendor** in browser A (after signing out) —
   `haikaltdm46+svc1@gmail.com`, category `catering`
4. **Create customer** in browser A (after signing out) —
   `haikaltdm46+cust1@gmail.com`
5. **Sign in as admin** in browser B — go to `/admin/vendors`, approve
   both vendors
6. **Switch to venue vendor** in browser A — `/vendor/listings/new`,
   create one venue listing, publish
7. **Switch to service vendor** in browser A —
   `/vendor/listings/new-service`, create one catering package, publish
8. **Switch to customer** in browser A — `/venues`, find the new venue,
   click into it, submit an inquiry
9. **Switch to venue vendor** — `/vendor/inquiries`, accept the inquiry
10. **Switch back to customer** — `/dashboard/inquiries`, see status
    change to `accepted`

If all 10 steps work, the auth + data layer is functioning end-to-end
with real persistence.

---

## Troubleshooting

### "Could not create account. The email may already be in use."

Three possible causes:

1. **Email actually exists.** Try a different `+alias`.
2. **Verification gate is on and the response confirms `requiresVerification: true`.** The current sign-up UI doesn't yet handle this code path correctly. Workaround: leave `EMAIL_VERIFICATION_REQUIRED=false` in `.env` for now.
3. **Phone field empty.** It's required since Phase A. The form has `required` on the input but if you bypass it, the API will reject.

### "Invalid email or password"

- Wrong password.
- Email exists but was created via Google OAuth (no password). Use Google to sign in.
- User is suspended (`isSuspended=true` in `users` table).

### "Please verify your email before signing in."

Verification gate is on and the user hasn't clicked the verify link.
Either flip `EMAIL_VERIFICATION_REQUIRED=false` in `.env` (and restart
dev server) or grab the link from the dev terminal where `npm run dev`
is running.

### Verification / reset email doesn't arrive

Expected behaviour without Resend. The email is **logged to the dev
terminal**, not delivered. Check the terminal that's running
`npm run dev` for a block like:

```
[email:console] verify-email (signup)
  to:      ...
  link:    http://localhost:3000/verify-email?token=...
  (RESEND_API_KEY not set — email not delivered)
```

Copy the link and paste it into your browser.

### Google sign-in shows yellow notice

Expected. `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=false` until the client
provides Google Cloud OAuth credentials.

### Mock data shows up in browse

The `/kael` page may have been switched to **mock** mode. Open it and
toggle to **live**, or clear the `ev_data_mode` localStorage key.

### Drizzle migration fails

Check that `DATABASE_URL` resolves and the user has CREATE TABLE
permission. For Supabase, use the **pooler** URL on port 6543, not the
direct port 5432 (which often blocks IPv4 from Windows).

---

## When the client unblocks Resend and Google

You won't need to change any code. Just update `.env.production.local`
(or `.env` for local testing):

| Env var | Effect |
| --- | --- |
| `RESEND_API_KEY=re_xxx` | Verify/reset/welcome emails actually deliver |
| `RESEND_FROM=EventVenue.Asia <noreply@eventvenue.asia>` | Sender address (only takes effect after the domain is verified in Resend) |
| `EMAIL_VERIFICATION_REQUIRED=true` | Force every new credentials signup to verify before sign-in (admins exempt) |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google OAuth start route returns 503 until both are set |
| `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true` | Google button starts the OAuth flow instead of showing the notice |

After flipping these, restart the dev server (or redeploy in
production) for them to take effect.

---

## Quick reference: test emails to use

| Role | Email | Notes |
| --- | --- | --- |
| Admin | `haikaltdm46@gmail.com` | Created via CLI, no email sent |
| Customer | `haikaltdm46+cust1@gmail.com`, `+cust2`, ... | One real inbox via Gmail aliases |
| Venue vendor | `haikaltdm46+venue1@gmail.com` | Same alias trick |
| Service vendor | `haikaltdm46+svc1@gmail.com` | Same alias trick |

Gmail ignores everything after the `+` so all of these route to your
real `haikaltdm46@gmail.com` inbox. Once Resend is verified, the
verification and reset emails will land there for you to click.
