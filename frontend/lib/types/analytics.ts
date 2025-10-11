// Analytics Types for Admin Dashboard Charts
// Phase 2: Admin Dashboard Live Intelligence & Data Visualization

export interface MonthlyTrend {
  month_num: number
  month_name: string
  total_requests: number
  approved_requests: number
  total_days: number
}

export interface DepartmentLeaveStats {
  department: string
  total_requests: number
  approved_requests: number
  pending_requests: number
  total_days_taken: number
  avg_days_per_employee: number
}

export interface TopRequester {
  employee_id: string
  full_name: string
  department: string
  role: string
  total_requests: number
  total_days_taken: number
}

export interface LeaveTypeStats {
  leave_type_id: string
  leave_type_name: string
  total_requests: number
  approved_requests: number
  pending_requests: number
  rejected_requests: number
  total_days_taken: number
  avg_days_per_request: number
}

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface DrillDownState {
  department?: string
  leaveType?: string
  month?: number
  isOpen: boolean
}

export interface ChartInteractionEvent {
  type: 'department' | 'leave_type' | 'month' | 'employee'
  value: string | number
  metadata?: Record<string, unknown>
}
