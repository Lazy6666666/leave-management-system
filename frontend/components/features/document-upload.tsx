import * as React from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, FileImage, File, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/ui/button'
import { Progress } from '@/ui/progress'
import { Alert, AlertDescription } from '@/ui/alert'
import {
  validateFile,
  formatFileSize,
  getFileTypeIcon,
  STORAGE_CONFIG,
  type FileValidationResult,
} from '@/lib/storage-utils'
import { cn } from '@/lib/utils'
import { showFileUploadError, showValidationError } from '@/lib/toast'
import { logError } from '@/lib/errors'

export interface DocumentFile {
  file: File
  preview?: string
  error?: string
}

export interface DocumentUploadProps {
  /** Current uploaded documents */
  documents: DocumentFile[]
  /** Callback when documents change */
  onDocumentsChange: (documents: DocumentFile[]) => void
  /** Maximum number of files allowed */
  maxFiles?: number
  /** Whether upload is disabled */
  disabled?: boolean
  /** Show upload progress */
  uploading?: boolean
  /** Upload progress percentage (0-100) */
  uploadProgress?: number
  /** Custom class name */
  className?: string
}

const iconMap = {
  FileText,
  FileImage,
  File,
}

export function DocumentUpload({
  documents,
  onDocumentsChange,
  maxFiles = 5,
  disabled = false,
  uploading = false,
  uploadProgress = 0,
  className,
}: DocumentUploadProps) {
  const [validationError, setValidationError] = React.useState<string | null>(null)

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      setValidationError(null)

      // Check if adding files would exceed max
      if (documents.length + acceptedFiles.length > maxFiles) {
        const errorMsg = `Maximum ${maxFiles} files allowed`
        setValidationError(errorMsg)
        showValidationError('File Upload', errorMsg)
        return
      }

      // Validate each file
      const newDocuments: DocumentFile[] = []
      let hasError = false

      for (const file of acceptedFiles) {
        const validation: FileValidationResult = validateFile(file)

        if (!validation.valid) {
          hasError = true
          const errorMsg = validation.error || 'Invalid file'
          setValidationError(errorMsg)
          showValidationError(file.name, errorMsg)
          
          logError(new Error(errorMsg), {
            context: 'file_validation_failed',
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          })
          break
        }

        // Create preview for images
        const preview = file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined

        newDocuments.push({
          file,
          preview,
        })
      }

      if (!hasError && newDocuments.length > 0) {
        onDocumentsChange([...documents, ...newDocuments])
      }
    },
    [documents, maxFiles, onDocumentsChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: STORAGE_CONFIG.MAX_FILE_SIZE,
    disabled: disabled || uploading || documents.length >= maxFiles,
    multiple: maxFiles > 1,
  })

  const removeDocument = (index: number) => {
    const newDocuments = [...documents]
    const removed = newDocuments.splice(index, 1)[0]

    // Revoke preview URL if exists
    if (removed?.preview) {
      URL.revokeObjectURL(removed.preview)
    }

    onDocumentsChange(newDocuments)
    setValidationError(null)
  }

  // Cleanup preview URLs on unmount
  React.useEffect(() => {
    return () => {
      documents.forEach((doc) => {
        if (doc.preview) {
          URL.revokeObjectURL(doc.preview)
        }
      })
    }
  }, [documents])

  const getFileIcon = (mimeType: string) => {
    const iconName = getFileTypeIcon(mimeType)
    const Icon = iconMap[iconName as keyof typeof iconMap] || File
    return Icon
  }

  const canAddMore = documents.length < maxFiles && !disabled && !uploading

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      {canAddMore && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            'hover:border-primary hover:bg-accent/50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isDragActive && 'border-primary bg-accent/50',
            (disabled || uploading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, JPEG, PNG, DOC, DOCX (max {STORAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB)
            </p>
            {maxFiles > 1 && (
              <p className="text-xs text-muted-foreground">
                {documents.length} / {maxFiles} files
              </p>
            )}
          </div>
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Uploading documents...</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Attached Documents ({documents.length})
          </p>
          <div className="space-y-2">
            {documents.map((doc, index) => {
              const Icon = getFileIcon(doc.file.type)
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                >
                  {/* Preview or Icon */}
                  {doc.preview ? (
                    <img
                      src={doc.preview}
                      alt={doc.file.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center bg-muted rounded">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={doc.file.name}>
                      {doc.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file.size)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  {!uploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDocument(index)}
                      disabled={disabled}
                      aria-label={`Remove ${doc.file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Helper Text */}
      {documents.length === 0 && !canAddMore && (
        <p className="text-sm text-muted-foreground text-center">
          No documents attached
        </p>
      )}
    </div>
  )
}
