-- =============================================================================
-- EventVenue DB Reset — Production Transition
-- =============================================================================
-- Usage:
--   psql "$DATABASE_URL" -f scripts/reset-db.sql
--   OR via Supabase SQL Editor / any PostgreSQL client
--
-- This script clears ALL mock/user data while preserving:
--   - All PostgreSQL enums (user_role, vendor_type, etc.)
--   - Table structure and indexes
--   - (Optionally) static catalog tables: amenities, event_types
--
-- FK CASCADE order: TRUNCATE from leaf tables upward to parent tables.
-- Wrapped in a transaction — all or nothing.
-- =============================================================================

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 1: Truncate all data tables (FK-safe order, most-dependent first)
-- ════════════════════════════════════════════════════════════════════════════

-- Leaf tables (no other tables depend on them)
TRUNCATE TABLE plan_recommendations CASCADE;
TRUNCATE TABLE booking_services CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE conversation_participants CASCADE;
TRUNCATE TABLE availability_slots CASCADE;
TRUNCATE TABLE listing_amenities CASCADE;
TRUNCATE TABLE listing_event_types CASCADE;
TRUNCATE TABLE content_flags CASCADE;

-- Child tables
TRUNCATE TABLE favorites CASCADE;
TRUNCATE TABLE reviews CASCADE;
TRUNCATE TABLE inquiries CASCADE;
TRUNCATE TABLE bookings CASCADE;

-- Listing-related
TRUNCATE TABLE listing_photos CASCADE;
TRUNCATE TABLE service_tags CASCADE;
TRUNCATE TABLE service_packages CASCADE;
TRUNCATE TABLE availability_blocks CASCADE;

-- Session & conversation
TRUNCATE TABLE plan_sessions CASCADE;
TRUNCATE TABLE conversations CASCADE;

-- Core entity tables
TRUNCATE TABLE listings CASCADE;
TRUNCATE TABLE vendor_documents CASCADE;
TRUNCATE TABLE vendor_profiles CASCADE;
TRUNCATE TABLE users CASCADE;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 2: (Optional) Clear static catalog tables
-- Comment out the 3 lines below if you want to KEEP amenities + event_types
-- ════════════════════════════════════════════════════════════════════════════

TRUNCATE TABLE amenities CASCADE;
TRUNCATE TABLE event_types CASCADE;

ALTER SEQUENCE IF EXISTS amenities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS event_types_id_seq RESTART WITH 1;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 3: Verify all tables are empty
-- ════════════════════════════════════════════════════════════════════════════
-- Uncomment to run verification queries:
--
-- SELECT 'users' AS tbl, count(*) FROM users
-- UNION ALL SELECT 'vendor_profiles', count(*) FROM vendor_profiles
-- UNION ALL SELECT 'vendor_documents', count(*) FROM vendor_documents
-- UNION ALL SELECT 'listings', count(*) FROM listings
-- UNION ALL SELECT 'listing_photos', count(*) FROM listing_photos
-- UNION ALL SELECT 'listing_amenities', count(*) FROM listing_amenities
-- UNION ALL SELECT 'listing_event_types', count(*) FROM listing_event_types
-- UNION ALL SELECT 'amenities', count(*) FROM amenities
-- UNION ALL SELECT 'event_types', count(*) FROM event_types
-- UNION ALL SELECT 'service_packages', count(*) FROM service_packages
-- UNION ALL SELECT 'service_tags', count(*) FROM service_tags
-- UNION ALL SELECT 'availability_blocks', count(*) FROM availability_blocks
-- UNION ALL SELECT 'availability_slots', count(*) FROM availability_slots
-- UNION ALL SELECT 'inquiries', count(*) FROM inquiries
-- UNION ALL SELECT 'bookings', count(*) FROM bookings
-- UNION ALL SELECT 'booking_services', count(*) FROM booking_services
-- UNION ALL SELECT 'reviews', count(*) FROM reviews
-- UNION ALL SELECT 'favorites', count(*) FROM favorites
-- UNION ALL SELECT 'conversations', count(*) FROM conversations
-- UNION ALL SELECT 'conversation_participants', count(*) FROM conversation_participants
-- UNION ALL SELECT 'messages', count(*) FROM messages
-- UNION ALL SELECT 'plan_sessions', count(*) FROM plan_sessions
-- UNION ALL SELECT 'plan_recommendations', count(*) FROM plan_recommendations
-- UNION ALL SELECT 'content_flags', count(*) FROM content_flags;

COMMIT;

-- =============================================================================
-- Re-seed after reset:
--   npx tsx lib/db/seed.ts
-- =============================================================================
