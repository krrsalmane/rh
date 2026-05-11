-- ============================================================
-- Rollback: 001_initial_schema
-- Drops all tables in reverse dependency order
-- ============================================================

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS public_holidays;
DROP TABLE IF EXISTS leave_balances;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS leave_types;
DROP TABLE IF EXISTS absences;
DROP TABLE IF EXISTS time_entries;
DROP TABLE IF EXISTS generated_documents;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS work_schedules;
DROP TABLE IF EXISTS companies;
