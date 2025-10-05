-- ============================================================================
-- MIGRATION: 009_storage_bucket_configuration.sql
-- Description: Create and configure leave-documents storage bucket
-- Created: 2025-10-04
-- ============================================================================

-- ============================================================================
-- STORAGE BUCKET: leave-documents
-- Description: Storage bucket for leave request supporting documents
-- ============================================================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'leave-documents',
  'leave-documents',
  false, -- Not public, requires authentication
  5242880, -- 5MB file size limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

-- ============================================================================
-- STORAGE POLICIES
-- Description: Row Level Security policies for storage bucket access
-- ============================================================================

-- Policy: Authenticated users can upload files to their own folder
CREATE POLICY "Users can upload own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'leave-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can view their own documents
CREATE POLICY "Users can view own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'leave-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Managers and admins can view all documents
CREATE POLICY "Managers can view all documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'leave-documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'admin', 'hr')
    )
  );

-- Policy: Users can update their own documents (for pending requests)
CREATE POLICY "Users can update own documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'leave-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'leave-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own documents (for pending requests)
CREATE POLICY "Users can delete own documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'leave-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Admins have full access to all documents
CREATE POLICY "Admins have full access to storage"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'leave-documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'leave-documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can upload own documents" ON storage.objects IS 
  'Allows authenticated users to upload documents to their own folder in leave-documents bucket';

COMMENT ON POLICY "Users can view own documents" ON storage.objects IS 
  'Allows users to view documents they uploaded';

COMMENT ON POLICY "Managers can view all documents" ON storage.objects IS 
  'Allows managers, HR, and admins to view all documents in the bucket';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $
BEGIN
  -- Verify bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'leave-documents'
  ) THEN
    RAISE EXCEPTION 'Storage bucket leave-documents was not created';
  END IF;
  
  -- Verify bucket configuration
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets 
    WHERE id = 'leave-documents' 
    AND file_size_limit = 5242880
    AND public = false
  ) THEN
    RAISE EXCEPTION 'Storage bucket configuration is incorrect';
  END IF;
  
  RAISE NOTICE 'Storage bucket leave-documents configured successfully';
  RAISE NOTICE 'File size limit: 5MB';
  RAISE NOTICE 'Allowed MIME types: PDF, JPEG, PNG, DOC, DOCX';
  RAISE NOTICE 'Public access: Disabled (authentication required)';
END $;
