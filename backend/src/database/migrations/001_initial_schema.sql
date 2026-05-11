-- ============================================================
-- Maya HRMS – Initial Schema
-- Database: MySQL 8+
-- ============================================================
-- Table creation order respects foreign-key dependencies.
-- All FKs use explicit CONSTRAINT … FOREIGN KEY syntax so
-- MySQL actually enforces them (inline REFERENCES is ignored).
-- ============================================================

-- 1. Companies (no dependencies)
CREATE TABLE IF NOT EXISTS companies (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Work Schedules (depends on: companies)
CREATE TABLE IF NOT EXISTS work_schedules (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  weekly_hours DECIMAL(4,1),
  daily_hours DECIMAL(3,1),
  work_days JSON,
  break_minutes INTEGER DEFAULT 60,
  is_rotating TINYINT(1) DEFAULT 0,
  CONSTRAINT fk_work_schedules_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 3. Employees (depends on: companies, work_schedules)
CREATE TABLE IF NOT EXISTS employees (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  cne VARCHAR(100),
  cin VARCHAR(100),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  hire_date DATE NOT NULL,
  contract_type ENUM('CDI','CDD','internship','freelance'),
  `function` VARCHAR(255),
  department VARCHAR(255),
  salary DECIMAL(10,2),
  status ENUM('active','inactive','terminated') DEFAULT 'active',
  work_schedule_id CHAR(36),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_employees_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_employees_work_schedule
    FOREIGN KEY (work_schedule_id) REFERENCES work_schedules(id) ON DELETE SET NULL
);

-- 4. Users (depends on: companies, employees)
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin','hr_agent','manager','employee') NOT NULL,
  employee_id CHAR(36),
  is_active TINYINT(1) DEFAULT 1,
  refresh_token VARCHAR(500),
  last_login TIMESTAMP NULL,
  must_change_password TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_users_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_users_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- 5. Templates (depends on: companies, users)
CREATE TABLE IF NOT EXISTS templates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  language VARCHAR(5) DEFAULT 'fr',
  body TEXT NOT NULL,
  variable_schema JSON,
  version INTEGER DEFAULT 1,
  status ENUM('draft','active','archived') DEFAULT 'draft',
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_templates_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_templates_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Generated Documents (depends on: companies, employees, templates, users)
CREATE TABLE IF NOT EXISTS generated_documents (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  template_id CHAR(36),
  template_version INTEGER,
  form_data JSON,
  pdf_path VARCHAR(500),
  status ENUM('generated','archived','deleted') DEFAULT 'generated',
  generated_by CHAR(36),
  generated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_generated_documents_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_generated_documents_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_generated_documents_template
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL,
  CONSTRAINT fk_generated_documents_generated_by
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. Time Entries (depends on: companies, employees, users)
CREATE TABLE IF NOT EXISTS time_entries (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  date DATE NOT NULL,
  clock_in TIME,
  clock_out TIME,
  total_hours DECIMAL(4,2),
  expected_hours DECIMAL(4,2),
  overtime DECIMAL(4,2) DEFAULT 0,
  deficit DECIMAL(4,2) DEFAULT 0,
  source ENUM('manual','system','import') DEFAULT 'manual',
  modified_by CHAR(36),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_time_entries_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_time_entries_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_time_entries_modified_by
    FOREIGN KEY (modified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 8. Absences (depends on: companies, employees, users)
CREATE TABLE IF NOT EXISTS absences (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type VARCHAR(100),
  justification_status ENUM('pending','justified','unjustified') DEFAULT 'pending',
  reason TEXT,
  attachments JSON DEFAULT ('[]'),
  reviewed_by CHAR(36),
  review_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_absences_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_absences_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_absences_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 9. Leave Types (depends on: companies)
CREATE TABLE IF NOT EXISTS leave_types (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  annual_days INTEGER,
  accrual_rule VARCHAR(100),
  carry_over_max INTEGER DEFAULT 0,
  requires_approval TINYINT(1) DEFAULT 1,
  is_active TINYINT(1) DEFAULT 1,
  UNIQUE(company_id, name),
  CONSTRAINT fk_leave_types_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 10. Leave Requests (depends on: companies, employees, leave_types, users)
CREATE TABLE IF NOT EXISTS leave_requests (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  leave_type_id CHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  working_days INTEGER,
  status ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_by CHAR(36),
  approval_note TEXT,
  CONSTRAINT fk_leave_requests_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_requests_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_requests_leave_type
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
  CONSTRAINT fk_leave_requests_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 11. Leave Balances (depends on: employees, leave_types)
CREATE TABLE IF NOT EXISTS leave_balances (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  employee_id CHAR(36) NOT NULL,
  leave_type_id CHAR(36) NOT NULL,
  year INTEGER NOT NULL,
  credited DECIMAL(5,1) DEFAULT 0,
  taken DECIMAL(5,1) DEFAULT 0,
  remaining DECIMAL(5,1) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, year),
  CONSTRAINT fk_leave_balances_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_balances_leave_type
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE
);

-- 12. Public Holidays (depends on: companies)
CREATE TABLE IF NOT EXISTS public_holidays (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  year INTEGER NOT NULL,
  is_recurring TINYINT(1) DEFAULT 0,
  CONSTRAINT fk_public_holidays_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 13. Audit Logs (depends on: companies, users)
CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id CHAR(36),
  old_value JSON,
  new_value JSON,
  timestamp TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_audit_logs_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_status ON employees(company_id, status);
CREATE INDEX idx_time_entries_emp_date ON time_entries(employee_id, date);
CREATE INDEX idx_time_entries_company ON time_entries(company_id, date);
CREATE INDEX idx_absences_company ON absences(company_id);
CREATE INDEX idx_absences_employee ON absences(employee_id);
CREATE INDEX idx_leave_requests_company ON leave_requests(company_id, status);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id, year);
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id, timestamp);
CREATE INDEX idx_templates_company ON templates(company_id);
CREATE INDEX idx_generated_documents_company ON generated_documents(company_id);
CREATE INDEX idx_public_holidays_company ON public_holidays(company_id, date);
