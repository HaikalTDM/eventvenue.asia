# Supabase Setup — Phase 1 Infrastructure

This guide walks through provisioning Supabase, applying the schema, and locking
down access with RLS. Follow it once per environment (local, staging, prod).

After completing every step, the app still runs against `lib/mock-data.ts`. The
backend wiring happens in Phase 2.

> Time to complete: ~25 minutes. Most of that is waiting for the project to
> spin up. The actual hands-on work is small.

---

## 1. Install prerequisites

```powershell
# Supabase CLI (one-off, global)
npm install -g supabase

# Project deps with the new Supabase packages
npm install
```

Verify:

```powershell
supabase --version   # should print 1.x or 2.x
node -v              # 20.x or 22.x
```

---

## 2. Create the Supabase project (cloud)

1. Go to https://supabase.com/dashboard, sign in, click **New project**.
2. Pick a region close to your users. For Malaysia / SE Asia, **ap-southeast-1**
   (Singapore) is the right call.
3. Set a strong database password and store it in your password manager — you
   cannot recover it later, only reset it.
4. Wait ~2 minutes for the project to provision.

Once it's ready, grab these from **Project Settings**:

| Where in dashboard                            | Goes into env var               |
| --------------------------------------------- | ------------------------------- |
| Settings → API → Project URL                  | `NEXT_PUBLIC_SUPABASE_URL`      |
| Settings → API → `anon` public key            | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Settings → API → `service_role` secret key    | `SUPABASE_SERVICE_ROLE_KEY`     |
| Settings → Database → Connection string (pooled, port 6543) | `DATABASE_URL` |
| Settings → Database → Connection string (direct, port 5432) | `DIRECT_URL`   |

Copy `.env.example` to `.env.local` and paste those values in.

---

## 3. Apply the Drizzle schema

Drizzle owns the table definitions in `lib/db/schema/index.ts`. Generate and
apply the initial migration through `drizzle-kit`. This connects via
`DIRECT_URL` (port 5432) — the pooler can't run DDL.

```powershell
# Generate the SQL migration from the current schema
npx drizzle-kit generate

# Inspect lib/db/migrations/<timestamp>_*.sql before applying
# Then push it to the database
npx drizzle-kit migrate
```

> **Important — strip auth-schema lines from the generated file before running migrate.**
> Drizzle declares a slim reference to `auth.users` so it can build the foreign
> key from `public.users.id`. When generating, it doesn't know Supabase already
> owns that schema, so it emits two lines that will fail on Supabase:
>
> ```sql
> CREATE SCHEMA "auth";
> CREATE TABLE "auth"."users" ( "id" uuid PRIMARY KEY NOT NULL );
> ```
>
> Open `lib/db/migrations/0000_*.sql`, **delete those two statements** (and
> their `--> statement-breakpoint` lines), keep the `ALTER TABLE "users" ADD
> CONSTRAINT … REFERENCES "auth"."users"…` line lower in the file, then run
> `npx drizzle-kit migrate`. The FK resolves against Supabase's existing
> `auth.users` table.

After this completes, every table from `lib/db/schema/index.ts` exists in the
`public` schema, with all indexes, foreign keys, and check constraints.

> If you see `relation "auth.users" does not exist`, you targeted a non-Supabase
> Postgres. The migration assumes Supabase Auth has already created `auth.users`.

---

## 4. Apply the manual SQL migrations

These add behavior Drizzle can't express: triggers, RLS policies, storage
buckets. They live in `lib/db/migrations/manual/` and run in numeric order.

```powershell
# Run each file against DIRECT_URL using psql.
# Replace the connection string with your own DIRECT_URL value.
$DIRECT = $env:DIRECT_URL

psql $DIRECT -f lib/db/migrations/manual/0001_extensions.sql
psql $DIRECT -f lib/db/migrations/manual/0002_triggers.sql
psql $DIRECT -f lib/db/migrations/manual/0003_auth_bridge.sql
psql $DIRECT -f lib/db/migrations/manual/0004_rls_enable.sql
psql $DIRECT -f lib/db/migrations/manual/0005_rls_helpers.sql
psql $DIRECT -f lib/db/migrations/manual/0006_rls_policies_users.sql
psql $DIRECT -f lib/db/migrations/manual/0007_rls_policies_listings.sql
psql $DIRECT -f lib/db/migrations/manual/0008_rls_policies_transactions.sql
psql $DIRECT -f lib/db/migrations/manual/0009_rls_policies_messaging.sql
psql $DIRECT -f lib/db/migrations/manual/0010_rls_policies_misc.sql
psql $DIRECT -f lib/db/migrations/manual/0011_storage_buckets.sql
```

No `psql` installed? Open the **SQL Editor** in the Supabase dashboard, paste
each file's contents, and click Run. Same effect.

---

## 5. Configure Supabase Auth

In the dashboard:

1. **Authentication → Providers → Email**: enable. Toggle "Confirm email" on
   so signup requires verification (matches `is_verified` flow).
2. **Authentication → Providers → Google** (optional): enable, paste your
   Google OAuth client ID + secret. Authorised redirect URI is
   `https://[PROJECT-REF].supabase.co/auth/v1/callback`.
3. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (dev) or `https://eventvenue.asia` (prod)
   - Redirect URLs: add both, plus any preview deploy domains
4. **Authentication → Email Templates**: edit the confirmation, magic-link,
   and recovery templates so the link uses your app domain. The default
   placeholder is `{{ .SiteURL }}/auth/callback`.

For email delivery, Supabase ships with a built-in sender that's fine for dev
and low-volume staging. Production traffic should eventually move to a
verified-domain sender (Resend, SES, etc.) under **Authentication → SMTP**, but
that's optional and not part of Phase 1.

---

## 6. Verify the setup

Sanity checks before moving on. Each takes seconds.

### a. Schema is in place

```powershell
psql $DIRECT -c "select count(*) as table_count from information_schema.tables where table_schema = 'public';"
```

Expect ~25 tables (users, vendor_profiles, listings, photos, amenities,
event_types, packages, tags, availability_blocks, availability_slots,
inquiries, bookings, booking_services, reviews, favorites, conversations,
participants, messages, plan_sessions, plan_recommendations, content_flags,
audit_log, notifications, email_verifications, password_resets).

### b. Triggers fire

```powershell
psql $DIRECT -c "select tgname from pg_trigger where tgname like 'trg_%';"
```

You should see `trg_users_updated_at`, `trg_listings_updated_at`,
`trg_inquiries_updated_at`, `trg_bookings_updated_at`,
`trg_vendor_profiles_updated_at`, `trg_auth_user_created`,
`trg_auth_user_verified`.

### c. RLS is enabled everywhere

```powershell
psql $DIRECT -c "select tablename from pg_tables where schemaname = 'public' and rowsecurity = false;"
```

Expect zero rows. Every public table should have RLS on.

### d. Storage buckets exist

Open the dashboard → Storage. You should see `listings`, `avatars`, and
`documents` listed. The first two are marked Public.

### e. App still builds

```powershell
npm run build
```

Phase 1 must not break the existing build. The app continues to read from
`lib/mock-data.ts` until Phase 2 wires the API in.

---

## 7. Common issues

**`drizzle-kit migrate` hangs or times out**
You're on the pooled URL. Set `DIRECT_URL` to the port-5432 string and re-run.

**`auth.users` foreign key error during generate**
The schema in `lib/db/schema/index.ts` declares a slim `auth.users` reference
(see `authSchema` at the top of the file). On Supabase, that table already
exists. On vanilla Postgres, drizzle-kit will try to create it — don't run
this against vanilla Postgres; use Supabase or `supabase start`.

**RLS denies my own select even as the project owner**
Owner-bypass only happens with the `service_role` key. The anon and authed
JWTs are subject to RLS. Either log in via your app, or run the query in
the dashboard SQL Editor (which uses service role by default).

**`storage.foldername()` policy on documents bucket fails**
Supabase Storage stores names as full paths. Confirm uploads use a path of
`{vendor_id}/filename.ext` so `foldername(name)[1]` returns the vendor id.

---

## 8. What's next

Phase 1 is done when all checks in §6 pass. Phase 2 begins by writing
`lib/auth/server.ts`, `lib/auth/client.ts`, and the typed query layer in
`lib/db/queries/`. Until then, the UI is unchanged and the app keeps using
mock data.
