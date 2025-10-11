import { useState } from 'react'
import { useRouter } from 'next/router'
import { 
  FileText, 
  Download, 
  Search, 
  Loader2,
  FileIcon,
  Image as ImageIcon,
  File as FileIconGeneric
} from 'lucide-react'
import { useLeaveDocuments, useDownloadDocument } from '@/hooks/use-leave-documents'
import { useQuery } from '@tanstack/react-query'
import { getBrowserClient } from '@/lib/supabase-client'
import type { LeaveDocument, LeaveWithRelations } from '@/types'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { useToast } from '@/hooks/use-toast'

const supabase = getBrowserClient()

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Helper function to get file type icon
function getFileTypeIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />
  }
  if (fileType === 'application/pdf') {
    return <FileText className="h-5 w-5 text-red-500" />
  }
  if (
    fileType === 'application/msword' ||
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return <FileIcon className="h-5 w-5 text-blue-600" />
  }
  return <FileIconGeneric className="h-5 w-5 text-gray-500" />
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

interface DocumentWithLeave extends LeaveDocument {
  leave?: LeaveWithRelations
}

export default function DocumentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Fetch all documents for the current user
  const { data: documents, isLoading, error } = useLeaveDocuments()

  // Fetch leave request details for each document
  const { data: documentsWithLeaves, isLoading: isLoadingLeaves } = useQuery<DocumentWithLeave[], Error>({
    queryKey: ['documents-with-leaves', documents],
    queryFn: async () => {
      if (!documents || documents.length === 0) return []

      // Get unique leave request IDs
      const leaveRequestIds = Array.from(new Set(documents.map(doc => doc.leave_request_id)))

      // Fetch leave requests
      const { data: leaves, error: leavesError } = await supabase
        .from('leaves')
        .select(`
          *,
          requester:employees!requester_id(id, name, role, department),
          leave_type:leave_types(id, name, description, default_allocation_days, is_active)
        `)
        .in('id', leaveRequestIds)

      if (leavesError) {
        throw new Error(leavesError.message)
      }

      // Type assertion for leaves data
      const typedLeaves = leaves as LeaveWithRelations[] | null

      // Map documents with their leave data
      return documents.map(doc => ({
        ...doc,
        leave: typedLeaves?.find((leave: LeaveWithRelations) => leave.id === doc.leave_request_id),
      }))
    },
    enabled: !!documents && documents.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const downloadMutation = useDownloadDocument()

  const handleDownload = async (document: LeaveDocument) => {
    setDownloadingId(document.id)
    try {
      const signedUrl = await downloadMutation.mutateAsync(document.id)
      
      // Trigger download
      const link = window.document.createElement('a')
      link.href = signedUrl
      link.download = document.file_name
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)

      toast({
        title: 'Download started',
        description: `Downloading ${document.file_name}`,
      })
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Failed to download document',
        variant: 'destructive',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  // Filter documents based on search query
  const filteredDocuments = documentsWithLeaves?.filter(doc => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    const fileName = doc.file_name.toLowerCase()
    const leaveType = doc.leave?.leave_type?.name?.toLowerCase() || ''
    const requesterName = doc.leave?.requester?.name?.toLowerCase() || ''

    return (
      fileName.includes(searchLower) ||
      leaveType.includes(searchLower) ||
      requesterName.includes(searchLower)
    )
  })

  // Group documents by leave request
  const groupedDocuments = filteredDocuments?.reduce((acc, doc) => {
    const leaveId = doc.leave_request_id
    if (!acc[leaveId]) {
      acc[leaveId] = []
    }
    acc[leaveId].push(doc)
    return acc
  }, {} as Record<string, DocumentWithLeave[]>)

  if (isLoading || isLoadingLeaves) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Documents</CardTitle>
            <CardDescription>
              {error.message || 'Failed to load documents. Please try again.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasDocuments = documentsWithLeaves && documentsWithLeaves.length > 0

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            View and manage your leave request documents
          </p>
        </div>
      </div>

      {hasDocuments && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {!hasDocuments ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't uploaded any documents yet. Documents can be attached when creating or editing leave requests.
            </p>
            <Button onClick={() => router.push('/dashboard/leaves/new')}>
              Create Leave Request
            </Button>
          </CardContent>
        </Card>
      ) : filteredDocuments && filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matching documents</h3>
            <p className="text-muted-foreground text-center">
              No documents match your search criteria. Try a different search term.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedDocuments && Object.entries(groupedDocuments).map(([leaveId, docs]) => {
            const firstDoc = docs[0]
            const leave = firstDoc?.leave

            return (
              <Card key={leaveId}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {leave?.leave_type?.name || 'Unknown Leave Type'}
                  </CardTitle>
                  <CardDescription>
                    {leave?.start_date && leave?.end_date && (
                      <>
                        {new Date(leave.start_date).toLocaleDateString()} -{' '}
                        {new Date(leave.end_date).toLocaleDateString()}
                      </>
                    )}
                    {leave?.status && (
                      <span className="ml-2 capitalize">
                        • Status: {leave.status}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getFileTypeIcon(doc.file_type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{doc.file_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{formatFileSize(doc.file_size)}</span>
                              <span>•</span>
                              <span>{formatDate(doc.uploaded_at)}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
