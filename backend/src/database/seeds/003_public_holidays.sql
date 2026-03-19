-- Moroccan public holidays for 2026
INSERT INTO public_holidays (company_id, name, date, is_recurring)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Jour de l''An', '2026-01-01', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Manifeste de l''Indépendance', '2026-01-11', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fête du Travail', '2026-05-01', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fête du Trône', '2026-07-30', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Oued Ed-Dahab', '2026-08-14', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Révolution du Roi et du Peuple', '2026-08-20', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fête de la Jeunesse', '2026-08-21', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marche Verte', '2026-11-06', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fête de l''Indépendance', '2026-11-18', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Aïd Al Fitr', '2026-03-20', false),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Aïd Al Fitr (2ème jour)', '2026-03-21', false),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Aïd Al Adha', '2026-05-27', false),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Aïd Al Adha (2ème jour)', '2026-05-28', false),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1er Moharram', '2026-06-17', false),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Aïd Al Mawlid', '2026-08-26', false)
ON CONFLICT DO NOTHING;
