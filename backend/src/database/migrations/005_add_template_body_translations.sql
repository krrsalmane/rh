-- Add body_translations column for multi-language template content
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS body_translations JSON;
