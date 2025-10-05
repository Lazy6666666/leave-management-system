-- ============================================================================
-- VERIFICATION SCRIPT: verify-storage-setup.sql
-- Description: Verify leave-documents storage bucket configuration
-- Usage: Run this after applying migration 009
-- ============================================================================

-- Check 1: Verify bucket exists
SELECT 
  '✓ Bucket Exists' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'leave-documents')
    THEN 'PASS'
    ELSE 'FAIL'
  END as status;

-- Check 2: Verify bucket configuration
SELECT 
  '✓ Bucket Configuration' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets 
      WHERE id = 'leave-documents' 
      AND file_size_limit = 5242880
      AND public = false
    )
    THEN 'PASS'
    ELSE 'FAIL'
  END as status;

-- Check 3: Verify allowed MIME types
SELECT 
  '✓ Allowed MIME Types' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets 
      WHERE id = 'leave-documents'
      AND 'application/pdf' = ANY(allowed_mime_types)
      AND 'image/jpeg' = ANY(allowed_mime_types)
      AND 'image/png' = ANY(allowed_mime_types)
    )
    THEN 'PASS'
    ELSE 'FAIL'
  END as status;

-- Check 4: Count storage policies
SELECT 
  '✓ Storage Policies Count' as check_name,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM pg_policies 
      WHERE tablename = 'objects' 
      AND policyname LIKE '%documents%'
    ) >= 5
    THEN 'PASS (' || (
      SELECT COUNT(*) 
      FROM pg_policies 
      WHERE tablename = 'objects' 
      AND policyname LIKE '%documents%'
    )::text || ' policies)'
    ELSE 'FAIL'
  END as status;

-- Check 5: Verify specific policies exist
SELECT 
  '✓ Upload Policy' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'objects' 
      AND policyname = 'Users can upload own documents'
    )
    THEN 'PASS'
    ELSE 'FAIL'
  END as status
UNION ALL
SELECT 
  '✓ View Policy' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'objects' 
      AND policyname = 'Users can view own documents'
    )
    THEN 'PASS'
    ELSE 'FAIL'
  END as status
UNION ALL
SELECT 
  '✓ Manager View Policy' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'objects' 
      AND policyname = 'Managers can view all documents'
    )
    THEN 'PASS'
    ELSE 'FAIL'
  END as status
UNION ALL
SELECT 
  '✓ Admin Policy' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'objects' 
      AND policyname = 'Admins have full access to storage'
    )
    THEN 'PASS'
    ELSE 'FAIL'
  END as status;

-- Detailed bucket information
SELECT 
  '=== BUCKET DETAILS ===' as section,
  '' as info
UNION ALL
SELECT 
  'Bucket ID' as section,
  id as info
FROM storage.buckets 
WHERE id = 'leave-documents'
UNION ALL
SELECT 
  'Public Access' as section,
  public::text as info
FROM storage.buckets 
WHERE id = 'leave-documents'
UNION ALL
SELECT 
  'File Size Limit' as section,
  (file_size_limit::float / 1024 / 1024)::text || ' MB' as info
FROM storage.buckets 
WHERE id = 'leave-documents'
UNION ALL
SELECT 
  'Allowed MIME Types' as section,
  array_to_string(allowed_mime_types, ', ') as info
FROM storage.buckets 
WHERE id = 'leave-documents';

-- List all storage policies
SELECT 
  '=== STORAGE POLICIES ===' as policy_name,
  '' as command,
  '' as definition
UNION ALL
SELECT 
  policyname as policy_name,
  cmd as command,
  pg_get_expr(qual, 'storage.objects'::regclass) as definition
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%documents%'
ORDER BY policyname;

-- Summary
SELECT 
  '=== SUMMARY ===' as message
UNION ALL
SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM storage.buckets 
      WHERE id = 'leave-documents' 
      AND file_size_limit = 5242880 
      AND public = false
    ) = 1
    AND (
      SELECT COUNT(*) 
      FROM pg_policies 
      WHERE tablename = 'objects' 
      AND policyname LIKE '%documents%'
    ) >= 5
    THEN '✅ Storage configuration is complete and correct!'
    ELSE '❌ Storage configuration has issues. Review the checks above.'
  END as message;
