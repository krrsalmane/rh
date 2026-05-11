-- ============================================================
-- Rollback: 002_add_foreign_keys
-- Drops all FK constraints (leaves tables and data intact)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE work_schedules DROP FOREIGN KEY IF EXISTS fk_work_schedules_company;
ALTER TABLE employees DROP FOREIGN KEY IF EXISTS fk_employees_company;
ALTER TABLE employees DROP FOREIGN KEY IF EXISTS fk_employees_work_schedule;
ALTER TABLE users DROP FOREIGN KEY IF EXISTS fk_users_company;
ALTER TABLE users DROP FOREIGN KEY IF EXISTS fk_users_employee;
ALTER TABLE templates DROP FOREIGN KEY IF EXISTS fk_templates_company;
ALTER TABLE templates DROP FOREIGN KEY IF EXISTS fk_templates_created_by;
ALTER TABLE generated_documents DROP FOREIGN KEY IF EXISTS fk_generated_documents_company;
ALTER TABLE generated_documents DROP FOREIGN KEY IF EXISTS fk_generated_documents_employee;
ALTER TABLE generated_documents DROP FOREIGN KEY IF EXISTS fk_generated_documents_template;
ALTER TABLE generated_documents DROP FOREIGN KEY IF EXISTS fk_generated_documents_generated_by;
ALTER TABLE time_entries DROP FOREIGN KEY IF EXISTS fk_time_entries_company;
ALTER TABLE time_entries DROP FOREIGN KEY IF EXISTS fk_time_entries_employee;
ALTER TABLE time_entries DROP FOREIGN KEY IF EXISTS fk_time_entries_modified_by;
ALTER TABLE absences DROP FOREIGN KEY IF EXISTS fk_absences_company;
ALTER TABLE absences DROP FOREIGN KEY IF EXISTS fk_absences_employee;
ALTER TABLE absences DROP FOREIGN KEY IF EXISTS fk_absences_reviewed_by;
ALTER TABLE leave_types DROP FOREIGN KEY IF EXISTS fk_leave_types_company;
ALTER TABLE leave_requests DROP FOREIGN KEY IF EXISTS fk_leave_requests_company;
ALTER TABLE leave_requests DROP FOREIGN KEY IF EXISTS fk_leave_requests_employee;
ALTER TABLE leave_requests DROP FOREIGN KEY IF EXISTS fk_leave_requests_leave_type;
ALTER TABLE leave_requests DROP FOREIGN KEY IF EXISTS fk_leave_requests_approved_by;
ALTER TABLE leave_balances DROP FOREIGN KEY IF EXISTS fk_leave_balances_employee;
ALTER TABLE leave_balances DROP FOREIGN KEY IF EXISTS fk_leave_balances_leave_type;
ALTER TABLE public_holidays DROP FOREIGN KEY IF EXISTS fk_public_holidays_company;
ALTER TABLE audit_logs DROP FOREIGN KEY IF EXISTS fk_audit_logs_company;
ALTER TABLE audit_logs DROP FOREIGN KEY IF EXISTS fk_audit_logs_user;

SET FOREIGN_KEY_CHECKS = 1;
