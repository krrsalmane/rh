ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS supporting_document_path VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS supporting_document_name VARCHAR(255) NULL;