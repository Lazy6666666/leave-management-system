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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { Textarea } from '@/ui/textarea'
import { Label } from '@/ui/label'
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Clock, 
  FileText, 
  Download,
  Filter,
  Loader2,
  User
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useApprovals, useApproveLeave, useRejectLeave } from '@/hooks/use-approvals'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { getBrowserClient } from '@/lib/supabase-client'
import type { LeaveWithRelations, LeaveType, Profile, LeaveDocument } from '@/types'

const supabase = getBrowserClient()

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Helper function to calculate days
const calculateDays = (startDate: string, endDate: string) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

export function ApprovalsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [userProfile, setUserProfile] = React.useState<Profile | null>(null)
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveType[]>([])
  const [employees, setEmployees] = React.useState<Profile[]>([])
  
  // Filters
  const [selectedEmployee, setSelectedEmployee] = React.useState<string>("")
  const [selectedLeaveType, setSelectedLeaveType] = React.useState<string>("")
  const [startDateFilter, setStartDateFilter] = React.useState<string>("")
  const [endDateFilter, setEndDateFilter] = React.useState<string>("")
  
  // Rejection modal
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false)
  const [selectedLeave, setSelectedLeave] = React.useState<LeaveWithRelations | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState("")
  
  // Document preview
  const [documentDialogOpen, setDocumentDialogOpen] = React.useState(false)
  const [documents, setDocuments] = React.useState<LeaveDocument[]>([])
  const [loadingDocuments, setLoadingDocuments] = React.useState(false)

  // Build filters object
  const filters = React.useMemo(() => ({
    startDate: startDateFilter || undefined,
    endDate: endDateFilter || undefined,
    employeeId: selectedEmployee || undefined,
    leaveTypeId: selectedLeaveType || undefined,
    department: userProfile?.role === 'manager' ? userProfile.department || undefined : undefined,
  }), [startDateFilter, endDateFilter, selectedEmployee, selectedLeaveType, userProfile])

  const { data: approvals, isLoading, error } = useApprovals(filters)
  const approveMutation = useApproveLeave()
  const rejectMutation = useRejectLeave()

  // Fetch user profile
  React.useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      if (!supabase) {
        console.error('Supabase client not initialized')
        return
      }
      
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      const { data, error } = result || { data: null, error: null }

      if (error) {
        console.error('Error fetching profile:', error)
        toast({
          title: 'Error',
          description: 'Failed to load user profile',
          variant: 'destructive',
        })
        return
      }

      if (!data) {
        console.error('No profile data returned')
        toast({
          title: 'Error',
          description: 'No profile data found',
          variant: 'destructive',
        })
        return
      }

      setUserProfile(data)

      // Check if user has permission
      if (data.role !== 'manager' && data.role !== 'admin' && data.role !== 'hr') {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page',
          variant: 'destructive',
        })
      }
    }

    fetchProfile()
  }, [user, toast])

  // Fetch leave types
  React.useEffect(() => {
    const fetchLeaveTypes = async () => {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (!error && data) {
        setLeaveTypes(data)
      }
    }

    fetchLeaveTypes()
  }, [])

  // Fetch employees for filter
  React.useEffect(() => {
    if (!userProfile) return

    const fetchEmployees = async () => {
      let query = supabase
        .from('profiles')
        .select('id, full_name, department')
        .order('full_name')

      // Managers only see their department
      if (userProfile.role === 'manager' && userProfile.department) {
        query = query.eq('department', userProfile.department)
      }

      const { data, error } = await query

      if (!error && data) {
        setEmployees(data)
      }
    }

    fetchEmployees()
  }, [userProfile])

  const handleApprove = async (leave: LeaveWithRelations) => {
    try {
      await approveMutation.mutateAsync({ leaveId: leave.id })
      
      toast({
        title: 'Leave Approved',
        description: `Leave request for ${leave.requester?.full_name} has been approved`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve leave request',
        variant: 'destructive',
      })
    }
  }

  const handleRejectClick = (leave: LeaveWithRelations) => {
    setSelectedLeave(leave)
    setRejectionReason("")
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedLeave) return

    if (rejectionReason.trim().length < 10) {
      toast({
        title: 'Invalid Reason',
        description: 'Rejection reason must be at least 10 characters',
        variant: 'destructive',
      })
      return
    }

    try {
      await rejectMutation.mutateAsync({ 
        leaveId: selectedLeave.id, 
        reason: rejectionReason 
      })
      
      toast({
        title: 'Leave Rejected',
        description: `Leave request for ${selectedLeave.requester?.full_name} has been rejected`,
      })
      
      setRejectDialogOpen(false)
      setSelectedLeave(null)
      setRejectionReason("")
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject leave request',
        variant: 'destructive',
      })
    }
  }

  const handleViewDocuments = async (leave: LeaveWithRelations) => {
    setSelectedLeave(leave)
    setLoadingDocuments(true)
    setDocumentDialogOpen(true)

    try {
      const { data, error } = await supabase
        .from('leave_documents')
        .select('*')
        .eq('leave_request_id', leave.id)

      if (error) throw error

      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      })
    } finally {
      setLoadingDocuments(false)
    }
  }

  const handleDownloadDocument = async (doc: LeaveDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('leave-documents')
        .createSignedUrl(doc.storage_path, 3600) // 1 hour expiry

      if (error) throw error

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive',
      })
    }
  }

  const clearFilters = () => {
    setSelectedEmployee("")
    setSelectedLeaveType("")
    setStartDateFilter("")
    setEndDateFilter("")
  }

  // Check authorization
  if (userProfile && userProfile.role !== 'manager' && userProfile.role !== 'admin' && userProfile.role !== 'hr') {
    return (
      <div className="space-y-6 md:space-y-8 page-transition">
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={XCircle}
              title="Access Denied"
              description="You do not have permission to access this page. Only managers and administrators can approve leave requests."
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading || !userProfile) {
    return (
      <div className="space-y-6 md:space-y-8 page-transition">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 md:space-y-8 page-transition">
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={XCircle}
              title="Error Loading Approvals"
              description="There was an error loading pending leave requests. Please try again."
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8 page-transition">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Leave Approvals</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Review and approve pending leave requests from your team
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="employee-filter">Employee</Label>
                <Select value={selectedEmployee || 'all'} onValueChange={(val) => setSelectedEmployee(val === 'all' ? '' : val)}>
                  <SelectTrigger id="employee-filter">
                    <SelectValue placeholder="All employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All employees</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leave-type-filter">Leave Type</Label>
                <Select value={selectedLeaveType || 'all'} onValueChange={(val) => setSelectedLeaveType(val === 'all' ? '' : val)}>
                  <SelectTrigger id="leave-type-filter">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date-filter">Start Date From</Label>
                <input
                  id="start-date-filter"
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date-filter">Start Date To</Label>
                <input
                  id="end-date-filter"
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {(selectedEmployee || selectedLeaveType || startDateFilter || endDateFilter) && (
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approvals Table */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Pending Requests</CardTitle>
          <CardDescription className="text-sm">
            {approvals?.length || 0} pending leave request{approvals?.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {!approvals || approvals.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={CheckCircle}
                title="No Pending Approvals"
                description="There are no pending leave requests to review at this time."
              />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead className="text-center">Days</TableHead>
                      <TableHead className="max-w-[200px]">Reason</TableHead>
                      <TableHead className="text-center">Documents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvals.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{leave.requester?.full_name}</div>
                              {leave.requester?.department && (
                                <div className="text-xs text-muted-foreground">
                                  {leave.requester.department}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{leave.leave_type?.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(leave.start_date)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(leave.end_date)}</TableCell>
                        <TableCell className="text-center font-medium">
                          {leave.days_count || calculateDays(leave.start_date, leave.end_date)}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="line-clamp-2" title={leave.reason || undefined}>
                            {leave.reason || 'No reason provided'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocuments(leave)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(leave)}
                              disabled={approveMutation.isPending}
                            >
                              {approveMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectClick(leave)}
                              disabled={rejectMutation.isPending}
                              className="text-destructive hover:text-destructive"
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {approvals.map((leave) => (
                  <Card key={leave.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <h3 className="font-semibold text-base leading-tight">
                            {leave.requester?.full_name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {leave.requester?.department}
                          </p>
                        </div>
                        <Badge variant="warning" className="shrink-0">
                          {leave.leave_type?.name}
                        </Badge>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Start Date</span>
                          </div>
                          <p className="font-medium">{formatDate(leave.start_date)}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">End Date</span>
                          </div>
                          <p className="font-medium">{formatDate(leave.end_date)}</p>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {leave.days_count || calculateDays(leave.start_date, leave.end_date)} days
                        </span>
                      </div>

                      {/* Reason */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Reason</span>
                        </div>
                        <p className="text-sm leading-relaxed">
                          {leave.reason || 'No reason provided'}
                        </p>
                      </div>

                      {/* Documents Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleViewDocuments(leave)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Documents
                      </Button>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleApprove(leave)}
                          disabled={approveMutation.isPending}
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-destructive hover:text-destructive"
                          onClick={() => handleRejectClick(leave)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave request. The employee will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedLeave && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-md">
                <div className="text-sm">
                  <span className="font-medium">Employee:</span> {selectedLeave.requester?.full_name}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Leave Type:</span> {selectedLeave.leave_type?.name}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Dates:</span> {formatDate(selectedLeave.start_date)} - {formatDate(selectedLeave.end_date)}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a detailed reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters required
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending || rejectionReason.trim().length < 10}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Confirm Rejection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documents Modal */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Leave Documents</DialogTitle>
            <DialogDescription>
              Supporting documents for this leave request
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingDocuments ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Documents"
                description="No supporting documents were uploaded for this leave request."
              />
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.file_size / 1024).toFixed(2)} KB • {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default ApprovalsPage
