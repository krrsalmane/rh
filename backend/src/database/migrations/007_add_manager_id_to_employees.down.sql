-- ============================================================
-- Migration 007 Rollback: Remove manager_id from employees table
-- ============================================================

ALTER TABLE employees DROP CONSTRAINT IF EXISTS fk_employees_manager;
ALTER TABLE employees DROP COLUMN IF EXISTS manager_id;
