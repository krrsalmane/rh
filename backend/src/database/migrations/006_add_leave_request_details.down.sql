ALTER TABLE leave_requests
  DROP COLUMN IF EXISTS reason,
  DROP COLUMN IF EXISTS supporting_document_path,
  DROP COLUMN IF EXISTS supporting_document_name;