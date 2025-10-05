import * as React from 'react'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Alert, AlertDescription } from '@/ui/alert'
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { LeaveRequestForm, type LeaveRequestFormSubmitData } from '@/components/features/leave-request-form'
import { uploadDocumentWithMetadata } from '@/lib/storage-utils'
import { createClient } from '@/lib/supabase-server'
import { getBrowserClient } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import type { LeaveType } from '@/types'
import type { DocumentFile } from '@/components/features/document-upload'

interface EditLeaveRequestPageProps {
  leaveRequest: {
    id: string
    leave_type_id: string
    start_date: string
    end_date: string
    reason: string
    status: string
    requester_id: string
  }
  leaveTypes: LeaveType[]
  existingDocuments: Array<{
    id: string
    file_name: string
    file_size: number
    file_type: string
    storage_path: string
  }>
  error?: string
}

export default function EditLeaveRequestPage({
  leaveRequest,
  leaveTypes,
  existingDocuments,
  error,
}: EditLeaveRequestPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)

  // Convert existing documents to DocumentFile format
  const initialDocuments: DocumentFile[] = existingDocuments.map((doc) => ({
    file: new File([], doc.file_name, { type: doc.file_type }),
    // Note: We don't have the actual file, just metadata
    // This is for display purposes only
  }))

  const handleSubmit = async (data: LeaveRequestFormSubmitData) => {
    try {
      setIsLoading(true)

      // Get current user
      const supabase = getBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      // Calculate days count
      const startDate = new Date(data.start_date)
      const endDate = new Date(data.end_date)
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      // Update leave request via API
      const response = await fetch(`/api/leaves/${leaveRequest.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leave_type_id: data.leave_type_id,
          start_date: data.start_date,
          end_date: data.end_date,
          reason: data.reason,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update leave request')
      }

      // Handle document uploads
      if (data.documents && data.documents.length > 0) {
        const uploadPromises = data.documents
          .filter((doc) => doc.file.size > 0) // Only upload new documents with actual file data
          .map((doc) =>
            uploadDocumentWithMetadata(doc.file, user.id, leaveRequest.id)
          )

        if (uploadPromises.length > 0) {
          const uploadResults = await Promise.allSettled(uploadPromises)

          // Check for upload failures
          const failures = uploadResults.filter(
            (result) =>
              result.status === 'rejected' ||
              (result.status === 'fulfilled' && !result.value.success)
          )

          if (failures.length > 0) {
            console.warn(`${failures.length} document(s) failed to upload`)
            toast({
              title: 'Partial Success',
              description: `Leave request updated, but ${failures.length} document(s) failed to upload`,
              variant: 'default',
            })
            // Still redirect on partial success
            router.push('/dashboard/leaves')
            return
          }
        }
      }

      // Show success message
      toast({
        title: 'Success',
        description: 'Leave request updated successfully',
      })

      // Redirect to leaves list
      router.push('/dashboard/leaves')
    } catch (error) {
      console.error('Failed to update leave request:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update leave request',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/leaves')
  }

  // Show error if leave request couldn't be loaded
  if (error) {
    return (
      <div className="space-y-6 md:space-y-8 page-transition">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="w-fit"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leave Requests
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if leave request can be edited
  const canEdit = leaveRequest.status === 'pending'

  return (
    <div className="space-y-6 md:space-y-8 page-transition">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="w-fit"
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leave Requests
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Edit Leave Request
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Update your leave request details
          </p>
        </div>
      </div>

      {/* Warning if not editable */}
      {!canEdit && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This leave request cannot be edited because it has been{' '}
            {leaveRequest.status}. Only pending requests can be modified.
          </AlertDescription>
        </Alert>
      )}

      {/* Form Card */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">
            Leave Request Details
          </CardTitle>
          <CardDescription className="text-sm">
            Modify the details of your leave request
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <LeaveRequestForm
              mode="edit"
              leaveTypes={leaveTypes}
              defaultValues={{
                leave_type_id: leaveRequest.leave_type_id,
                start_date: leaveRequest.start_date,
                end_date: leaveRequest.end_date,
                reason: leaveRequest.reason,
              }}
              initialDocuments={initialDocuments}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              disabled={!canEdit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { id } = context.params as { id: string }
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      }
    }

    // Fetch leave request
    const { data: leaveRequest, error: leaveError } = await supabase
      .from('leaves')
      .select('*')
      .eq('id', id)
      .eq('requester_id', user.id) // Only allow editing own requests
      .single()

    if (leaveError || !leaveRequest) {
      return {
        props: {
          leaveRequest: null,
          leaveTypes: [],
          existingDocuments: [],
          error: 'Leave request not found or you do not have permission to edit it',
        },
      }
    }

    // Fetch leave types
    const { data: leaveTypes } = await supabase
      .from('leave_types')
      .select('*')
      .eq('is_active', true)
      .order('name')

    // Fetch existing documents
    const { data: existingDocuments } = await supabase
      .from('leave_documents')
      .select('id, file_name, file_size, file_type, storage_path')
      .eq('leave_request_id', id)
      .order('uploaded_at', { ascending: false })

    return {
      props: {
        leaveRequest,
        leaveTypes: leaveTypes || [],
        existingDocuments: existingDocuments || [],
      },
    }
  } catch (error) {
    console.error('Error loading edit page:', error)
    return {
      props: {
        leaveRequest: null,
        leaveTypes: [],
        existingDocuments: [],
        error: 'Failed to load leave request',
      },
    }
  }
}
