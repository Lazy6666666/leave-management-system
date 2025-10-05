export type UserRole = 'employee' | 'manager' | 'admin' | 'hr'

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  department?: string | null
  photo_url?: string | null
}

export interface LeaveType {
  id: string
  name: string
  description?: string | null
  default_allocation_days: number
  accrual_rules?: Record<string, unknown> | null
  is_active: boolean
}

export interface Leave {
  id: string
  requester_id: string
  start_date: string
  end_date: string
  leave_type_id: string
  days_count: number
  reason?: string | null
  status: LeaveStatus
  approver_id?: string | null
  comments?: string | null
  approved_at?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface LeaveWithRelations extends Leave {
  requester?: Profile
  leave_type?: LeaveType
}

export interface LeaveDocument {
  id: string
  leave_request_id: string
  file_name: string
  file_size: number
  file_type: string
  storage_path: string
  uploaded_by: string
  uploaded_at: string
}

export interface LeaveWithDocuments extends LeaveWithRelations {
  documents?: LeaveDocument[]
}

export interface LeaveBalance {
  leave_type_id: string
  leave_type_name: string
  allocated_days: number
  used_days: number
  carried_forward_days: number
  available_days: number
  pending_days?: number
}

export interface CompanyDocument {
  id: string
  name: string
  document_type?: string | null
  expiry_date?: string | null
  uploaded_by: string
  storage_path: string
  is_public: boolean
  metadata?: Record<string, unknown> | null
  created_at: string
}

export interface DocumentNotifier {
  id: string
  user_id: string
  document_id: string
  notification_frequency: 'weekly' | 'monthly' | 'custom'
  custom_frequency_days?: number | null
  last_notification_sent?: string | null
  status: 'active' | 'inactive'
}

export interface NotificationLog {
  id: string
  notifier_id?: string | null
  document_id?: string | null
  recipient_email: string
  sent_at: string
  status: 'sent' | 'failed' | 'pending' | 'retrying'
  result?: Record<string, unknown> | null
  error_message?: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  department?: string
  role?: UserRole
}
