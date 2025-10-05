# DocumentUpload Component Usage Guide

## Overview

The `DocumentUpload` component provides a complete solution for uploading documents to leave requests with drag-and-drop support, file validation, progress tracking, and error handling with retry mechanism.

## Features

- ✅ Drag-and-drop file upload
- ✅ Client-side file validation (type, size)
- ✅ File preview with name, size, and remove option
- ✅ Upload progress indicator
- ✅ Automatic retry mechanism for failed uploads
- ✅ Integration with Supabase Storage
- ✅ Metadata saving to `leave_documents` table
- ✅ Error handling with user-friendly messages
- ✅ Accessibility support (keyboard navigation, ARIA labels)

## Installation

The component requires `react-dropzone`:

```bash
npm install react-dropzone
```

## Basic Usage

```tsx
import { DocumentUpload, DocumentFile } from '@/components/features/document-upload'
import { useState } from 'react'

function MyLeaveForm() {
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  return (
    <DocumentUpload
      documents={documents}
      onDocumentsChange={setDocuments}
      uploading={uploading}
      uploadProgress={uploadProgress}
      maxFiles={5}
    />
  )
}
```

## Complete Example with Upload

```tsx
import { DocumentUpload, DocumentFile } from '@/components/features/document-upload'
import { uploadDocumentWithMetadata } from '@/lib/storage-utils'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'

function LeaveRequestForm() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleSubmit = async (leaveRequestId: string) => {
    if (documents.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const totalFiles = documents.length
      let uploadedCount = 0

      for (const doc of documents) {
        const result = await uploadDocumentWithMetadata(
          doc.file,
          user.id,
          leaveRequestId
        )

        if (!result.success) {
          console.error('Upload failed:', result.error)
          // Handle error (show toast, etc.)
        }

        uploadedCount++
        setUploadProgress((uploadedCount / totalFiles) * 100)
      }

      // Clear documents after successful upload
      setDocuments([])
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <form>
      {/* Other form fields */}
      
      <DocumentUpload
        documents={documents}
        onDocumentsChange={setDocuments}
        uploading={uploading}
        uploadProgress={uploadProgress}
        maxFiles={5}
      />
      
      <button type="submit">Submit Leave Request</button>
    </form>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `documents` | `DocumentFile[]` | Required | Current uploaded documents |
| `onDocumentsChange` | `(documents: DocumentFile[]) => void` | Required | Callback when documents change |
| `maxFiles` | `number` | `5` | Maximum number of files allowed |
| `disabled` | `boolean` | `false` | Whether upload is disabled |
| `uploading` | `boolean` | `false` | Show upload progress |
| `uploadProgress` | `number` | `0` | Upload progress percentage (0-100) |
| `className` | `string` | - | Custom class name |

## Storage Utilities

### `uploadDocumentWithMetadata`

Uploads a file to Supabase Storage and saves metadata to the database in a single transaction.

```tsx
import { uploadDocumentWithMetadata } from '@/lib/storage-utils'

const result = await uploadDocumentWithMetadata(
  file,           // File object
  userId,         // User ID
  leaveRequestId  // Leave request ID
)

if (result.success) {
  console.log('Document ID:', result.documentId)
} else {
  console.error('Error:', result.error)
}
```

### `uploadDocument`

Uploads a file to Supabase Storage with automatic retry mechanism.

```tsx
import { uploadDocument } from '@/lib/storage-utils'

const result = await uploadDocument(
  file,           // File object
  userId,         // User ID
  leaveRequestId, // Leave request ID
  3               // Max retries (optional, default: 3)
)

if (result.success) {
  console.log('Storage path:', result.storagePath)
} else {
  console.error('Error:', result.error)
}
```

### `getDocumentDownloadUrl`

Gets a signed URL for downloading a document (1-hour expiry).

```tsx
import { getDocumentDownloadUrl } from '@/lib/storage-utils'

const result = await getDocumentDownloadUrl(storagePath)

if (result.success) {
  window.open(result.signedUrl, '_blank')
} else {
  console.error('Error:', result.error)
}
```

### `deleteDocument`

Deletes a document from storage.

```tsx
import { deleteDocument } from '@/lib/storage-utils'

const success = await deleteDocument(storagePath)
```

## File Validation

The component automatically validates files based on:

- **Allowed types**: PDF, JPEG, PNG, DOC, DOCX
- **Maximum size**: 5MB
- **File name**: Sanitized to prevent path traversal

## Error Handling

The component handles various error scenarios:

1. **Invalid file type**: Shows error message with allowed formats
2. **File too large**: Shows error message with size limit
3. **Upload failure**: Automatic retry with exponential backoff (3 attempts)
4. **Metadata save failure**: Automatic cleanup of uploaded file

## Retry Mechanism

Upload failures are automatically retried up to 3 times with exponential backoff:

- 1st retry: 1 second delay
- 2nd retry: 2 seconds delay
- 3rd retry: 4 seconds delay

Duplicate file errors are not retried.

## Storage Structure

Files are stored in the following structure:

```
leave-documents/
└── {user_id}/
    └── {leave_request_id}/
        └── {timestamp}_{filename}
```

## Database Schema

Document metadata is stored in the `leave_documents` table:

```sql
CREATE TABLE leave_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leave_request_id UUID REFERENCES leave_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Accessibility

The component includes:

- Keyboard navigation support
- ARIA labels for screen readers
- Focus management
- Clear visual feedback for drag-and-drop

## Best Practices

1. **Always validate on server**: Client-side validation is for UX only
2. **Handle errors gracefully**: Show user-friendly error messages
3. **Clean up on unmount**: Preview URLs are automatically revoked
4. **Use optimistic updates**: Show progress immediately for better UX
5. **Implement proper authorization**: Check user permissions before upload

## Troubleshooting

### Upload fails with "Bucket not found"

Ensure the `leave-documents` bucket exists in Supabase Storage and has proper RLS policies.

### Upload fails with "Unauthorized"

Check that the user is authenticated and has permission to upload to the bucket.

### Files not appearing in database

Verify that the `leave_documents` table exists and the user has INSERT permissions.

### Preview not showing for images

Ensure the file type starts with `image/` and the browser supports the format.
