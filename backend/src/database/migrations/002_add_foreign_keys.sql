-- ============================================================
-- Migration 002: Add foreign key constraints to existing databases
-- For databases created before FKs were enforced in 001.
-- This is idempotent: uses DROP … IF EXISTS before each ADD.
-- ============================================================

-- Helper: disable FK checks temporarily so we can add constraints
-- even if data currently violates them (we'll log warnings).
SET FOREIGN_KEY_CHECKS = 0;

-- work_schedules
ALTER TABLE work_schedules
  DROP FOREIGN KEY IF EXISTS fk_work_schedules_company;
ALTER TABLE work_schedules
  ADD CONSTRAINT fk_work_schedules_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- employees
ALTER TABLE employees
  DROP FOREIGN KEY IF EXISTS fk_employees_company;
ALTER TABLE employees
  ADD CONSTRAINT fk_employees_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE employees
  DROP FOREIGN KEY IF EXISTS fk_employees_work_schedule;
ALTER TABLE employees
  ADD CONSTRAINT fk_employees_work_schedule
  FOREIGN KEY (work_schedule_id) REFERENCES work_schedules(id) ON DELETE SET NULL;

-- users
ALTER TABLE users
  DROP FOREIGN KEY IF EXISTS fk_users_company;
ALTER TABLE users
  ADD CONSTRAINT fk_users_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE users
  DROP FOREIGN KEY IF EXISTS fk_users_employee;
ALTER TABLE users
  ADD CONSTRAINT fk_users_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- templates
ALTER TABLE templates
  DROP FOREIGN KEY IF EXISTS fk_templates_company;
ALTER TABLE templates
  ADD CONSTRAINT fk_templates_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE templates
  DROP FOREIGN KEY IF EXISTS fk_templates_created_by;
ALTER TABLE templates
  ADD CONSTRAINT fk_templates_created_by
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- generated_documents
ALTER TABLE generated_documents
  DROP FOREIGN KEY IF EXISTS fk_generated_documents_company;
ALTER TABLE generated_documents
  ADD CONSTRAINT fk_generated_documents_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE generated_documents
  DROP FOREIGN KEY IF EXISTS fk_generated_documents_employee;
ALTER TABLE generated_documents
  ADD CONSTRAINT fk_generated_documents_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE generated_documents
  DROP FOREIGN KEY IF EXISTS fk_generated_documents_template;
ALTER TABLE generated_documents
  ADD CONSTRAINT fk_generated_documents_template
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL;

ALTER TABLE generated_documents
  DROP FOREIGN KEY IF EXISTS fk_generated_documents_generated_by;
ALTER TABLE generated_documents
  ADD CONSTRAINT fk_generated_documents_generated_by
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL;

-- time_entries
ALTER TABLE time_entries
  DROP FOREIGN KEY IF EXISTS fk_time_entries_company;
ALTER TABLE time_entries
  ADD CONSTRAINT fk_time_entries_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE time_entries
  DROP FOREIGN KEY IF EXISTS fk_time_entries_employee;
ALTER TABLE time_entries
  ADD CONSTRAINT fk_time_entries_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE time_entries
  DROP FOREIGN KEY IF EXISTS fk_time_entries_modified_by;
ALTER TABLE time_entries
  ADD CONSTRAINT fk_time_entries_modified_by
  FOREIGN KEY (modified_by) REFERENCES users(id) ON DELETE SET NULL;

-- absences
ALTER TABLE absences
  DROP FOREIGN KEY IF EXISTS fk_absences_company;
ALTER TABLE absences
  ADD CONSTRAINT fk_absences_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE absences
  DROP FOREIGN KEY IF EXISTS fk_absences_employee;
ALTER TABLE absences
  ADD CONSTRAINT fk_absences_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE absences
  DROP FOREIGN KEY IF EXISTS fk_absences_reviewed_by;
ALTER TABLE absences
  ADD CONSTRAINT fk_absences_reviewed_by
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- leave_types
ALTER TABLE leave_types
  DROP FOREIGN KEY IF EXISTS fk_leave_types_company;
ALTER TABLE leave_types
  ADD CONSTRAINT fk_leave_types_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- leave_requests
ALTER TABLE leave_requests
  DROP FOREIGN KEY IF EXISTS fk_leave_requests_company;
ALTER TABLE leave_requests
  ADD CONSTRAINT fk_leave_requests_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE leave_requests
  DROP FOREIGN KEY IF EXISTS fk_leave_requests_employee;
ALTER TABLE leave_requests
  ADD CONSTRAINT fk_leave_requests_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE leave_requests
  DROP FOREIGN KEY IF EXISTS fk_leave_requests_leave_type;
ALTER TABLE leave_requests
  ADD CONSTRAINT fk_leave_requests_leave_type
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT;

ALTER TABLE leave_requests
  DROP FOREIGN KEY IF EXISTS fk_leave_requests_approved_by;
ALTER TABLE leave_requests
  ADD CONSTRAINT fk_leave_requests_approved_by
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- leave_balances
ALTER TABLE leave_balances
  DROP FOREIGN KEY IF EXISTS fk_leave_balances_employee;
ALTER TABLE leave_balances
  ADD CONSTRAINT fk_leave_balances_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE leave_balances
  DROP FOREIGN KEY IF EXISTS fk_leave_balances_leave_type;
ALTER TABLE leave_balances
  ADD CONSTRAINT fk_leave_balances_leave_type
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE;

-- public_holidays
ALTER TABLE public_holidays
  DROP FOREIGN KEY IF EXISTS fk_public_holidays_company;
ALTER TABLE public_holidays
  ADD CONSTRAINT fk_public_holidays_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Add is_recurring column if missing (was in seed but not in original schema)
ALTER TABLE public_holidays
  ADD COLUMN IF NOT EXISTS is_recurring TINYINT(1) DEFAULT 0;

-- audit_logs
ALTER TABLE audit_logs
  DROP FOREIGN KEY IF EXISTS fk_audit_logs_company;
ALTER TABLE audit_logs
  ADD CONSTRAINT fk_audit_logs_company
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE audit_logs
  DROP FOREIGN KEY IF EXISTS fk_audit_logs_user;
ALTER TABLE audit_logs
  ADD CONSTRAINT fk_audit_logs_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;
