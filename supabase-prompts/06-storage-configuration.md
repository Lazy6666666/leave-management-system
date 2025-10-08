# Supabase Storage Configuration Prompt

You are setting up file storage for a leave management system using Supabase Storage. Implement secure file upload, management, and access for leave-related documents.

## Project Context
- **Application**: Leave Management System
- **Storage Needs**: Document uploads, profile images, leave certificates
- **Security**: Private access, virus scanning, file type validation

## Storage Requirements

### Storage Buckets:

1. **documents** (Private Bucket):
   - Leave certificates, medical documents
   - Payslips, ID documents
   - Company policies, handbooks

2. **avatars** (Public Bucket):
   - Employee profile pictures
   - Department logos
   - Company branding assets

3. **exports** (Private Bucket):
   - Generated reports (PDF, Excel)
   - Data export files
   - Backup archives

### Security Configuration:

1. **Bucket Policies**:
   ```sql
   -- Allow authenticated users to upload to their own folder
   CREATE POLICY "Users can upload to own folder" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'documents'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Allow users to view files in their department folder
   CREATE POLICY "Users can view department files" ON storage.objects
   FOR SELECT USING (
     bucket_id = 'documents'
     AND department_id IN (
       SELECT department_id FROM employees WHERE user_id = auth.uid()
     )
   );
   ```

2. **File Access Control**:
   - Time-limited signed URLs
   - Department-based access restrictions
   - Audit logging for file access

3. **File Validation**:
   - File type restrictions (PDF, DOC, images only)
   - File size limits (max 10MB)
   - Virus scanning integration
   - Metadata extraction

### Upload Implementation:

1. **Frontend Upload**:
   ```typescript
   const uploadDocument = async (file: File, leaveRequestId: string) => {
     const fileExt = file.name.split('.').pop();
     const fileName = `${leaveRequestId}/${Date.now()}.${fileExt}`;

     const { data, error } = await supabase.storage
       .from('documents')
       .upload(fileName, file, {
         cacheControl: '3600',
         upsert: false
       });

     if (error) throw error;
     return data;
   };
   ```

2. **Progress Tracking**:
   - Upload progress indicators
   - Pause/resume functionality
   - Error recovery mechanisms

### Document Management Features:

1. **Document Types**:
   - Medical certificates for sick leave
   - Vacation booking confirmations
   - Training certificates
   - Company policy acknowledgments

2. **Version Control**:
   - Document versioning for updates
   - Change tracking and audit trails
   - Document approval workflows

3. **Search and Organization**:
   - Document tagging and categorization
   - Full-text search capabilities
   - Folder structure by department/request type

### Integration Points:
- **Leave Request Flow**: Attach documents to requests
- **HR Document Management**: Centralized document storage
- **Employee Self-Service**: Personal document management
- **Reporting**: Document inclusion in reports

### Compliance and Retention:
- Data retention policies
- GDPR compliance for personal documents
- Backup and disaster recovery
- Access logging for audit purposes
