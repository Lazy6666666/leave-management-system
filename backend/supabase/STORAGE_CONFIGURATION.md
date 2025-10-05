# Leave Documents Storage Configuration

## Overview

This document describes the complete storage configuration for the leave management system's document upload feature.

## Storage Bucket: `leave-documents`

### Configuration

| Property | Value | Description |
|----------|-------|-------------|
| Bucket ID | `leave-documents` | Unique identifier for the storage bucket |
| Public Access | `false` | Requires authentication to access |
| File Size Limit | 5MB (5,242,880 bytes) | Maximum file size per upload |
| Allowed MIME Types | 6 types | PDF, JPEG, PNG, DOC, DOCX |

### Allowed File Types

1. **PDF Documents**
   - MIME Type: `application/pdf`
   - Extension: `.pdf`
   - Use Case: Medical certificates, official documents

2. **JPEG Images**
   - MIME Types: `image/jpeg`, `image/jpg`
   - Extensions: `.jpg`, `.jpeg`
   - Use Case: Scanned documents, photos

3. **PNG Images**
   - MIME Type: `image/png`
   - Extension: `.png`
   - Use Case: Screenshots, scanned documents

4. **Microsoft Word Documents**
   - MIME Types: 
     - `application/msword` (DOC)
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)
   - Extensions: `.doc`, `.docx`
   - Use Case: Leave request letters, supporting documents

## File Organization Structure

Files are organized hierarchically by user ID and leave request ID:

```
leave-documents/
└── {user_id}/                    # User's folder (UUID)
    └── {leave_request_id}/       # Leave request folder (UUID)
        └── {timestamp}_{filename} # Actual file with timestamp prefix
```

### Example Structure

```
leave-documents/
├── 550e8400-e29b-41d4-a716-446655440000/
│   ├── 660e8400-e29b-41d4-a716-446655440001/
│   │   ├── 1704067200000_medical_certificate.pdf
│   │   └── 1704067300000_doctors_note.jpg
│   └── 770e8400-e29b-41d4-a716-446655440002/
│       └── 1704154800000_leave_request.docx
└── 880e8400-e29b-41d4-a716-446655440003/
    └── 990e8400-e29b-41d4-a716-446655440004/
        └── 1704241200000_certificate.pdf
```

### Path Components

1. **User ID**: The authenticated user's UUID from `auth.users`
2. **Leave Request ID**: The UUID of the leave request from `leaves` table
3. **Timestamp**: Unix timestamp in milliseconds (prevents filename collisions)
4. **Filename**: Original filename, sanitized to remove special characters

## Access Control Policies

### Row Level Security (RLS) Policies

The storage bucket uses RLS policies to control access:

#### 1. Upload Policy: "Users can upload own documents"
- **Operation**: INSERT
- **Who**: Authenticated users
- **Condition**: File path must start with user's own ID
- **Purpose**: Users can only upload to their own folder

#### 2. View Policy: "Users can view own documents"
- **Operation**: SELECT
- **Who**: Authenticated users
- **Condition**: File path starts with user's ID
- **Purpose**: Users can view their uploaded documents

#### 3. Manager View Policy: "Managers can view all documents"
- **Operation**: SELECT
- **Who**: Users with role `manager`, `admin`, or `hr`
- **Condition**: User has elevated role in profiles table
- **Purpose**: Managers can view team documents for approval

#### 4. Update Policy: "Users can update own documents"
- **Operation**: UPDATE
- **Who**: Authenticated users
- **Condition**: File path starts with user's ID
- **Purpose**: Users can replace their documents

#### 5. Delete Policy: "Users can delete own documents"
- **Operation**: DELETE
- **Who**: Authenticated users
- **Condition**: File path starts with user's ID
- **Purpose**: Users can remove their documents

#### 6. Admin Policy: "Admins have full access to storage"
- **Operation**: ALL (SELECT, INSERT, UPDATE, DELETE)
- **Who**: Users with role `admin`
- **Condition**: User is admin in profiles table
- **Purpose**: Admins have complete control

## Security Features

### 1. Authentication Required
- All operations require a valid Supabase authentication token
- Anonymous access is completely blocked

### 2. Path-Based Isolation
- Users can only access files in their own folder (`{user_id}/`)
- Path validation prevents directory traversal attacks

### 3. Role-Based Access Control
- Employees: Access own documents only
- Managers/HR: View all documents (read-only)
- Admins: Full CRUD access to all documents

### 4. File Type Validation
- Server-side MIME type checking
- Only whitelisted file types are accepted
- Prevents upload of executable files or scripts

### 5. File Size Limits
- Hard limit of 5MB enforced at bucket level
- Prevents storage abuse and large file uploads

### 6. Signed URLs
- Downloads use temporary signed URLs
- URLs expire after 1 hour (3600 seconds)
- Prevents unauthorized sharing of direct links

## Database Integration

### Table: `leave_documents`

The storage bucket works in conjunction with the `leave_documents` table:

```sql
CREATE TABLE leave_documents (
  id UUID PRIMARY KEY,
  leave_request_id UUID REFERENCES leaves(id),
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,  -- Path in storage bucket
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Workflow

1. **Upload**: File uploaded to storage bucket
2. **Metadata**: Record created in `leave_documents` table
3. **Association**: Linked to leave request via `leave_request_id`
4. **Download**: Signed URL generated from `storage_path`

## API Integration

### Frontend Utilities

Location: `frontend/lib/storage-utils.ts`

Key functions:
- `validateFile(file)`: Client-side validation
- `uploadDocument(file, userId, leaveRequestId)`: Upload file
- `getDocumentDownloadUrl(storagePath)`: Get signed URL
- `deleteDocument(storagePath)`: Remove file
- `formatFileSize(bytes)`: Display file size
- `getFileTypeIcon(mimeType)`: Get icon for file type

### Usage Example

```typescript
import { uploadDocument, getDocumentDownloadUrl } from '@/lib/storage-utils';

// Upload
const result = await uploadDocument(file, userId, leaveRequestId);
if (result.success) {
  console.log('Uploaded to:', result.storagePath);
}

// Download
const download = await getDocumentDownloadUrl(storagePath);
if (download.success) {
  window.open(download.signedUrl, '_blank');
}
```

## Migration Files

### Primary Migration
- **File**: `009_storage_bucket_configuration.sql`
- **Purpose**: Create bucket and configure RLS policies
- **Run**: `npx supabase db push`

### Verification Script
- **File**: `verify-storage-setup.sql`
- **Purpose**: Verify configuration is correct
- **Run**: Execute in Supabase SQL Editor

### Setup Guide
- **File**: `009_STORAGE_SETUP_GUIDE.md`
- **Purpose**: Detailed setup instructions
- **Includes**: Troubleshooting and examples

## Testing Checklist

After applying the migration, verify:

- [ ] Bucket exists with correct name
- [ ] Public access is disabled
- [ ] File size limit is 5MB
- [ ] All 6 MIME types are allowed
- [ ] All 6 RLS policies are active
- [ ] Test upload as employee (should succeed)
- [ ] Test upload to another user's folder (should fail)
- [ ] Test view as manager (should see all documents)
- [ ] Test download with signed URL (should work)
- [ ] Test upload oversized file (should fail)
- [ ] Test upload invalid file type (should fail)

## Monitoring and Maintenance

### Storage Metrics to Monitor

1. **Total Storage Used**: Track bucket size growth
2. **Upload Success Rate**: Monitor failed uploads
3. **Average File Size**: Identify usage patterns
4. **File Type Distribution**: Understand document types
5. **Access Patterns**: Monitor download frequency

### Maintenance Tasks

1. **Orphaned Files**: Clean up files without database records
2. **Old Documents**: Archive or delete old leave documents
3. **Storage Limits**: Monitor approaching storage quotas
4. **Policy Audits**: Review and update access policies

### Cleanup Query

```sql
-- Find orphaned files (files without database records)
SELECT storage_path 
FROM leave_documents 
WHERE NOT EXISTS (
  SELECT 1 FROM leaves 
  WHERE leaves.id = leave_documents.leave_request_id
);
```

## Troubleshooting

### Common Issues

#### Upload Fails with 403 Error
- **Cause**: RLS policy blocking upload
- **Solution**: Verify user is authenticated and path starts with user ID

#### File Not Found on Download
- **Cause**: Incorrect storage path or file deleted
- **Solution**: Check `storage_path` in database matches actual file

#### Manager Cannot View Documents
- **Cause**: User role not set correctly
- **Solution**: Verify role in `profiles` table is `manager`, `admin`, or `hr`

#### File Size Limit Not Enforced
- **Cause**: Bucket configuration incorrect
- **Solution**: Re-apply migration or update bucket settings manually

## Future Enhancements

Potential improvements for future versions:

1. **Document Versioning**: Track multiple versions of same document
2. **Virus Scanning**: Integrate antivirus scanning on upload
3. **Image Compression**: Automatically compress large images
4. **Document Preview**: In-browser preview for PDFs and images
5. **Bulk Upload**: Support multiple file uploads at once
6. **Document Expiry**: Auto-delete documents after retention period
7. **Audit Logging**: Track all document access and modifications
8. **CDN Integration**: Use CDN for faster document delivery

## References

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Security Best Practices](https://supabase.com/docs/guides/storage/security/access-control)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [File Upload Best Practices](https://supabase.com/docs/guides/storage/uploads)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the setup guide: `009_STORAGE_SETUP_GUIDE.md`
3. Run verification script: `verify-storage-setup.sql`
4. Check Supabase logs in dashboard
