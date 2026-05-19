-- Rollback: Remove prayer calculation location from companies table
ALTER TABLE companies DROP COLUMN latitude;
ALTER TABLE companies DROP COLUMN longitude;
