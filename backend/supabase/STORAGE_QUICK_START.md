# Storage Quick Start Guide

Quick reference for working with the leave-documents storage bucket.

## Setup (One-Time)

```bash
# Navigate to backend directory
cd backend

# Apply the storage migration
npx supabase db push

# Verify setup
# Run verify-storage-setup.sql in Supabase SQL Editor
```

## Configuration Summary

- **Bucket**: `leave-documents`
- **Max Size**: 5MB per file
- **Types**: PDF, JPEG, PNG, DOC, DOCX
- **Access**: Authenticated users only

## File Path Format

```
{user_id}/{leave_request_id}/{timestamp}_{filename}
```

Example:
```
550e8400-e29b-41d4-a716-446655440000/660e8400-e29b-41d4-a716-446655440001/1704067200000_certificate.pdf
```

## Frontend Usage

### Import Utilities

```typescript
import {
  uploadDocument,
  getDocumentDownloadUrl,
  deleteDocument,
  validateFile,
  formatFileSize,
  STORAGE_CONFIG
} from '@/lib/storage-utils';
```

### Upload Document

```typescript
// Validate first
const validation = validateFile(file);
if (!validation.valid) {
  console.error(validation.error);
  return;
}

// Upload
const result = await uploadDocument(file, userId, leaveRequestId);
if (result.success) {
  // Save metadata to database
  await supabase.from('leave_documents').insert({
    leave_request_id: leaveRequestId,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type,
    storage_path: result.storagePath,
    uploaded_by: userId
  });
}
```

### Download Document

```typescript
// Get signed URL
const result = await getDocumentDownloadUrl(storagePath);
if (result.success) {
  // Open in new tab
  window.open(result.signedUrl, '_blank');
  
  // Or trigger download
  const link = document.createElement('a');
  link.href = result.signedUrl;
  link.download = fileName;
  link.click();
}
```

### Delete Document

```typescript
// Delete from storage
const deleted = await deleteDocument(storagePath);
if (deleted) {
  // Delete metadata from database
  await supabase
    .from('leave_documents')
    .delete()
    .eq('storage_path', storagePath);
}
```

## Access Control

### Employee
- ✅ Upload to own folder
- ✅ View own documents
- ✅ Delete own documents
- ❌ View other users' documents

### Manager/HR
- ✅ View all documents
- ❌ Upload to others' folders
- ❌ Delete others' documents

### Admin
- ✅ Full access (all operations)

## Validation Rules

### Client-Side (Before Upload)

```typescript
// File size
if (file.size > 5 * 1024 * 1024) {
  // Error: File too large
}

// File type
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
if (!allowedTypes.includes(file.type)) {
  // Error: Invalid file type
}
```

### Server-Side (Automatic)
- Bucket enforces 5MB limit
- Bucket enforces MIME type restrictions
- RLS policies enforce access control

## Common Patterns

### Upload with Progress

```typescript
const [progress, setProgress] = useState(0);

const handleUpload = async (file: File) => {
  setProgress(0);
  
  // Simulate progress (Supabase doesn't provide real-time progress)
  const interval = setInterval(() => {
    setProgress(prev => Math.min(prev + 10, 90));
  }, 100);
  
  const result = await uploadDocument(file, userId, leaveRequestId);
  
  clearInterval(interval);
  setProgress(100);
  
  return result;
};
```

### Multiple Files

```typescript
const uploadMultiple = async (files: File[]) => {
  const results = await Promise.all(
    files.map(file => uploadDocument(file, userId, leaveRequestId))
  );
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  return { successful, failed };
};
```

### File Preview

```typescript
const getPreviewUrl = (file: File) => {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return null; // No preview for non-images
};
```

## Error Handling

### Upload Errors

```typescript
const result = await uploadDocument(file, userId, leaveRequestId);
if (!result.success) {
  switch (result.error) {
    case 'File size exceeds maximum limit':
      toast.error('File is too large. Maximum size is 5MB.');
      break;
    case 'File type not allowed':
      toast.error('Invalid file type. Please upload PDF, JPEG, PNG, DOC, or DOCX.');
      break;
    default:
      toast.error('Upload failed. Please try again.');
  }
}
```

### Download Errors

```typescript
const result = await getDocumentDownloadUrl(storagePath);
if (!result.success) {
  if (result.error?.includes('not found')) {
    toast.error('Document not found.');
  } else {
    toast.error('Failed to download document.');
  }
}
```

## Testing

### Manual Test

```typescript
// 1. Create test file
const testFile = new File(['test content'], 'test.pdf', {
  type: 'application/pdf'
});

// 2. Upload
const result = await uploadDocument(testFile, userId, leaveRequestId);
console.log('Upload result:', result);

// 3. Download
if (result.success) {
  const download = await getDocumentDownloadUrl(result.storagePath);
  console.log('Download URL:', download.signedUrl);
}

// 4. Delete
if (result.success) {
  const deleted = await deleteDocument(result.storagePath);
  console.log('Deleted:', deleted);
}
```

### Unit Test Example

```typescript
import { validateFile, formatFileSize } from '@/lib/storage-utils';

describe('Storage Utils', () => {
  it('validates file size', () => {
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf');
    const result = validateFile(largeFile);
    expect(result.valid).toBe(false);
  });
  
  it('formats file size', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
  });
});
```

## Troubleshooting

### "new row violates row-level security policy"
- Check user is authenticated
- Verify path starts with user's ID
- Confirm user profile exists

### "File not found"
- Verify storage_path in database
- Check file wasn't deleted
- Ensure signed URL hasn't expired

### "File type not allowed"
- Check MIME type matches allowed list
- Verify file extension is correct
- Try re-saving file in correct format

## Next Steps

1. ✅ Storage bucket configured
2. 🔲 Implement DocumentUpload component (Task 4)
3. 🔲 Integrate with leave request form (Task 5)
4. 🔲 Create documents management page (Task 9)

## Resources

- Full Documentation: `STORAGE_CONFIGURATION.md`
- Setup Guide: `009_STORAGE_SETUP_GUIDE.md`
- Migration File: `009_storage_bucket_configuration.sql`
- Verification: `verify-storage-setup.sql`
