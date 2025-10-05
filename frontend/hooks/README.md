# Custom React Hooks

This directory contains custom React hooks for the Leave Management System.

## Leave Document Hooks (`use-leave-documents.ts`)

### `useLeaveDocuments(options?)`

Fetches leave documents with optional filtering by leave request ID.

**Parameters:**
- `options.leaveRequestId` (optional): Filter documents by leave request
- `options.enabled` (optional): Enable/disable the query (default: true)

**Returns:** React Query result with `LeaveDocument[]`

**Features:**
- 5-minute stale time caching
- Automatic retry with exponential backoff (3 attempts)
- Sorted by upload date (newest first)

**Example:**
```typescript
const { data: documents, isLoading, error } = useLeaveDocuments({
  leaveRequestId: 'leave-123',
})
```

### `useLeaveWithDocuments(leaveRequestId, enabled?)`

Fetches a single leave request with all associated documents and relations.

**Parameters:**
- `leaveRequestId`: The leave request ID
- `enabled` (optional): Enable/disable the query (default: true)

**Returns:** React Query result with `LeaveWithDocuments`

**Features:**
- Performs JOIN with profiles and leave_types
- Includes all associated documents
- 5-minute stale time caching
- Automatic retry with exponential backoff

**Example:**
```typescript
const { data: leave, isLoading } = useLeaveWithDocuments('leave-123')
// Access: leave.documents, leave.requester, leave.leave_type
```

### `useUploadDocument()`

Uploads a document to Supabase Storage and creates metadata record.

**Returns:** React Query mutation

**Features:**
- Uploads to `leave-documents` bucket
- Creates metadata in `leave_documents` table
- Automatic cleanup on failure
- Invalidates relevant queries on success
- Retry with exponential backoff (2 attempts)

**Example:**
```typescript
const uploadMutation = useUploadDocument()

const handleUpload = async (file: File) => {
  try {
    const document = await uploadMutation.mutateAsync({
      leaveRequestId: 'leave-123',
      file,
    })
    console.log('Uploaded:', document)
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

### `useDeleteDocument()`

Deletes a document from both storage and database.

**Returns:** React Query mutation

**Features:**
- Removes file from Supabase Storage
- Deletes metadata from database
- Invalidates relevant queries
- Retry with exponential backoff (2 attempts)

**Example:**
```typescript
const deleteMutation = useDeleteDocument()

const handleDelete = async (documentId: string) => {
  await deleteMutation.mutateAsync(documentId)
}
```

### `useDownloadDocument()`

Generates a signed URL for downloading a document.

**Returns:** React Query mutation

**Features:**
- Creates signed URL with 1-hour expiry
- Secure access control via RLS
- Retry with exponential backoff (2 attempts)

**Example:**
```typescript
const downloadMutation = useDownloadDocument()

const handleDownload = async (documentId: string) => {
  const url = await downloadMutation.mutateAsync(documentId)
  window.open(url, '_blank')
}
```

## Leave Edit Hooks (`use-leave-edit.ts`)

### `useLeaveEdit()`

Updates a leave request with optimistic updates.

**Returns:** React Query mutation

**Features:**
- Only allows editing pending requests
- Validates ownership
- Optimistic UI updates
- Automatic rollback on error
- Updates audit trail
- Invalidates relevant queries
- Retry with exponential backoff (2 attempts)

**Example:**
```typescript
const editMutation = useLeaveEdit()

const handleEdit = async () => {
  try {
    await editMutation.mutateAsync({
      id: 'leave-123',
      start_date: '2025-10-15',
      end_date: '2025-10-20',
      leave_type_id: 'type-456',
      reason: 'Updated vacation plans',
      days_count: 5,
    })
  } catch (error) {
    console.error('Edit failed:', error)
  }
}
```

### `useCancelLeave()`

Cancels a leave request.

**Returns:** React Query mutation

**Features:**
- Only allows canceling pending/approved requests
- Validates ownership
- Prevents canceling past leaves
- Optimistic UI updates
- Automatic rollback on error
- Retry with exponential backoff (2 attempts)

**Example:**
```typescript
const cancelMutation = useCancelLeave()

const handleCancel = async (leaveId: string) => {
  await cancelMutation.mutateAsync({ id: leaveId })
}
```

### `useCanEditLeave(leaveId)`

Validates if a leave request can be edited.

**Parameters:**
- `leaveId`: The leave request ID

**Returns:** React Query mutation that returns boolean

**Example:**
```typescript
const canEditMutation = useCanEditLeave('leave-123')

const checkEditPermission = async () => {
  const canEdit = await canEditMutation.mutateAsync()
  if (canEdit) {
    // Show edit button
  }
}
```

## Error Handling

All hooks implement comprehensive error handling:

1. **Authentication Errors**: Thrown when user is not authenticated
2. **Authorization Errors**: Thrown when user lacks permission
3. **Validation Errors**: Thrown when business rules are violated
4. **Network Errors**: Automatically retried with exponential backoff
5. **Database Errors**: Wrapped with user-friendly messages

## Caching Strategy

- **Leave Documents**: 5-minute stale time
- **Leave with Documents**: 5-minute stale time
- **Automatic Invalidation**: Queries are invalidated after mutations

## Query Keys

- `['leave-documents']` - All documents
- `['leave-documents', leaveRequestId]` - Documents for specific leave
- `['leave-with-documents', leaveRequestId]` - Leave with documents
- `['leaves']` - All leaves (invalidated on edit/cancel)
- `['leave-balance']` - Leave balance (invalidated on edit/cancel)

## Best Practices

1. **Enable/Disable Queries**: Use the `enabled` option to control when queries run
2. **Loading States**: Always handle `isLoading` state in components
3. **Error Handling**: Display user-friendly error messages
4. **Optimistic Updates**: UI updates immediately, rolls back on error
5. **Retry Logic**: Network errors are automatically retried
