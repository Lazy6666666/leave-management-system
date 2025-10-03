# Leave Management System - Component Architecture

## 1. Component Hierarchy

### 1.1 Page Components (App Router Routes)

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx              # LoginPage
│   ├── register/
│   │   └── page.tsx              # RegisterPage
│   └── layout.tsx                # AuthLayout
│
├── (dashboard)/
│   ├── layout.tsx                # DashboardLayout
│   ├── page.tsx                  # DashboardPage
│   │
│   ├── leaves/
│   │   ├── page.tsx              # LeavesListPage
│   │   ├── new/
│   │   │   └── page.tsx          # NewLeaveRequestPage
│   │   └── [id]/
│   │       └── page.tsx          # LeaveDetailPage
│   │
│   ├── approvals/
│   │   ├── page.tsx              # ApprovalsListPage
│   │   └── [id]/
│   │       └── page.tsx          # ApprovalDetailPage
│   │
│   ├── documents/
│   │   ├── page.tsx              # DocumentsListPage
│   │   └── [id]/
│   │       └── page.tsx          # DocumentDetailPage
│   │
│   ├── team/
│   │   └── page.tsx              # TeamCalendarPage
│   │
│   ├── profile/
│   │   └── page.tsx              # ProfilePage
│   │
│   └── admin/
│       ├── page.tsx              # AdminDashboardPage
│       ├── users/
│       │   ├── page.tsx          # UsersManagementPage
│       │   └── [id]/
│       │       └── page.tsx      # UserDetailPage
│       ├── leave-types/
│       │   └── page.tsx          # LeaveTypesManagementPage
│       ├── reports/
│       │   └── page.tsx          # ReportsPage
│       └── settings/
│           └── page.tsx          # SystemSettingsPage
```

### 1.2 Layout Components (Shells)

```
components/layouts/
├── AuthLayout.tsx                # Auth pages container
├── DashboardLayout.tsx           # Main dashboard shell
├── AdminLayout.tsx               # Admin section shell
└── EmptyLayout.tsx               # Minimal layout for errors
```

### 1.3 Feature Components (Domain-Specific)

```
components/features/
├── auth/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── PasswordResetForm.tsx
│   └── MagicLinkForm.tsx
│
├── leaves/
│   ├── LeaveRequestForm.tsx
│   ├── LeaveCard.tsx
│   ├── LeavesList.tsx
│   ├── LeaveCalendar.tsx
│   ├── LeaveBalanceCard.tsx
│   ├── LeaveStatusBadge.tsx
│   └── LeaveCancellationDialog.tsx
│
├── approvals/
│   ├── ApprovalCard.tsx
│   ├── ApprovalsList.tsx
│   ├── ApprovalActionButtons.tsx
│   ├── ApprovalCommentsSection.tsx
│   └── BulkApprovalDialog.tsx
│
├── documents/
│   ├── DocumentUploadZone.tsx
│   ├── DocumentCard.tsx
│   ├── DocumentsList.tsx
│   ├── DocumentViewer.tsx
│   ├── ExpiryNotifierForm.tsx
│   └── DocumentMetadataForm.tsx
│
├── notifications/
│   ├── NotificationBell.tsx
│   ├── NotificationsList.tsx
│   ├── NotificationCard.tsx
│   └── NotificationPreferencesForm.tsx
│
├── profile/
│   ├── ProfileForm.tsx
│   ├── ProfileAvatar.tsx
│   ├── PasswordChangeForm.tsx
│   └── RoleBadge.tsx
│
├── admin/
│   ├── UserTable.tsx
│   ├── UserRoleSelector.tsx
│   ├── LeaveTypeForm.tsx
│   ├── SystemMetricCards.tsx
│   ├── AuditLogTable.tsx
│   └── BulkUserImport.tsx
│
└── analytics/
    ├── LeaveUtilizationChart.tsx
    ├── ApprovalRateChart.tsx
    ├── DepartmentStatsChart.tsx
    └── TrendAnalysisChart.tsx
```

### 1.4 Shared Components (Reusable UI)

```
components/ui/
├── forms/
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Textarea.tsx
│   ├── Checkbox.tsx
│   ├── RadioGroup.tsx
│   ├── DatePicker.tsx
│   ├── DateRangePicker.tsx
│   ├── FileUpload.tsx
│   └── FormField.tsx
│
├── data-display/
│   ├── Table.tsx
│   ├── DataTable.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   ├── Stat.tsx
│   ├── EmptyState.tsx
│   └── SkeletonLoader.tsx
│
├── feedback/
│   ├── Alert.tsx
│   ├── Toast.tsx
│   ├── Dialog.tsx
│   ├── Modal.tsx
│   ├── ConfirmDialog.tsx
│   ├── LoadingSpinner.tsx
│   ├── ProgressBar.tsx
│   └── ErrorBoundary.tsx
│
├── navigation/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── Breadcrumbs.tsx
│   ├── Tabs.tsx
│   ├── Pagination.tsx
│   └── MobileMenu.tsx
│
└── layout/
    ├── Container.tsx
    ├── Section.tsx
    ├── Grid.tsx
    ├── Stack.tsx
    └── Divider.tsx
```

---

## 2. Feature-to-Component Mapping

### 2.1 Authentication & User Management

#### Components Required
- **LoginPage** (app/(auth)/login/page.tsx)
- **RegisterPage** (app/(auth)/register/page.tsx)
- **LoginForm** (features/auth/LoginForm.tsx)
- **RegisterForm** (features/auth/RegisterForm.tsx)
- **PasswordResetForm** (features/auth/PasswordResetForm.tsx)
- **MagicLinkForm** (features/auth/MagicLinkForm.tsx)

#### Component Responsibilities

**LoginForm**
```typescript
interface LoginFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
}

// Responsibilities:
// - Email/password authentication
// - Magic link option
// - Form validation
// - Error handling
// - Loading states
// - Session management
```

**RegisterForm**
```typescript
interface RegisterFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: Error) => void;
  defaultRole?: UserRole;
}

// Responsibilities:
// - User registration
// - Email validation
// - Password strength checking
// - Account creation
// - Profile initialization
// - Auto-login after registration
```

#### State Management
- Local: Form state via React Hook Form
- Server: User session via Supabase Auth
- Cache: User profile via React Query

#### API Integration
```typescript
// hooks/api/useAuth.ts
export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user);
    }
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: RegisterData) => {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            role: userData.role || 'employee'
          }
        }
      });
      if (error) throw error;
      return data;
    }
  });
};
```

#### Validation
```typescript
// schemas/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(2, 'Full name is required'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
```

---

### 2.2 Leave Request Workflow

#### Components Required
- **DashboardPage** (app/(dashboard)/page.tsx)
- **LeavesListPage** (app/(dashboard)/leaves/page.tsx)
- **NewLeaveRequestPage** (app/(dashboard)/leaves/new/page.tsx)
- **LeaveRequestForm** (features/leaves/LeaveRequestForm.tsx)
- **LeaveCard** (features/leaves/LeaveCard.tsx)
- **LeavesList** (features/leaves/LeavesList.tsx)
- **LeaveCalendar** (features/leaves/LeaveCalendar.tsx)
- **LeaveBalanceCard** (features/leaves/LeaveBalanceCard.tsx)

#### Component Specifications

**LeaveRequestForm**
```typescript
interface LeaveRequestFormProps {
  initialData?: Partial<Leave>;
  onSuccess?: (leave: Leave) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit' | 'draft';
}

interface LeaveRequestFormData {
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  halfDay?: boolean;
}

// State:
// - Form state (React Hook Form)
// - Available leave types (React Query)
// - Leave balance (React Query)
// - Public holidays (React Query)
// - Validation errors
// - Submission status

// Events:
// - onSubmit: Validate and submit leave request
// - onSaveDraft: Save incomplete form
// - onCancel: Discard changes
// - onDateChange: Recalculate days count

// API Integration:
const { mutate: createLeave, isPending } = useCreateLeave();
const { data: leaveTypes } = useLeaveTypes();
const { data: balance } = useLeaveBalance(userId);
const { data: holidays } = usePublicHolidays(year);
```

**LeaveCard**
```typescript
interface LeaveCardProps {
  leave: Leave;
  variant?: 'compact' | 'detailed';
  actions?: boolean;
  onCancel?: (leaveId: string) => void;
  onEdit?: (leave: Leave) => void;
}

// Responsibilities:
// - Display leave details
// - Show status badge
// - Render action buttons (if allowed)
// - Handle cancellation
// - Show approval/rejection comments
```

**LeavesList**
```typescript
interface LeavesListProps {
  userId?: string;
  status?: LeaveStatus[];
  sortBy?: 'date' | 'status' | 'type';
  view?: 'list' | 'grid' | 'calendar';
  pageSize?: number;
}

// State:
// - Leaves data (React Query with pagination)
// - Filters (local state)
// - Sort order (local state)
// - Selected items (for bulk operations)

// API Integration:
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetching
} = useInfiniteQuery({
  queryKey: ['leaves', userId, status, sortBy],
  queryFn: ({ pageParam = 0 }) => fetchLeaves({
    userId,
    status,
    sortBy,
    offset: pageParam,
    limit: pageSize
  }),
  getNextPageParam: (lastPage, pages) =>
    lastPage.hasMore ? pages.length * pageSize : undefined
});
```

**LeaveBalanceCard**
```typescript
interface LeaveBalanceCardProps {
  userId: string;
  leaveTypeId?: string;
  showAllTypes?: boolean;
}

interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  allocated: number;
  used: number;
  pending: number;
  available: number;
  carryForward?: number;
}

// API Integration:
const { data: balances } = useQuery({
  queryKey: ['leave-balance', userId, leaveTypeId],
  queryFn: () => fetchLeaveBalance(userId, leaveTypeId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

#### Validation Schema
```typescript
// schemas/leave.schema.ts
export const leaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid('Invalid leave type'),
  startDate: z.date({
    required_error: 'Start date is required'
  }),
  endDate: z.date({
    required_error: 'End date is required'
  }),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be less than 500 characters'),
  halfDay: z.boolean().optional()
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate']
}).refine((data) => {
  const daysDiff = differenceInDays(data.endDate, data.startDate);
  return daysDiff <= 365; // Max 1 year
}, {
  message: 'Leave duration cannot exceed 1 year',
  path: ['endDate']
});

export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;
```

---

### 2.3 Manager Approvals

#### Components Required
- **ApprovalsListPage** (app/(dashboard)/approvals/page.tsx)
- **ApprovalDetailPage** (app/(dashboard)/approvals/[id]/page.tsx)
- **ApprovalCard** (features/approvals/ApprovalCard.tsx)
- **ApprovalsList** (features/approvals/ApprovalsList.tsx)
- **ApprovalActionButtons** (features/approvals/ApprovalActionButtons.tsx)
- **ApprovalCommentsSection** (features/approvals/ApprovalCommentsSection.tsx)
- **BulkApprovalDialog** (features/approvals/BulkApprovalDialog.tsx)

#### Component Specifications

**ApprovalCard**
```typescript
interface ApprovalCardProps {
  leave: Leave & {
    requester: Profile;
  };
  onApprove?: (leaveId: string, comments?: string) => void;
  onReject?: (leaveId: string, comments: string) => void;
  showActions?: boolean;
}

// Responsibilities:
// - Display leave request details
// - Show requester information
// - Display leave history
// - Render action buttons
// - Show team calendar conflicts
// - Handle approval/rejection
```

**ApprovalActionButtons**
```typescript
interface ApprovalActionButtonsProps {
  leaveId: string;
  disabled?: boolean;
  onSuccess?: () => void;
}

// State:
// - Comments (local state)
// - Submission status (mutation status)

// API Integration:
const { mutate: approveLeave } = useMutation({
  mutationFn: async ({ leaveId, comments }: ApprovalData) => {
    const { data, error } = await supabase
      .from('leaves')
      .update({
        status: 'approved',
        approver_id: currentUser.id,
        comments,
        updated_at: new Date().toISOString()
      })
      .eq('id', leaveId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['approvals'] });
    queryClient.invalidateQueries({ queryKey: ['leaves'] });
    toast.success('Leave request approved');
  }
});

const { mutate: rejectLeave } = useMutation({
  mutationFn: async ({ leaveId, comments }: RejectionData) => {
    if (!comments?.trim()) {
      throw new Error('Comments are required for rejection');
    }

    const { data, error } = await supabase
      .from('leaves')
      .update({
        status: 'rejected',
        approver_id: currentUser.id,
        comments,
        updated_at: new Date().toISOString()
      })
      .eq('id', leaveId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
});
```

**BulkApprovalDialog**
```typescript
interface BulkApprovalDialogProps {
  selectedLeaves: string[];
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// API Integration:
const { mutate: bulkApprove } = useMutation({
  mutationFn: async (leaveIds: string[]) => {
    const { data, error } = await supabase
      .from('leaves')
      .update({
        status: 'approved',
        approver_id: currentUser.id,
        updated_at: new Date().toISOString()
      })
      .in('id', leaveIds)
      .select();

    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['approvals'] });
    toast.success(`${selectedLeaves.length} leave requests approved`);
  }
});
```

---

### 2.4 Document Management

#### Components Required
- **DocumentsListPage** (app/(dashboard)/documents/page.tsx)
- **DocumentDetailPage** (app/(dashboard)/documents/[id]/page.tsx)
- **DocumentUploadZone** (features/documents/DocumentUploadZone.tsx)
- **DocumentCard** (features/documents/DocumentCard.tsx)
- **DocumentsList** (features/documents/DocumentsList.tsx)
- **DocumentViewer** (features/documents/DocumentViewer.tsx)
- **ExpiryNotifierForm** (features/documents/ExpiryNotifierForm.tsx)

#### Component Specifications

**DocumentUploadZone**
```typescript
interface DocumentUploadZoneProps {
  onUploadComplete?: (document: CompanyDocument) => void;
  maxSize?: number; // bytes
  acceptedTypes?: string[];
  multiple?: boolean;
}

interface UploadState {
  files: File[];
  progress: Record<string, number>;
  errors: Record<string, string>;
  isUploading: boolean;
}

// API Integration:
const { mutate: uploadDocument } = useMutation({
  mutationFn: async ({ file, metadata }: UploadData) => {
    // 1. Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('company-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 2. Create document record
    const { data: document, error: dbError } = await supabase
      .from('company_documents')
      .insert({
        name: metadata.name,
        document_type: metadata.type,
        expiry_date: metadata.expiryDate,
        uploaded_by: currentUser.id,
        storage_path: uploadData.path,
        is_public: metadata.isPublic,
        metadata: metadata.additionalInfo
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return document;
  },
  onSuccess: (document) => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    toast.success('Document uploaded successfully');
  }
});
```

**DocumentCard**
```typescript
interface DocumentCardProps {
  document: CompanyDocument;
  onDelete?: (documentId: string) => void;
  onDownload?: (document: CompanyDocument) => void;
  onSetupNotifier?: (document: CompanyDocument) => void;
  showActions?: boolean;
}

// Responsibilities:
// - Display document metadata
// - Show expiry status
// - Render preview/thumbnail
// - Handle download
// - Manage access controls
// - Setup expiry notifications
```

**ExpiryNotifierForm**
```typescript
interface ExpiryNotifierFormProps {
  documentId: string;
  existingNotifier?: DocumentNotifier;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface NotifierFormData {
  frequency: 'weekly' | 'monthly' | 'custom';
  customDays?: number;
  recipients: string[];
}

// Validation:
export const notifierSchema = z.object({
  frequency: z.enum(['weekly', 'monthly', 'custom']),
  customDays: z.number()
    .min(1)
    .max(365)
    .optional(),
  recipients: z.array(z.string().email())
    .min(1, 'At least one recipient required')
}).refine((data) => {
  if (data.frequency === 'custom') {
    return data.customDays !== undefined;
  }
  return true;
}, {
  message: 'Custom days required for custom frequency',
  path: ['customDays']
});

// API Integration:
const { mutate: createNotifier } = useMutation({
  mutationFn: async (data: NotifierFormData) => {
    const { data: notifier, error } = await supabase
      .from('document_notifiers')
      .insert({
        user_id: currentUser.id,
        document_id: documentId,
        notification_frequency: data.frequency,
        custom_frequency_days: data.customDays,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return notifier;
  }
});
```

---

### 2.5 Notifications

#### Components Required
- **NotificationBell** (features/notifications/NotificationBell.tsx)
- **NotificationsList** (features/notifications/NotificationsList.tsx)
- **NotificationCard** (features/notifications/NotificationCard.tsx)
- **NotificationPreferencesForm** (features/notifications/NotificationPreferencesForm.tsx)

#### Component Specifications

**NotificationBell**
```typescript
interface NotificationBellProps {
  variant?: 'header' | 'sidebar';
}

// State:
// - Unread count (real-time subscription)
// - Popover open state

// Real-time Integration:
const { data: notifications, refetch } = useQuery({
  queryKey: ['notifications', userId],
  queryFn: () => fetchNotifications(userId)
});

useEffect(() => {
  const subscription = supabase
    .channel('notifications')
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notification_logs',
        filter: `recipient_email=eq.${currentUser.email}`
      },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        toast.info(payload.new.message);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [userId]);
```

**NotificationCard**
```typescript
interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

interface Notification {
  id: string;
  type: 'leave_approved' | 'leave_rejected' | 'leave_pending' | 'document_expiring';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}
```

---

### 2.6 Admin Tools

#### Components Required
- **AdminDashboardPage** (app/(dashboard)/admin/page.tsx)
- **UsersManagementPage** (app/(dashboard)/admin/users/page.tsx)
- **UserTable** (features/admin/UserTable.tsx)
- **UserRoleSelector** (features/admin/UserRoleSelector.tsx)
- **LeaveTypeForm** (features/admin/LeaveTypeForm.tsx)
- **SystemMetricCards** (features/admin/SystemMetricCards.tsx)
- **AuditLogTable** (features/admin/AuditLogTable.tsx)

#### Component Specifications

**UserTable**
```typescript
interface UserTableProps {
  searchQuery?: string;
  roleFilter?: UserRole[];
  departmentFilter?: string[];
  sortBy?: keyof Profile;
  onUserSelect?: (user: Profile) => void;
}

// Features:
// - Server-side pagination
// - Multi-column sorting
// - Inline role editing
// - Bulk operations
// - Export to CSV

// API Integration:
const { data, isLoading } = useQuery({
  queryKey: ['admin-users', searchQuery, roleFilter, sortBy, page],
  queryFn: () => fetchUsers({
    search: searchQuery,
    roles: roleFilter,
    sortBy,
    page,
    limit: 50
  })
});
```

**UserRoleSelector**
```typescript
interface UserRoleSelectorProps {
  userId: string;
  currentRole: UserRole;
  onRoleChange?: (newRole: UserRole) => void;
  disabled?: boolean;
}

// API Integration:
const { mutate: updateRole } = useMutation({
  mutationFn: async ({ userId, role }: UpdateRoleData) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    toast.success('User role updated');
  }
});
```

**LeaveTypeForm**
```typescript
interface LeaveTypeFormProps {
  leaveType?: LeaveType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface LeaveTypeFormData {
  name: string;
  description: string;
  defaultAllocationDays: number;
  accrualRules: {
    type: 'annual' | 'monthly' | 'custom';
    amount: number;
    maxAccumulation?: number;
  };
  isActive: boolean;
}

// Validation:
export const leaveTypeSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  defaultAllocationDays: z.number()
    .min(0)
    .max(365),
  accrualRules: z.object({
    type: z.enum(['annual', 'monthly', 'custom']),
    amount: z.number().min(0),
    maxAccumulation: z.number().optional()
  }),
  isActive: z.boolean()
});
```

---

### 2.7 Analytics & Reporting

#### Components Required
- **ReportsPage** (app/(dashboard)/admin/reports/page.tsx)
- **LeaveUtilizationChart** (features/analytics/LeaveUtilizationChart.tsx)
- **ApprovalRateChart** (features/analytics/ApprovalRateChart.tsx)
- **DepartmentStatsChart** (features/analytics/DepartmentStatsChart.tsx)
- **TrendAnalysisChart** (features/analytics/TrendAnalysisChart.tsx)

#### Component Specifications

**LeaveUtilizationChart**
```typescript
interface LeaveUtilizationChartProps {
  dateRange: { start: Date; end: Date };
  groupBy?: 'department' | 'leave_type' | 'month';
  chartType?: 'bar' | 'line' | 'pie';
}

// API Integration:
const { data: utilization } = useQuery({
  queryKey: ['leave-utilization', dateRange, groupBy],
  queryFn: () => fetchLeaveUtilization({
    startDate: dateRange.start,
    endDate: dateRange.end,
    groupBy
  })
});
```

---

## 3. Shared Component Library

### 3.1 Form Components

**Input**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full px-4 py-2 border rounded-lg",
              "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:bg-gray-100 disabled:cursor-not-allowed",
              error && "border-red-500",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightIcon}
            </div>
          )}
        </div>
        {hint && !error && (
          <p className="text-sm text-gray-500">{hint}</p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
```

**DateRangePicker**
```typescript
interface DateRangePickerProps {
  value?: { start: Date; end: Date };
  onChange?: (range: { start: Date; end: Date }) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  placeholder?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  disabledDates = []
}) => {
  // Integration with react-day-picker
  // Calculate business days excluding weekends and holidays
  // Visual feedback for disabled dates
};
```

### 3.2 Data Display Components

**DataTable**
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selected: T[]) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  pageSize = 10,
  sortable = true,
  filterable = true,
  selectable = false,
  onRowClick,
  onSelectionChange,
  isLoading,
  emptyState
}: DataTableProps<T>) {
  // Integration with @tanstack/react-table
  // Features:
  // - Column sorting
  // - Global search
  // - Column filters
  // - Row selection
  // - Pagination
  // - Loading states
  // - Empty states
}
```

**Card**
```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  interactive = false,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-lg",
        variant === 'default' && "bg-white dark:bg-gray-800",
        variant === 'outlined' && "border border-gray-200 dark:border-gray-700",
        variant === 'elevated' && "shadow-lg",
        padding === 'sm' && "p-3",
        padding === 'md' && "p-4",
        padding === 'lg' && "p-6",
        interactive && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

### 3.3 Feedback Components

**ConfirmDialog**
```typescript
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false
}) => {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

**ErrorBoundary**
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service (Sentry)
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error!} reset={this.reset} />;
    }

    return this.props.children;
  }
}
```

---

## 4. State Management Architecture

### 4.1 Local State (useState, useReducer)

**Use Cases:**
- Form input values
- UI state (modals, dropdowns, tabs)
- Temporary selections
- Component-specific toggles

**Example:**
```typescript
// components/features/leaves/LeaveRequestForm.tsx
const [selectedDates, setSelectedDates] = useState<{
  start: Date | null;
  end: Date | null;
}>({ start: null, end: null });

const [daysCount, setDaysCount] = useState(0);

useEffect(() => {
  if (selectedDates.start && selectedDates.end) {
    const count = calculateBusinessDays(
      selectedDates.start,
      selectedDates.end,
      publicHolidays
    );
    setDaysCount(count);
  }
}, [selectedDates, publicHolidays]);
```

### 4.2 Server State (React Query)

**Configuration:**
```typescript
// lib/react-query.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      retry: 1
    }
  }
});
```

**Query Hooks:**
```typescript
// hooks/api/useLeaves.ts
export const useLeaves = (userId?: string, status?: LeaveStatus[]) => {
  return useQuery({
    queryKey: ['leaves', userId, status],
    queryFn: () => fetchLeaves(userId, status),
    enabled: !!userId
  });
};

export const useLeaveDetail = (leaveId: string) => {
  return useQuery({
    queryKey: ['leave', leaveId],
    queryFn: () => fetchLeaveById(leaveId),
    enabled: !!leaveId
  });
};

export const useCreateLeave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLeave,
    onMutate: async (newLeave) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['leaves'] });
      const previousLeaves = queryClient.getQueryData(['leaves']);

      queryClient.setQueryData(['leaves'], (old: Leave[]) => [
        ...old,
        { ...newLeave, id: 'temp-id', status: 'pending' }
      ]);

      return { previousLeaves };
    },
    onError: (err, newLeave, context) => {
      // Rollback on error
      queryClient.setQueryData(['leaves'], context?.previousLeaves);
      toast.error('Failed to create leave request');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
      toast.success('Leave request submitted successfully');
    }
  });
};
```

### 4.3 Form State (React Hook Form)

**Configuration:**
```typescript
// hooks/useLeaveForm.ts
export const useLeaveForm = (defaultValues?: Partial<Leave>) => {
  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leaveTypeId: defaultValues?.leaveTypeId || '',
      startDate: defaultValues?.startDate || null,
      endDate: defaultValues?.endDate || null,
      reason: defaultValues?.reason || '',
      halfDay: defaultValues?.halfDay || false
    },
    mode: 'onChange'
  });

  // Watch date changes to calculate days
  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');

  useEffect(() => {
    if (startDate && endDate) {
      const days = calculateBusinessDays(startDate, endDate);
      form.setValue('daysCount', days);
    }
  }, [startDate, endDate]);

  return form;
};
```

**Usage in Component:**
```typescript
const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({
  initialData,
  onSuccess
}) => {
  const form = useLeaveForm(initialData);
  const { mutate: createLeave, isPending } = useCreateLeave();

  const onSubmit = form.handleSubmit((data) => {
    createLeave(data, {
      onSuccess: (leave) => {
        form.reset();
        onSuccess?.(leave);
      }
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="leaveTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Leave Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Additional form fields */}

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>
    </Form>
  );
};
```

### 4.4 Global State (Context API)

**Auth Context:**
```typescript
// contexts/AuthContext.tsx
interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user?.id
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (credentials: LoginCredentials) => {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (error) throw error;
    setUser(data.user);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    queryClient.clear();
  };

  const hasRole = (role: UserRole) => profile?.role === role;

  const hasPermission = (permission: string) => {
    const rolePermissions = {
      admin: ['*'],
      hr: ['manage_users', 'view_all_leaves', 'manage_leave_types'],
      manager: ['approve_leaves', 'view_team_leaves'],
      employee: ['create_leave', 'view_own_leaves']
    };

    return rolePermissions[profile?.role || 'employee'].includes(permission) ||
           rolePermissions[profile?.role || 'employee'].includes('*');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signIn,
        signOut,
        hasRole,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

### 4.5 Real-time Subscriptions

**Notification Subscription:**
```typescript
// hooks/useNotifications.ts
export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_logs',
          filter: `recipient_email=eq.${user.email}`
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });

          // Show toast notification
          toast.info(payload.new.title, {
            description: payload.new.message
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, queryClient]);
};
```

**Leave Status Subscription:**
```typescript
// hooks/useLeaveSubscription.ts
export const useLeaveSubscription = (userId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('leave-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaves',
          filter: `requester_id=eq.${userId}`
        },
        (payload) => {
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['leaves'] });
          queryClient.invalidateQueries({ queryKey: ['leave-balance'] });

          // Update cache directly for better UX
          if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData(
              ['leave', payload.new.id],
              payload.new
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, queryClient]);
};
```

---

## 5. Component Communication Patterns

### 5.1 Props Passing

**Parent-Child Communication:**
```typescript
// Parent: LeavesListPage
const LeavesListPage = () => {
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <LeavesList
          userId={currentUser.id}
          onLeaveSelect={(leave) => {
            setSelectedLeave(leave);
            setShowDetails(true);
          }}
        />
      </div>
      {showDetails && selectedLeave && (
        <LeaveDetailPanel
          leave={selectedLeave}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};
```

### 5.2 Event Bubbling

**Nested Component Events:**
```typescript
// LeaveCard → LeaveCancellationDialog → Parent
interface LeaveCardProps {
  leave: Leave;
  onCancel?: (leaveId: string) => void;
}

const LeaveCard: React.FC<LeaveCardProps> = ({ leave, onCancel }) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  return (
    <>
      <Card>
        <Button onClick={() => setShowCancelDialog(true)}>
          Cancel Request
        </Button>
      </Card>

      <LeaveCancellationDialog
        open={showCancelDialog}
        leaveId={leave.id}
        onConfirm={() => {
          onCancel?.(leave.id);
          setShowCancelDialog(false);
        }}
        onClose={() => setShowCancelDialog(false)}
      />
    </>
  );
};
```

### 5.3 Context Usage

**Theme Context:**
```typescript
// contexts/ThemeContext.tsx
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 5.4 Custom Hooks

**Reusable Logic Extraction:**
```typescript
// hooks/useLeaveActions.ts
export const useLeaveActions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const cancelLeave = useMutation({
    mutationFn: async (leaveId: string) => {
      const { error } = await supabase
        .from('leaves')
        .update({ status: 'cancelled' })
        .eq('id', leaveId)
        .eq('requester_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave request cancelled');
    }
  });

  const editLeave = useMutation({
    mutationFn: async ({ leaveId, updates }: EditLeaveData) => {
      const { data, error } = await supabase
        .from('leaves')
        .update(updates)
        .eq('id', leaveId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    }
  });

  return { cancelLeave, editLeave };
};
```

---

## 6. Data Flow Architecture

### 6.1 Component → API Integration

**Query Flow:**
```typescript
// 1. Component requests data
const LeavesList: React.FC = () => {
  const { data: leaves, isLoading, error } = useLeaves(userId);

  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorState error={error} />;

  return <LeavesList leaves={leaves} />;
};

// 2. Custom hook manages query
const useLeaves = (userId: string) => {
  return useQuery({
    queryKey: ['leaves', userId],
    queryFn: () => fetchLeaves(userId),
    staleTime: 5 * 60 * 1000
  });
};

// 3. API function fetches data
const fetchLeaves = async (userId: string): Promise<Leave[]> => {
  const { data, error } = await supabase
    .from('leaves')
    .select(`
      *,
      leave_type:leave_types(*),
      approver:profiles!approver_id(*)
    `)
    .eq('requester_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
```

**Mutation Flow:**
```typescript
// 1. Component triggers mutation
const LeaveRequestForm: React.FC = () => {
  const { mutate: createLeave } = useCreateLeave();

  const handleSubmit = (data: LeaveRequestFormData) => {
    createLeave(data);
  };
};

// 2. Mutation hook with optimistic updates
const useCreateLeave = () => {
  return useMutation({
    mutationFn: createLeave,
    onMutate: async (newLeave) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leaves'] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(['leaves']);

      // Optimistically update
      queryClient.setQueryData(['leaves'], (old: Leave[]) => [
        { ...newLeave, id: 'temp', status: 'pending' },
        ...old
      ]);

      return { previous };
    },
    onError: (err, newLeave, context) => {
      // Rollback on error
      queryClient.setQueryData(['leaves'], context?.previous);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    }
  });
};
```

### 6.2 Real-time Subscriptions

```typescript
// Setup subscription in component
useEffect(() => {
  const channel = supabase
    .channel('leaves-realtime')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'leaves',
        filter: `requester_id=eq.${userId}`
      },
      (payload) => {
        // Update React Query cache
        queryClient.setQueryData(
          ['leave', payload.new.id],
          payload.new
        );

        // Show notification
        if (payload.new.status === 'approved') {
          toast.success('Your leave request has been approved');
        } else if (payload.new.status === 'rejected') {
          toast.error('Your leave request has been rejected');
        }
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, [userId]);
```

### 6.3 Cache Invalidation Strategy

```typescript
// Invalidation patterns
const useLeaveActions = () => {
  const queryClient = useQueryClient();

  const approveLeave = useMutation({
    mutationFn: approveLeaveRequest,
    onSuccess: (data) => {
      // Invalidate specific leave
      queryClient.invalidateQueries({
        queryKey: ['leave', data.id]
      });

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: ['leaves']
      });
      queryClient.invalidateQueries({
        queryKey: ['approvals']
      });

      // Invalidate balance
      queryClient.invalidateQueries({
        queryKey: ['leave-balance', data.requester_id]
      });

      // Invalidate team calendar
      queryClient.invalidateQueries({
        queryKey: ['team-calendar']
      });
    }
  });

  return { approveLeave };
};
```

### 6.4 Error Boundaries

```typescript
// App-level error boundary
export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary
          fallback={({ error, reset }) => (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">
                  Something went wrong
                </h1>
                <p className="text-gray-600 mb-4">{error.message}</p>
                <Button onClick={reset}>Try Again</Button>
              </div>
            </div>
          )}
          onError={(error, errorInfo) => {
            // Log to Sentry
            console.error('App error:', error, errorInfo);
          }}
        >
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

// Feature-level error boundaries
const LeavesListPage = () => {
  return (
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <Alert variant="destructive">
          <AlertTitle>Failed to load leaves</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
          <Button onClick={reset} className="mt-4">Retry</Button>
        </Alert>
      )}
    >
      <LeavesList />
    </ErrorBoundary>
  );
};
```

---

## 7. Testing Strategy

### 7.1 Unit Testing

**Component Tests:**
```typescript
// __tests__/components/LeaveCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LeaveCard } from '@/components/features/leaves/LeaveCard';

describe('LeaveCard', () => {
  const mockLeave: Leave = {
    id: '1',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-20'),
    daysCount: 5,
    status: 'pending',
    leaveType: { name: 'Annual Leave' },
    reason: 'Family vacation'
  };

  it('renders leave details correctly', () => {
    render(<LeaveCard leave={mockLeave} />);

    expect(screen.getByText('Annual Leave')).toBeInTheDocument();
    expect(screen.getByText('5 days')).toBeInTheDocument();
    expect(screen.getByText('Family vacation')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<LeaveCard leave={mockLeave} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledWith(mockLeave.id);
  });

  it('disables cancel button for approved leaves', () => {
    const approvedLeave = { ...mockLeave, status: 'approved' };
    render(<LeaveCard leave={approvedLeave} />);

    const cancelButton = screen.queryByRole('button', { name: /cancel/i });
    expect(cancelButton).not.toBeInTheDocument();
  });
});
```

**Hook Tests:**
```typescript
// __tests__/hooks/useLeaves.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeaves } from '@/hooks/api/useLeaves';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useLeaves', () => {
  it('fetches leaves for user', async () => {
    const { result } = renderHook(
      () => useLeaves('user-id'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
  });

  it('handles fetch errors', async () => {
    // Mock error
    vi.spyOn(supabase, 'from').mockImplementation(() => ({
      select: () => ({
        eq: () => Promise.reject(new Error('Network error'))
      })
    }));

    const { result } = renderHook(
      () => useLeaves('user-id'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.message).toBe('Network error');
  });
});
```

### 7.2 Integration Testing

**Form Submission:**
```typescript
// __tests__/integration/LeaveRequestFlow.test.tsx
describe('Leave Request Flow', () => {
  it('completes full leave request submission', async () => {
    const user = userEvent.setup();
    render(<NewLeaveRequestPage />);

    // Select leave type
    await user.click(screen.getByLabelText(/leave type/i));
    await user.click(screen.getByText('Annual Leave'));

    // Select dates
    const startDateInput = screen.getByLabelText(/start date/i);
    await user.type(startDateInput, '2024-01-15');

    const endDateInput = screen.getByLabelText(/end date/i);
    await user.type(endDateInput, '2024-01-20');

    // Enter reason
    await user.type(
      screen.getByLabelText(/reason/i),
      'Family vacation'
    );

    // Submit form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/request submitted/i)).toBeInTheDocument();
    });

    // Verify API was called
    expect(mockCreateLeave).toHaveBeenCalledWith({
      leaveTypeId: expect.any(String),
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-20'),
      reason: 'Family vacation'
    });
  });
});
```

### 7.3 E2E Testing (Playwright)

```typescript
// e2e/leave-request.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Leave Request Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('employee can submit leave request', async ({ page }) => {
    // Navigate to leave request form
    await page.click('text=Request Leave');
    await expect(page).toHaveURL('/leaves/new');

    // Fill form
    await page.selectOption('[name="leaveTypeId"]', 'annual-leave');
    await page.fill('[name="startDate"]', '2024-01-15');
    await page.fill('[name="endDate"]', '2024-01-20');
    await page.fill('[name="reason"]', 'Family vacation');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('.toast')).toContainText('submitted successfully');
    await expect(page).toHaveURL('/leaves');
  });

  test('manager can approve leave request', async ({ page }) => {
    // Navigate to approvals
    await page.click('text=Approvals');
    await expect(page).toHaveURL('/approvals');

    // Find pending request
    const firstRequest = page.locator('.approval-card').first();
    await firstRequest.click();

    // Approve
    await page.click('button:has-text("Approve")');
    await page.fill('[name="comments"]', 'Approved');
    await page.click('button:has-text("Confirm")');

    // Verify success
    await expect(page.locator('.toast')).toContainText('approved');
  });
});
```

### 7.4 Accessibility Testing

```typescript
// __tests__/a11y/LeaveForm.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Leave Request Form Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<LeaveRequestForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports keyboard navigation', async () => {
    render(<LeaveRequestForm />);

    // Tab through form fields
    await userEvent.tab();
    expect(screen.getByLabelText(/leave type/i)).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByLabelText(/start date/i)).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByLabelText(/end date/i)).toHaveFocus();
  });

  it('has proper ARIA labels', () => {
    render(<LeaveRequestForm />);

    expect(screen.getByLabelText(/leave type/i)).toHaveAttribute('aria-label');
    expect(screen.getByRole('button', { name: /submit/i }))
      .toHaveAttribute('aria-label', 'Submit leave request');
  });
});
```

---

## 8. Performance Optimization

### 8.1 Code Splitting

```typescript
// app/(dashboard)/layout.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
const NotificationBell = dynamic(
  () => import('@/components/features/notifications/NotificationBell'),
  { ssr: false }
);

const AdminPanel = dynamic(
  () => import('@/components/features/admin/AdminPanel'),
  {
    loading: () => <SkeletonLoader />,
    ssr: false
  }
);

export default function DashboardLayout({ children }: Props) {
  return (
    <div>
      <Header>
        <NotificationBell />
      </Header>
      <main>{children}</main>
    </div>
  );
}
```

### 8.2 Memoization

```typescript
// components/features/leaves/LeavesList.tsx
import { memo, useMemo, useCallback } from 'react';

interface LeavesListProps {
  leaves: Leave[];
  onLeaveSelect: (leave: Leave) => void;
}

export const LeavesList = memo<LeavesListProps>(({ leaves, onLeaveSelect }) => {
  // Memoize filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter(leave => leave.status !== 'cancelled');
  }, [leaves]);

  // Memoize callback
  const handleLeaveClick = useCallback((leave: Leave) => {
    onLeaveSelect(leave);
  }, [onLeaveSelect]);

  return (
    <div className="space-y-4">
      {filteredLeaves.map(leave => (
        <LeaveCard
          key={leave.id}
          leave={leave}
          onClick={() => handleLeaveClick(leave)}
        />
      ))}
    </div>
  );
});

LeavesList.displayName = 'LeavesList';
```

### 8.3 Virtual Scrolling

```typescript
// components/ui/VirtualList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
}

export function VirtualList<T>({
  items,
  renderItem,
  estimateSize = 100
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 8.4 Image Optimization

```typescript
// components/ui/OptimizedImage.tsx
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 400,
  height = 400,
  priority = false
}) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      quality={85}
    />
  );
};
```

---

## 9. Composition Examples

### 9.1 Leave Request Flow

```typescript
// app/(dashboard)/leaves/new/page.tsx
export default function NewLeaveRequestPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleSuccess = (leave: Leave) => {
    toast.success('Leave request submitted successfully');
    router.push('/leaves');
  };

  return (
    <DashboardLayout>
      <Container>
        <PageHeader
          title="Request Leave"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Leaves', href: '/leaves' },
            { label: 'New Request' }
          ]}
        />

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>New Leave Request</CardTitle>
            <CardDescription>
              Submit a new leave request for approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeaveBalanceCard userId={user.id} className="mb-6" />
            <LeaveRequestForm onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </Container>
    </DashboardLayout>
  );
}

// components/features/leaves/LeaveRequestForm.tsx
export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({
  onSuccess
}) => {
  const form = useLeaveForm();
  const { mutate: createLeave, isPending } = useCreateLeave();
  const { data: leaveTypes } = useLeaveTypes();
  const { data: holidays } = usePublicHolidays();

  const onSubmit = form.handleSubmit((data) => {
    createLeave(data, { onSuccess });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <LeaveTypeSelector
          control={form.control}
          name="leaveTypeId"
          leaveTypes={leaveTypes}
        />

        <DateRangeSelector
          control={form.control}
          startName="startDate"
          endName="endDate"
          disabledDates={holidays}
          onRangeChange={(days) => form.setValue('daysCount', days)}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Please provide a reason for your leave request"
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <LoadingSpinner className="mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
```

### 9.2 Manager Approval Dashboard

```typescript
// app/(dashboard)/approvals/page.tsx
export default function ApprovalsPage() {
  const { profile } = useAuth();
  const [selectedLeaves, setSelectedLeaves] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  const { data: pendingApprovals, isLoading } = useQuery({
    queryKey: ['approvals', profile?.id],
    queryFn: () => fetchPendingApprovals(profile!.id),
    enabled: !!profile?.id
  });

  return (
    <DashboardLayout>
      <Container>
        <div className="flex justify-between items-center mb-6">
          <PageHeader title="Pending Approvals" />

          {selectedLeaves.length > 0 && (
            <Button onClick={() => setShowBulkDialog(true)}>
              Bulk Approve ({selectedLeaves.length})
            </Button>
          )}
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingApprovals?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <ApprovalsSkeleton />
            ) : (
              <ApprovalsList
                approvals={pendingApprovals}
                selectable
                onSelectionChange={setSelectedLeaves}
              />
            )}
          </TabsContent>
        </Tabs>

        <BulkApprovalDialog
          open={showBulkDialog}
          selectedLeaves={selectedLeaves}
          onClose={() => {
            setShowBulkDialog(false);
            setSelectedLeaves([]);
          }}
        />
      </Container>
    </DashboardLayout>
  );
}
```

### 9.3 Document Management

```typescript
// app/(dashboard)/documents/page.tsx
export default function DocumentsPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  return (
    <DashboardLayout>
      <Container>
        <div className="flex justify-between items-center mb-6">
          <PageHeader title="Company Documents" />
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>

        <DocumentsList
          onDocumentSelect={(doc) => router.push(`/documents/${doc.id}`)}
        />

        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <DocumentUploadZone
              onUploadComplete={() => setUploadDialogOpen(false)}
              multiple
            />
          </DialogContent>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}
```

### 9.4 Admin User Management

```typescript
// app/(dashboard)/admin/users/page.tsx
export default function UsersManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', searchQuery, roleFilter],
    queryFn: () => fetchUsers({ search: searchQuery, roles: roleFilter })
  });

  return (
    <AdminLayout>
      <Container>
        <PageHeader title="User Management" />

        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />

          <Select
            value={roleFilter}
            onValueChange={setRoleFilter}
            multiple
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : (
          <UserTable
            users={users}
            onUserSelect={setSelectedUser}
          />
        )}

        {selectedUser && (
          <UserDetailDialog
            user={selectedUser}
            open={!!selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </Container>
    </AdminLayout>
  );
}
```

---

## 10. Summary & Best Practices

### Component Design Principles
1. **Single Responsibility**: Each component has one clear purpose
2. **Composition Over Inheritance**: Build complex UIs from simple components
3. **Props Interface First**: Define TypeScript interfaces before implementation
4. **Controlled Components**: Prefer controlled over uncontrolled components
5. **Error Boundaries**: Wrap features in error boundaries for graceful degradation

### State Management Guidelines
1. **Local First**: Use local state for UI-only concerns
2. **Server State**: React Query for all server data
3. **Form State**: React Hook Form for forms
4. **Global Sparingly**: Only for auth, theme, and cross-cutting concerns
5. **Real-time**: Supabase subscriptions for live updates

### Performance Best Practices
1. **Code Split**: Lazy load routes and heavy components
2. **Memoize**: Use memo, useMemo, useCallback appropriately
3. **Virtualize**: Virtual scrolling for long lists
4. **Optimize Images**: Next.js Image component with proper sizing
5. **Bundle Analysis**: Regular bundle size monitoring

### Testing Requirements
1. **Unit Tests**: 80%+ coverage for business logic
2. **Integration Tests**: Critical user flows
3. **E2E Tests**: Happy paths and error scenarios
4. **Accessibility**: Automated a11y testing with axe-core
5. **Visual Regression**: Snapshot testing for UI components

### Documentation Standards
1. **Component Props**: JSDoc comments for all props
2. **Complex Logic**: Inline comments explaining why, not what
3. **API Hooks**: Document query keys and invalidation strategy
4. **Examples**: Storybook stories for all UI components
