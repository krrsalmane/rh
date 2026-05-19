-- Add prayer calculation location to companies table
ALTER TABLE companies ADD COLUMN latitude DECIMAL(10, 8) DEFAULT 31.629100;
ALTER TABLE companies ADD COLUMN longitude DECIMAL(11, 8) DEFAULT -8.009700;
