-- ============================================================================
-- MIGRATION: 010_leave_documents_and_audit_trail.sql
-- Description: Add document upload support and audit trail for leave requests
-- Created: 2025-01-04
-- Related to: Leave Management Enhancements Spec
-- ============================================================================

-- ============================================================================
-- 1. CREATE LEAVE_DOCUMENTS TABLE
-- ============================================================================

-- Table for storing leave document metadata
CREATE TABLE IF NOT EXISTS leave_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leave_request_id UUID NOT NULL REFERENCES leaves(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 5242880), -- 5MB limit
  CONSTRAINT valid_file_name CHECK (LENGTH(file_name) > 0 AND LENGTH(file_name) <= 255),
  CONSTRAINT valid_storage_path CHECK (LENGTH(storage_path) > 0)
);

-- ============================================================================
-- 2. ADD AUDIT TRAIL COLUMNS TO LEAVES TABLE
-- ============================================================================

-- Add audit trail columns if they don't exist
ALTER TABLE leaves 
  ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for querying documents by leave request
CREATE INDEX IF NOT EXISTS idx_leave_documents_request 
  ON leave_documents(leave_request_id);

-- Index for querying documents by uploader
CREATE INDEX IF NOT EXISTS idx_leave_documents_uploader 
  ON leave_documents(uploaded_by);

-- Index for querying documents by upload date
CREATE INDEX IF NOT EXISTS idx_leave_documents_uploaded_at 
  ON leave_documents(uploaded_at DESC);

-- Index for querying modified leave requests
CREATE INDEX IF NOT EXISTS idx_leaves_modified 
  ON leaves(last_modified_at DESC) 
  WHERE last_modified_at IS NOT NULL;

-- Index for querying leaves by modifier
CREATE INDEX IF NOT EXISTS idx_leaves_modified_by 
  ON leaves(last_modified_by) 
  WHERE last_modified_by IS NOT NULL;

-- ============================================================================
-- 4. CREATE TRIGGER FOR AUDIT TRAIL
-- ============================================================================

-- Function to update audit trail on leave modification
CREATE OR REPLACE FUNCTION update_leave_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update audit trail if actual data changed (not just updated_at)
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

-- Create trigger for audit trail
DROP TRIGGER IF EXISTS update_leave_audit_trail_trigger ON leaves;
CREATE TRIGGER update_leave_audit_trail_trigger
  BEFORE UPDATE ON leaves
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_audit_trail();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on leave_documents table
ALTER TABLE leave_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own documents
CREATE POLICY "Users can view their own leave documents"
  ON leave_documents
  FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR
    -- Users can view documents for their own leave requests
    leave_request_id IN (
      SELECT id FROM leaves WHERE requester_id = auth.uid()
    )
  );

-- Policy: Managers can view documents for their team's leave requests
CREATE POLICY "Managers can view team leave documents"
  ON leave_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'admin', 'hr')
    )
  );

-- Policy: Users can upload documents for their own leave requests
CREATE POLICY "Users can upload documents for their leave requests"
  ON leave_documents
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND
    leave_request_id IN (
      SELECT id FROM leaves WHERE requester_id = auth.uid()
    )
  );

-- Policy: Users can delete their own documents (only for pending requests)
CREATE POLICY "Users can delete their own documents for pending requests"
  ON leave_documents
  FOR DELETE
  USING (
    uploaded_by = auth.uid()
    AND
    leave_request_id IN (
      SELECT id FROM leaves 
      WHERE requester_id = auth.uid() 
      AND status = 'pending'
    )
  );

-- Policy: Admins have full access to all documents
CREATE POLICY "Admins have full access to leave documents"
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
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to get documents for a leave request
CREATE OR REPLACE FUNCTION get_leave_documents(p_leave_request_id UUID)
RETURNS TABLE (
  id UUID,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  storage_path TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ,
  uploader_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ld.id,
    ld.file_name,
    ld.file_size,
    ld.file_type,
    ld.storage_path,
    ld.uploaded_by,
    ld.uploaded_at,
    p.full_name as uploader_name
  FROM leave_documents ld
  LEFT JOIN profiles p ON p.id = ld.uploaded_by
  WHERE ld.leave_request_id = p_leave_request_id
  ORDER BY ld.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total document size for a leave request
CREATE OR REPLACE FUNCTION get_leave_request_total_document_size(p_leave_request_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total_size INTEGER;
BEGIN
  SELECT COALESCE(SUM(file_size), 0)
  INTO v_total_size
  FROM leave_documents
  WHERE leave_request_id = p_leave_request_id;
  
  RETURN v_total_size;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can edit a leave request
CREATE OR REPLACE FUNCTION can_edit_leave_request(p_leave_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_edit BOOLEAN;
BEGIN
  SELECT 
    (requester_id = p_user_id AND status = 'pending')
  INTO v_can_edit
  FROM leaves
  WHERE id = p_leave_id;
  
  RETURN COALESCE(v_can_edit, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE leave_documents IS 'Metadata for documents attached to leave requests';
COMMENT ON COLUMN leaves.last_modified_at IS 'Timestamp of last modification to leave request';
COMMENT ON COLUMN leaves.last_modified_by IS 'User who last modified the leave request';
COMMENT ON FUNCTION update_leave_audit_trail() IS 'Automatically updates audit trail when leave request is modified';
COMMENT ON FUNCTION get_leave_documents(UUID) IS 'Retrieves all documents for a specific leave request with uploader details';
COMMENT ON FUNCTION get_leave_request_total_document_size(UUID) IS 'Calculates total size of all documents for a leave request';
COMMENT ON FUNCTION can_edit_leave_request(UUID, UUID) IS 'Checks if a user can edit a specific leave request';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  -- Check if leave_documents table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_documents') THEN
    RAISE EXCEPTION 'Migration failed: leave_documents table not created';
  END IF;
  
  -- Check if audit columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaves' AND column_name = 'last_modified_at'
  ) THEN
    RAISE EXCEPTION 'Migration failed: last_modified_at column not added to leaves table';
  END IF;
  
  RAISE NOTICE 'Migration 010_leave_documents_and_audit_trail.sql completed successfully';
END $$;
