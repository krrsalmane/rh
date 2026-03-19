-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  logo_url VARCHAR,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role VARCHAR CHECK (role IN ('super_admin','hr_agent','manager','employee')) NOT NULL,
  employee_id UUID,
  is_active BOOLEAN DEFAULT true,
  refresh_token VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Work Schedules (before employees, since employees references it)
CREATE TABLE IF NOT EXISTS work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR NOT NULL,
  weekly_hours DECIMAL(4,1),
  daily_hours DECIMAL(3,1),
  work_days INTEGER[],
  break_minutes INTEGER DEFAULT 60,
  is_rotating BOOLEAN DEFAULT false
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  cne VARCHAR,
  cin VARCHAR,
  address TEXT,
  phone VARCHAR,
  email VARCHAR,
  hire_date DATE NOT NULL,
  contract_type VARCHAR CHECK (contract_type IN ('CDI','CDD','internship','freelance')),
  function VARCHAR,
  department VARCHAR,
  salary DECIMAL(10,2),
  status VARCHAR CHECK (status IN ('active','inactive','terminated')) DEFAULT 'active',
  work_schedule_id UUID REFERENCES work_schedules(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key from users.employee_id -> employees.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_employee') THEN
    ALTER TABLE users ADD CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) REFERENCES employees(id);
  END IF;
END $$;

-- Templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR NOT NULL,
  category VARCHAR,
  language VARCHAR(5) DEFAULT 'fr',
  body TEXT NOT NULL,
  variable_schema JSONB,
  version INTEGER DEFAULT 1,
  status VARCHAR CHECK (status IN ('draft','active','archived')) DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated Documents
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  employee_id UUID REFERENCES employees(id),
  template_id UUID REFERENCES templates(id),
  template_version INTEGER,
  form_data JSONB,
  pdf_path VARCHAR,
  status VARCHAR CHECK (status IN ('generated','archived','deleted')) DEFAULT 'generated',
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP DEFAULT NOW()
);

-- Time Entries
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  employee_id UUID REFERENCES employees(id),
  date DATE NOT NULL,
  clock_in TIME,
  clock_out TIME,
  total_hours DECIMAL(4,2),
  expected_hours DECIMAL(4,2),
  overtime DECIMAL(4,2) DEFAULT 0,
  deficit DECIMAL(4,2) DEFAULT 0,
  source VARCHAR CHECK (source IN ('manual','system','import')) DEFAULT 'manual',
  modified_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Absences
CREATE TABLE IF NOT EXISTS absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  employee_id UUID REFERENCES employees(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type VARCHAR,
  justification_status VARCHAR CHECK (justification_status IN ('pending','justified','unjustified')) DEFAULT 'pending',
  reason TEXT,
  attachments JSONB DEFAULT '[]',
  reviewed_by UUID REFERENCES users(id),
  review_note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leave Types
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR NOT NULL,
  annual_days INTEGER,
  accrual_rule VARCHAR,
  carry_over_max INTEGER DEFAULT 0,
  requires_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(company_id, name)
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  employee_id UUID REFERENCES employees(id),
  leave_type_id UUID REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  working_days INTEGER,
  status VARCHAR CHECK (status IN ('pending','approved','rejected','cancelled')) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_by UUID REFERENCES users(id),
  approval_note TEXT
);

-- Leave Balances
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  leave_type_id UUID REFERENCES leave_types(id),
  year INTEGER NOT NULL,
  credited DECIMAL(5,1) DEFAULT 0,
  taken DECIMAL(5,1) DEFAULT 0,
  remaining DECIMAL(5,1) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, year)
);

-- Public Holidays
CREATE TABLE IF NOT EXISTS public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR NOT NULL,
  date DATE NOT NULL,
  year INTEGER NOT NULL
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR NOT NULL,
  entity VARCHAR NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(company_id, status);
CREATE INDEX IF NOT EXISTS idx_time_entries_emp_date ON time_entries(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_time_entries_company ON time_entries(company_id, date);
CREATE INDEX IF NOT EXISTS idx_absences_company ON absences(company_id);
CREATE INDEX IF NOT EXISTS idx_absences_employee ON absences(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_company ON leave_requests(company_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON leave_balances(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_templates_company ON templates(company_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_company ON generated_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_public_holidays_company ON public_holidays(company_id, date);
