import * as React from 'react'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { LeaveRequestForm, type LeaveRequestFormSubmitData } from '@/components/features/leave-request-form'
import { uploadDocumentWithMetadata } from '@/lib/storage-utils'
import { createClient } from '@/lib/supabase-server'
import { getBrowserClient } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import type { LeaveType } from '@/types'

interface NewLeaveRequestPageProps {
  leaveTypes: LeaveType[]
}

export default function NewLeaveRequestPage({ leaveTypes }: NewLeaveRequestPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmitLeaveRequest = async (data: LeaveRequestFormSubmitData) => {
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

      // Create leave request
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leave_type_id: data.leave_type_id,
          start_date: data.start_date,
          end_date: data.end_date,
          reason: data.reason,
          days_count: daysCount,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to create leave request')
      }

      const result = await response.json()
      const leaveRequestId = result.leave?.id

      if (!leaveRequestId) {
        throw new Error('Failed to get leave request ID')
      }

      // Upload documents if any
      if (data.documents && data.documents.length > 0) {
        const uploadPromises = data.documents.map((doc) =>
          uploadDocumentWithMetadata(doc.file, user.id, leaveRequestId)
        )

        const uploadResults = await Promise.allSettled(uploadPromises)

        // Check for upload failures
        const failures = uploadResults.filter(
          (result) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
        )

        if (failures.length > 0) {
          console.warn(`${failures.length} document(s) failed to upload`)
          toast({
            title: 'Partial Success',
            description: `Leave request created, but ${failures.length} document(s) failed to upload`,
            variant: 'default',
          })
        }
      }

      // Show success message
      toast({
        title: 'Success',
        description: 'Leave request submitted successfully',
      })

      // Redirect back to leaves list
      router.push('/dashboard/leaves')
    } catch (error) {
      console.error('Failed to submit leave request:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to submit leave request',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/leaves')
  }

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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">New Leave Request</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Submit a new leave request for approval
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Leave Request Details</CardTitle>
          <CardDescription className="text-sm">
            Fill in all required fields to submit your leave request
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <LeaveRequestForm
              mode="create"
              leaveTypes={leaveTypes}
              onSubmit={handleSubmitLeaveRequest}
              onCancel={handleCancel}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
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

    // Fetch leave types
    const { data: leaveTypes } = await supabase
      .from('leave_types')
      .select('*')
      .eq('is_active', true)
      .order('name')

    return {
      props: {
        leaveTypes: leaveTypes || [],
      },
    }
  } catch (error) {
    console.error('Error loading new leave page:', error)
    return {
      props: {
        leaveTypes: [],
      },
    }
  }
}
