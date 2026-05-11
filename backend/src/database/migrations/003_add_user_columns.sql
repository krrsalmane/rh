-- ============================================================
-- Migration 003: Add user management columns
-- Absorbed from scripts/add-user-columns.sql
-- ============================================================
-- Note: These columns are already included in the fixed
-- 001_initial_schema.sql for fresh installs. This migration
-- exists for databases created before the schema was fixed.
-- The IF NOT EXISTS guard makes it safe to run either way.
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password TINYINT(1) DEFAULT 0;
