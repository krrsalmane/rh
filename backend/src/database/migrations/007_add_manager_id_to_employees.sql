-- ============================================================
-- Migration 007: Add manager_id to employees table
-- ============================================================
-- Adds support for manager-employee relationship
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id CHAR(36) NULL;

-- Add foreign key constraint for manager_id
ALTER TABLE employees
  DROP FOREIGN KEY IF EXISTS fk_employees_manager;
ALTER TABLE employees
  ADD CONSTRAINT fk_employees_manager
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

SET FOREIGN_KEY_CHECKS = 1;
