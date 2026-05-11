-- ============================================================
-- Rollback: 003_add_user_columns
-- ============================================================

ALTER TABLE users DROP COLUMN IF EXISTS last_login;
ALTER TABLE users DROP COLUMN IF EXISTS must_change_password;
