import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Tables } from './database.types'

// Supabase client type
export type TypedSupabaseClient = SupabaseClient<Database>

// Table row types
export type Profile = Tables<'profiles'>
export type Leave = Tables<'leaves'>
export type LeaveType = Tables<'leave_types'>
export type LeaveBalance = Tables<'leave_balances'>
export type CompanyDocument = Tables<'company_documents'>
export type DocumentNotifier = Tables<'document_notifiers'>
export type NotificationLog = Tables<'notification_logs'>

// Leave statistics type
export interface LeaveStatistic {
  leave_type_id: string
  leave_type_name: string
  allocated_days: number
  used_days: number
  pending_days?: number
  available_days: number
  utilization_percentage?: number
}

// Admin summary type
export interface AdminSummary {
  totalEmployees: number
  totalManagers?: number
  totalHr?: number
  activeLeaves: number
  pendingApprovals: number
  pendingLeaves?: number
  documentsExpiringSoon?: number
  notificationsLast7Days?: number
  leaveStatistics?: LeaveStatistic[] | {
    by_leave_type: LeaveTypeStat[]
    total_employees?: number
    total_leaves_pending?: number
    total_leaves_approved?: number
    total_days_taken?: number
  }
}

// Document upload payload
export interface DocumentUploadPayload {
  name: string
  document_type: string
  expiry_date?: string
  is_public: boolean
  file: File
}

// API response types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  hasMore: boolean
}

export interface ApiError {
  message: string
  code?: string
}

// Leave metadata (for extensibility)
export interface LeaveMetadata {
  attachments?: string[]
  notes?: string
  [key: string]: unknown
}

// Document metadata
export interface DocumentMetadata {
  uploadedBy?: string
  fileSize?: number
  mimeType?: string
  [key: string]: unknown
}

// Audit log type
export interface AuditLog {
  id: string
  table_name: string
  operation: string
  user_id: string
  record_id: string
  old_value?: unknown
  new_value?: unknown
  created_at: string
}

// Admin reports summary
export interface LeaveTypeStat {
  leave_type: string
  count: number
  total_days: number
  total_requests?: number
}

// Report data types
export interface LeaveUsageReportItem {
  id: string
  requester?: {
    full_name: string
    department?: string
  }
  leave_type?: {
    name: string
  }
  start_date: string
  end_date: string
  days_count: number
  status: string
}

export interface LeaveByTypeReportItem {
  leaveTypeId: string
  leaveTypeName: string
  totalRequests: number
  totalDays: number
}

export interface LeaveByDepartmentReportItem {
  department: string
  totalRequests: number
  totalDays: number
}

export interface LeaveTrendsReportItem {
  month: string
  totalRequests: number
  totalDays: number
}

export interface EmployeeBalancesReportItem {
  userId: string
  employeeName: string
  department: string
  role: string
  totalAllocated: number
  totalUsed: number
  totalAvailable: number
}

export type ReportData = 
  | LeaveUsageReportItem[]
  | LeaveByTypeReportItem[]
  | LeaveByDepartmentReportItem[]
  | LeaveTrendsReportItem[]
  | EmployeeBalancesReportItem[]

// API response types for leaves with relations
export interface LeaveWithRequester extends Leave {
  requester?: {
    id: string
    full_name: string
    department?: string
  }
  leave_type?: {
    id: string
    name: string
  }
}
