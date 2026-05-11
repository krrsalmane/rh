-- Insert test notification (note: 'read' is escaped with backticks)
INSERT INTO notifications (
  id, 
  user_id, 
  company_id, 
  type, 
  title, 
  message, 
  data, 
  created_at, 
  `read`
) VALUES (
  UUID(),
  'YOUR_USER_ID',
  'YOUR_COMPANY_ID', 
  'test_notification',
  'Test Notification',
  'This is a manual test notification',
  '{"test": true, "timestamp": "2026-05-11T13:24:00Z"}',
  NOW(),
  FALSE
);

-- Or to get actual user_id and company_id first:
SELECT id, company_id FROM users WHERE email = 'superadmin@atlastech.ma';

-- Then use those values in the INSERT statement above
