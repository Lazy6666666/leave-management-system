"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Badge } from '@/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog'
import { Plus, Calendar, Clock, FileText } from 'lucide-react'
import { LeaveRequestForm } from '@/components/features/leave-request-form'
import { NoLeaveRequestsEmpty, ErrorEmpty } from '@/lib/production-cleanup/empty-state-templates'
import { Skeleton } from '@/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import type { LeaveRequestFormData } from '@/lib/schemas/leave'
import type { LeaveType, LeaveWithRelations } from '@/types'

// Helper function to get badge variant based on status
const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'success'
    case 'pending':
      return 'warning'
    case 'rejected':
      return 'destructive'
    default:
      return 'default'
  }
}

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function LeavesPage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  // Fetch leave types from API
  const { data: leaveTypes, isLoading: isLoadingTypes, error: typesError } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      // For now, return empty array to show empty state
      return [] as LeaveType[]
    }
  })

  // Fetch leave requests from API
  const { data: leaveRequests, isLoading: isLoadingRequests, error: requestsError } = useQuery<LeaveWithRelations[]>({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      // For now, return empty array to show empty state
      return [] as LeaveWithRelations[]
    }
  })

  // Fetch leave balance from API
  const { data: leaveBalance, isLoading: isLoadingBalance, error: balanceError } = useQuery({
    queryKey: ['leave-balance'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      // For now, return default empty balance
      return {
        annual: { used: 0, total: 0, remaining: 0 },
        sick: { used: 0, total: 0, remaining: 0 },
        personal: { used: 0, total: 0, remaining: 0 }
      }
    }
  })

  const handleSubmitLeaveRequest = async (data: LeaveRequestFormData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    // Close dialog on success
    setIsDialogOpen(false)
  }

  // Loading states
  if (isLoadingTypes || isLoadingRequests || isLoadingBalance) {
    return (
      <div className="space-y-6 md:space-y-8 page-transition">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2 p-4 md:p-6 md:pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader className="p-4 md:p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error states
  if (typesError || requestsError || balanceError) {
    return (
      <div className="space-y-6 md:space-y-8 page-transition">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Leave Requests</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage your leave requests and view your balance
            </p>
          </div>
        </div>
        <ErrorEmpty onAction={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your leave requests and view your balance
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>New Leave Request</DialogTitle>
              <DialogDescription>
                Submit a new leave request for approval. Fill in all required fields.
              </DialogDescription>
            </DialogHeader>
            <LeaveRequestForm
              leaveTypes={leaveTypes || []}
              onSubmit={handleSubmitLeaveRequest}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-sm font-medium">Annual Leave</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">
              {leaveBalance?.annual.remaining || 0} / {leaveBalance?.annual.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {leaveBalance?.annual.used || 0} days used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-sm font-medium">Sick Leave</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">
              {leaveBalance?.sick.remaining || 0} / {leaveBalance?.sick.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {leaveBalance?.sick.used || 0} days used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-sm font-medium">Personal Leave</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">
              {leaveBalance?.personal.remaining || 0} / {leaveBalance?.personal.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {leaveBalance?.personal.used || 0} days used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Your Leave Requests</CardTitle>
          <CardDescription className="text-sm">
            View and manage all your leave requests
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {!leaveRequests || leaveRequests.length === 0 ? (
            <div className="p-6">
              <NoLeaveRequestsEmpty onAction={() => setIsDialogOpen(true)} />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead className="text-center">Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="max-w-[200px]">Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.leave_type?.name || 'Unknown'}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(request.start_date)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(request.end_date)}</TableCell>
                        <TableCell className="text-center font-medium">{request.days_count}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(request.status)} className="capitalize">
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="line-clamp-2" title={request.reason || ''}>
                            {request.reason || 'No reason provided'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {request.status === 'pending' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.location.href = `/dashboard/leaves/edit/${request.id}`}
                                >
                                  Edit
                                </Button>
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                  Cancel
                                </Button>
                              </>
                            )}
                            {request.status !== 'pending' && (
                              <span className="text-sm text-muted-foreground">No actions</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {leaveRequests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-4">
                      {/* Header with Type and Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <h3 className="font-semibold text-base leading-tight">{request.leave_type?.name || 'Unknown'}</h3>
                          <p className="text-xs text-muted-foreground">
                            Submitted {formatDate(request.created_at)}
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(request.status)} className="capitalize shrink-0">
                          {request.status}
                        </Badge>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Start Date</span>
                          </div>
                          <p className="font-medium">{formatDate(request.start_date)}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">End Date</span>
                          </div>
                          <p className="font-medium">{formatDate(request.end_date)}</p>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{request.days_count} {request.days_count === 1 ? 'day' : 'days'}</span>
                      </div>

                      {/* Reason */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Reason</span>
                        </div>
                        <p className="text-sm leading-relaxed">{request.reason || 'No reason provided'}</p>
                      </div>

                      {/* Actions */}
                      {request.status === 'pending' && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => window.location.href = `/dashboard/leaves/edit/${request.id}`}
                          >
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive">
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
