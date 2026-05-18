-- Default company
INSERT INTO companies (id, name, address) VALUES
('00000000-0000-0000-0000-000000000001', 'Maya HR Company', 'Casablanca, Maroc')
ON DUPLICATE KEY UPDATE id = id;

-- Super admin user (password: Admin@1234)
INSERT INTO users (company_id, email, password_hash, `role`) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@hrms.com', '$2a$10$CrjaW3dVTfFaESCwqyty6OvOE.gX/ttyYA0L4gV9PIyqOk.gLGU3S', 'super_admin')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);
