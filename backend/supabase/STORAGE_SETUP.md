# Storage Buckets Configuration

## ✅ Storage Buckets Successfully Configured

The Leave Management System now has complete storage bucket setup with proper security policies and file restrictions.

## 📁 Storage Buckets

### 1. **company-documents** 
- **Purpose**: Company policy documents, handbooks, forms
- **Access**: Private (authenticated users only)
- **File Size Limit**: 50 MB
- **Allowed Types**: PDF, Word docs, Excel files, Images, Text files
- **Security**: 
  - HR/Admin can upload, view, and delete all documents
  - Users can view own uploaded documents
  - Users can view public documents

### 2. **profile-photos**
- **Purpose**: User profile pictures
- **Access**: Public (anyone can view)
- **File Size Limit**: 2 MB
- **Allowed Types**: JPEG, PNG, WebP
- **Security**:
  - Users can upload/update/delete their own photos
  - Everyone can view profile photos (public bucket)

### 3. **leave-attachments**
- **Purpose**: Supporting documents for leave requests
- **Access**: Private (role-based access)
- **File Size Limit**: 10 MB
- **Allowed Types**: PDF, Images, Word documents
- **Security**:
  - Users can upload attachments for their own leave requests
  - Users can view their own attachments
  - Managers can view team member attachments
  - HR/Admin can view all attachments

## 🔐 Security Policies

### Company Documents
- ✅ HR and Admin can manage all documents
- ✅ Users can view own documents
- ✅ Users can view public documents
- ✅ HR and Admin can delete documents

### Profile Photos
- ✅ Users can manage their own photos
- ✅ Public viewing access (for displaying in UI)
- ✅ Proper folder structure by user ID

### Leave Attachments
- ✅ Users can upload for their own requests
- ✅ Role-based viewing permissions
- ✅ Department-based access for managers
- ✅ Full access for HR/Admin

## 📊 Storage Limits Summary

| Bucket | Size Limit | MIME Types | Public |
|--------|------------|------------|---------|
| company-documents | 50 MB | 8 types (PDF, Office, Images) | No |
| profile-photos | 2 MB | 3 types (Images only) | Yes |
| leave-attachments | 10 MB | 5 types (PDF, Images, Word) | No |

## 🚀 Usage in Application

### Frontend Integration
```typescript
// Upload profile photo
const { data, error } = await supabase.storage
  .from('profile-photos')
  .upload(`${userId}/avatar.jpg`, file)

// Upload company document
const { data, error } = await supabase.storage
  .from('company-documents')
  .upload(`documents/${filename}`, file)

// Upload leave attachment
const { data, error } = await supabase.storage
  .from('leave-attachments')
  .upload(`${userId}/${leaveId}/${filename}`, file)
```

### File Structure
```
profile-photos/
  ├── {user-id}/
  │   └── avatar.jpg

company-documents/
  ├── policies/
  ├── forms/
  └── handbooks/

leave-attachments/
  ├── {user-id}/
  │   ├── {leave-id}/
  │   │   ├── medical-certificate.pdf
  │   │   └── supporting-doc.jpg
```

## ✅ Production Ready

The storage system is now fully configured and production-ready with:
- ✅ Proper security policies
- ✅ File size and type restrictions
- ✅ Role-based access control
- ✅ Organized folder structure
- ✅ Public/private bucket configuration

## 🔧 Environment Variables

Make sure these are set in your environment:
```bash
NEXT_PUBLIC_STORAGE_BUCKET=company-documents
MAX_FILE_SIZE=52428800  # 50MB for company docs
PROFILE_PHOTO_MAX_SIZE=2097152  # 2MB for profile photos
LEAVE_ATTACHMENT_MAX_SIZE=10485760  # 10MB for leave attachments
```

## 📝 Next Steps

1. **Frontend Integration**: Update file upload components to use these buckets
2. **File Management**: Implement file deletion when records are removed
3. **Monitoring**: Set up storage usage monitoring
4. **Backup**: Configure automated backups for important documents

---

**Storage setup completed successfully!** 🎉