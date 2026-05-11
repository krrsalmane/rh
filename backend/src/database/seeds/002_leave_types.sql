-- Default leave types
INSERT INTO leave_types (company_id, name, annual_days, accrual_rule, requires_approval) VALUES
('00000000-0000-0000-0000-000000000001', 'Congé Annuel', 26, 'monthly', true),
('00000000-0000-0000-0000-000000000001', 'Congé Maladie', 180, 'yearly', true),
('00000000-0000-0000-0000-000000000001', 'Congé Maternité', 98, 'yearly', true),
('00000000-0000-0000-0000-000000000001', 'Congé Sans Solde', 0, 'yearly', true)
ON DUPLICATE KEY UPDATE name = VALUES(name);
