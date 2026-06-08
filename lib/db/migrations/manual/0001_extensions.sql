-- =============================================================================
-- 0001_extensions.sql
-- =============================================================================
-- Postgres extensions used by the schema. Run once per database.
--   pgcrypto:  gen_random_uuid() and crypt() helpers (Supabase ships it enabled
--              but we declare explicitly for completeness).
--   citext:    case-insensitive text type (reserved for future search columns).
--   pg_trgm:   trigram indexes for fuzzy listing search by title/location.
--
-- Apply order: 0001 → 0002 → 0003 → 0004. See SUPABASE_SETUP.md.
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;
