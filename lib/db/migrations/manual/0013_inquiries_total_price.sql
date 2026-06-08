-- =============================================================================
-- 0013_inquiries_total_price.sql
-- =============================================================================
-- Adds total_price column to inquiries so the customer-submitted estimated cost
-- is persisted and visible to the vendor on /vendor/inquiries.
-- =============================================================================

alter table public.inquiries add column if not exists total_price numeric;
