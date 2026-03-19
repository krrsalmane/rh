-- Default company
INSERT INTO companies (id, name, address) VALUES
('00000000-0000-0000-0000-000000000001', 'Maya HR Company', 'Casablanca, Maroc')
ON CONFLICT (id) DO NOTHING;

-- Super admin user (password: Admin@1234)
INSERT INTO users (company_id, email, password_hash, role) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@hrms.com', '$2a$10$AV0ZFnr8OVMpG8NurU7xjeZFWORTnupfS/oJCRj0Ti7GV.HUwVzsa', 'super_admin')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
