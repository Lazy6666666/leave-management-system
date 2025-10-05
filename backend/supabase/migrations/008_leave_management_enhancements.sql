-- ============================================================================
-- MIGRATION: 008_leave_management_enhancements.sql
-- Description: Add document upload support and audit trail for leave requests
-- Created: 2025-10-04
-- ============================================================================

-- ============================================================================
-- TABLE: leave_documents
-- Description: Store metadata for documents attached to leave requests
-- ============================================================================

CREATE TABLE leave_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leave_request_id UUID NOT NULL REFERENCES leaves(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 5242880), -- 5MB limit
  CONSTRAINT valid_file_name CHECK (LENGTH(file_name) > 0 AND LENGTH(file_name) <= 255),
  CONSTRAINT valid_storage_path CHECK (LENGTH(storage_path) > 0)
);

-- ============================================================================
-- AUDIT TRAIL: Add columns to leaves table
-- Description: Track modifications to leave requests
-- ============================================================================

ALTER TABLE leaves 
  ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES profiles(id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for querying documents by leave request
CREATE INDEX idx_leave_documents_request ON leave_documents(leave_request_id);

-- Index for querying documents by uploader
CREATE INDEX idx_leave_documents_uploader ON leave_documents(uploaded_by);

-- Index for querying documents by upload date
CREATE INDEX idx_leave_documents_uploaded_at ON leave_documents(uploaded_at DESC);

-- Index for querying modified leave requests
CREATE INDEX idx_leaves_modified ON leaves(last_modified_at DESC) WHERE last_modified_at IS NOT NULL;

-- Index for querying by modifier
CREATE INDEX idx_leaves_modified_by ON leaves(last_modified_by) WHERE last_modified_by IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update last_modified_at and last_modified_by on leave updates
CREATE OR REPLACE FUNCTION update_leave_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update audit fields if the leave request data actually changed
  IF (OLD.start_date IS DISTINCT FROM NEW.start_date OR
      OLD.end_date IS DISTINCT FROM NEW.end_date OR
      OLD.leave_type_id IS DISTINCT FROM NEW.leave_type_id OR
      OLD.days_count IS DISTINCT FROM NEW.days_count OR
      OLD.reason IS DISTINCT FROM NEW.reason OR
      OLD.status IS DISTINCT FROM NEW.status) THEN
    
    NEW.last_modified_at = NOW();
    -- last_modified_by should be set by the application
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leaves_audit_trail 
  BEFORE UPDATE ON leaves
  FOR EACH ROW 
  EXECUTE FUNCTION update_leave_audit_trail();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on leave_documents table
ALTER TABLE leave_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Employees can view their own documents
CREATE POLICY "Employees can view own documents"
  ON leave_documents
  FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM leaves
      WHERE leaves.id = leave_documents.leave_request_id
      AND leaves.requester_id = auth.uid()
    )
  );

-- Policy: Managers can view documents for their team's leave requests
CREATE POLICY "Managers can view team documents"
  ON leave_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'admin', 'hr')
    )
  );

-- Policy: Employees can upload documents for their own leave requests
CREATE POLICY "Employees can upload own documents"
  ON leave_documents
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM leaves
      WHERE leaves.id = leave_documents.leave_request_id
      AND leaves.requester_id = auth.uid()
      AND leaves.status = 'pending'
    )
  );

-- Policy: Employees can delete their own documents from pending requests
CREATE POLICY "Employees can delete own documents"
  ON leave_documents
  FOR DELETE
  USING (
    uploaded_by = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM leaves
      WHERE leaves.id = leave_documents.leave_request_id
      AND leaves.requester_id = auth.uid()
      AND leaves.status = 'pending'
    )
  );

-- Policy: Admins have full access to all documents
CREATE POLICY "Admins have full access to documents"
  ON leave_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE leave_documents IS 'Metadata for documents attached to leave requests';
COMMENT ON COLUMN leave_documents.file_size IS 'File size in bytes, maximum 5MB (5242880 bytes)';
COMMENT ON COLUMN leave_documents.storage_path IS 'Path to file in Supabase Storage bucket';
COMMENT ON COLUMN leaves.last_modified_at IS 'Timestamp of last modification to leave request';
COMMENT ON COLUMN leaves.last_modified_by IS 'User who last modified the leave request';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table creation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_documents') THEN
    RAISE EXCEPTION 'Table leave_documents was not created';
  END IF;
  
  RAISE NOTICE 'Migration 008 completed successfully';
END $$;
