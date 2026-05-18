-- Seed 005: Additional test users and employees

-- Test work schedule used by seeded employees
INSERT INTO work_schedules (company_id, name, weekly_hours, daily_hours, work_days, break_minutes, is_rotating)
VALUES
('00000000-0000-0000-0000-000000000001', 'Test Standard 44h', 44, 8.8, '[1,2,3,4,5]', 60, 0)
ON DUPLICATE KEY UPDATE
  weekly_hours = VALUES(weekly_hours),
  daily_hours = VALUES(daily_hours),
  work_days = VALUES(work_days),
  break_minutes = VALUES(break_minutes),
  is_rotating = VALUES(is_rotating);

-- Employees linked to test users
INSERT INTO employees (
  company_id, first_name, last_name, cne, cin, address, phone, email,
  hire_date, contract_type, `function`, department, salary, status, work_schedule_id
)
SELECT
  '00000000-0000-0000-0000-000000000001', 'Nadia', 'El Amrani', 'CNE-90001', 'CIN-90001', 'Casablanca', '+212600000101', 'nadia.elamrani@hrms.com',
  '2024-02-01', 'CDI', 'HR Specialist', 'Human Resources', 15000, 'active', ws.id
FROM work_schedules ws
WHERE ws.company_id = '00000000-0000-0000-0000-000000000001' AND ws.name = 'Test Standard 44h'
ON DUPLICATE KEY UPDATE email = VALUES(email), `function` = VALUES(`function`), department = VALUES(department), salary = VALUES(salary);

INSERT INTO employees (
  company_id, first_name, last_name, cne, cin, address, phone, email,
  hire_date, contract_type, `function`, department, salary, status, work_schedule_id
)
SELECT
  '00000000-0000-0000-0000-000000000001', 'Karim', 'Benali', 'CNE-90002', 'CIN-90002', 'Rabat', '+212600000102', 'karim.benali@hrms.com',
  '2024-03-01', 'CDD', 'Finance Analyst', 'Finance', 12000, 'active', ws.id
FROM work_schedules ws
WHERE ws.company_id = '00000000-0000-0000-0000-000000000001' AND ws.name = 'Test Standard 44h'
ON DUPLICATE KEY UPDATE email = VALUES(email), `function` = VALUES(`function`), department = VALUES(department), salary = VALUES(salary);

INSERT INTO employees (
  company_id, first_name, last_name, cne, cin, address, phone, email,
  hire_date, contract_type, `function`, department, salary, status, work_schedule_id
)
SELECT
  '00000000-0000-0000-0000-000000000001', 'Meryem', 'Boussaid', 'CNE-90003', 'CIN-90003', 'Casablanca', '+212600000103', 'meryem.boussaid@hrms.com',
  '2024-04-01', 'CDI', 'Operations Lead', 'Operations', 18000, 'active', ws.id
FROM work_schedules ws
WHERE ws.company_id = '00000000-0000-0000-0000-000000000001' AND ws.name = 'Test Standard 44h'
ON DUPLICATE KEY UPDATE email = VALUES(email), `function` = VALUES(`function`), department = VALUES(department), salary = VALUES(salary);

INSERT INTO employees (
  company_id, first_name, last_name, cne, cin, address, phone, email,
  hire_date, contract_type, `function`, department, salary, status, work_schedule_id
)
SELECT
  '00000000-0000-0000-0000-000000000001', 'Yassine', 'Khaldi', 'CNE-90004', 'CIN-90004', 'Tanger', '+212600000104', 'yassine.khaldi@hrms.com',
  '2024-05-01', 'internship', 'Support Intern', 'Support', 4500, 'active', ws.id
FROM work_schedules ws
WHERE ws.company_id = '00000000-0000-0000-0000-000000000001' AND ws.name = 'Test Standard 44h'
ON DUPLICATE KEY UPDATE email = VALUES(email), `function` = VALUES(`function`), department = VALUES(department), salary = VALUES(salary);

INSERT INTO employees (
  company_id, first_name, last_name, cne, cin, address, phone, email,
  hire_date, contract_type, `function`, department, salary, status, work_schedule_id
)
SELECT
  '00000000-0000-0000-0000-000000000001', 'Sana', 'Quality', 'CNE-90005', 'CIN-90005', 'Meknes', '+212600000105', 'sana.qa@hrms.com',
  '2024-06-01', 'CDI', 'QA Lead', 'Quality Assurance', 13000, 'active', ws.id
FROM work_schedules ws
WHERE ws.company_id = '00000000-0000-0000-0000-000000000001' AND ws.name = 'Test Standard 44h'
ON DUPLICATE KEY UPDATE email = VALUES(email), `function` = VALUES(`function`), department = VALUES(department), salary = VALUES(salary);

INSERT INTO employees (
  company_id, first_name, last_name, cne, cin, address, phone, email,
  hire_date, contract_type, `function`, department, salary, status, work_schedule_id
)
SELECT
  '00000000-0000-0000-0000-000000000001', 'Hamza', 'Sales', 'CNE-90006', 'CIN-90006', 'Agadir', '+212600000106', 'hamza.sales@hrms.com',
  '2024-07-01', 'CDD', 'Sales Representative', 'Sales', 9800, 'active', ws.id
FROM work_schedules ws
WHERE ws.company_id = '00000000-0000-0000-0000-000000000001' AND ws.name = 'Test Standard 44h'
ON DUPLICATE KEY UPDATE email = VALUES(email), `function` = VALUES(`function`), department = VALUES(department), salary = VALUES(salary);

INSERT INTO employees (
  company_id, first_name, last_name, cne, cin, address, phone, email,
  hire_date, contract_type, `function`, department, salary, status, work_schedule_id
)
SELECT
  '00000000-0000-0000-0000-000000000001', 'Imane', 'Operations', 'CNE-90007', 'CIN-90007', 'Casablanca', '+212600000107', 'imane.ops@hrms.com',
  '2024-08-01', 'CDI', 'Operations Coordinator', 'Operations', 10500, 'active', ws.id
FROM work_schedules ws
WHERE ws.company_id = '00000000-0000-0000-0000-000000000001' AND ws.name = 'Test Standard 44h'
ON DUPLICATE KEY UPDATE email = VALUES(email), `function` = VALUES(`function`), department = VALUES(department), salary = VALUES(salary);

-- Loginable test users
INSERT INTO users (company_id, email, password_hash, `role`, employee_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'nadia.elamrani@hrms.com', '$2a$10$CrjaW3dVTfFaESCwqyty6OvOE.gX/ttyYA0L4gV9PIyqOk.gLGU3S', 'hr_agent', e.id, 1
FROM employees e
WHERE e.company_id = '00000000-0000-0000-0000-000000000001' AND e.email = 'nadia.elamrani@hrms.com'
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), `role` = VALUES(`role`), employee_id = VALUES(employee_id), is_active = VALUES(is_active);

INSERT INTO users (company_id, email, password_hash, `role`, employee_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'karim.benali@hrms.com', '$2a$10$CrjaW3dVTfFaESCwqyty6OvOE.gX/ttyYA0L4gV9PIyqOk.gLGU3S', 'manager', e.id, 1
FROM employees e
WHERE e.company_id = '00000000-0000-0000-0000-000000000001' AND e.email = 'karim.benali@hrms.com'
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), `role` = VALUES(`role`), employee_id = VALUES(employee_id), is_active = VALUES(is_active);

INSERT INTO users (company_id, email, password_hash, `role`, employee_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'meryem.boussaid@hrms.com', '$2a$10$CrjaW3dVTfFaESCwqyty6OvOE.gX/ttyYA0L4gV9PIyqOk.gLGU3S', 'employee', e.id, 1
FROM employees e
WHERE e.company_id = '00000000-0000-0000-0000-000000000001' AND e.email = 'meryem.boussaid@hrms.com'
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), `role` = VALUES(`role`), employee_id = VALUES(employee_id), is_active = VALUES(is_active);

INSERT INTO users (company_id, email, password_hash, `role`, employee_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'yassine.khaldi@hrms.com', '$2a$10$CrjaW3dVTfFaESCwqyty6OvOE.gX/ttyYA0L4gV9PIyqOk.gLGU3S', 'employee', e.id, 1
FROM employees e
WHERE e.company_id = '00000000-0000-0000-0000-000000000001' AND e.email = 'yassine.khaldi@hrms.com'
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), `role` = VALUES(`role`), employee_id = VALUES(employee_id), is_active = VALUES(is_active);

INSERT INTO users (company_id, email, password_hash, `role`, employee_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'sana.qa@hrms.com', '$2a$10$CrjaW3dVTfFaESCwqyty6OvOE.gX/ttyYA0L4gV9PIyqOk.gLGU3S', 'manager', e.id, 1
FROM employees e
WHERE e.company_id = '00000000-0000-0000-0000-000000000001' AND e.email = 'sana.qa@hrms.com'
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), `role` = VALUES(`role`), employee_id = VALUES(employee_id), is_active = VALUES(is_active);

INSERT INTO users (company_id, email, password_hash, `role`, employee_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'hamza.sales@hrms.com', '$2a$10$CrjaW3dVTfFaESCwqyty6OvOE.gX/ttyYA0L4gV9PIyqOk.gLGU3S', 'employee', e.id, 1
FROM employees e
WHERE e.company_id = '00000000-0000-0000-0000-000000000001' AND e.email = 'hamza.sales@hrms.com'
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), `role` = VALUES(`role`), employee_id = VALUES(employee_id), is_active = VALUES(is_active);

INSERT INTO users (company_id, email, password_hash, `role`, employee_id, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'imane.ops@hrms.com', '$2a$10$CrjaW3dVTfFaESCwqyty6OvOE.gX/ttyYA0L4gV9PIyqOk.gLGU3S', 'employee', e.id, 1
FROM employees e
WHERE e.company_id = '00000000-0000-0000-0000-000000000001' AND e.email = 'imane.ops@hrms.com'
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), `role` = VALUES(`role`), employee_id = VALUES(employee_id), is_active = VALUES(is_active);






