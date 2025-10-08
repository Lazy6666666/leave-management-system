-- ============================================================================
-- MIGRATION: 20251007195608_create_missing_storage_buckets.sql
-- Description: Create and configure company-documents and profile-photos storage buckets
-- Created: 2025-10-07
-- ============================================================================

-- ============================================================================
-- STORAGE BUCKET: company-documents
-- Description: Storage bucket for company policy documents, handbooks, forms
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-documents',
  'company-documents',
  false, -- Not public, requires authentication
  52428800, -- 50MB file size limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'text/plain'
  ];

-- RLS Policies for company-documents
DROP POLICY IF EXISTS "HR and Admin can manage all company documents" ON storage.objects;
CREATE POLICY "HR and Admin can manage all company documents"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('hr', 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'company-documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('hr', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can view own company documents" ON storage.objects;
CREATE POLICY "Users can view own company documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- STORAGE BUCKET: profile-photos
-- Description: Storage bucket for user profile pictures
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true, -- Public access
  2097152, -- 2MB file size limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

-- RLS Policies for profile-photos
DROP POLICY IF EXISTS "Users can manage own profile photos" ON storage.objects;
CREATE POLICY "Users can manage own profile photos"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Everyone can view profile photos" ON storage.objects;
CREATE POLICY "Everyone can view profile photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-photos');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Verify company-documents bucket exists
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'company-documents') THEN
    RAISE EXCEPTION 'Storage bucket company-documents was not created';
  END IF;

  -- Verify profile-photos bucket exists
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-photos') THEN
    RAISE EXCEPTION 'Storage bucket profile-photos was not created';
  END IF;

  RAISE NOTICE 'Missing storage buckets configured successfully';
END $$;