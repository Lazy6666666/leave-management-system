import { Badge } from '@/ui/badge';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react';

const statusVariants = cva(
  'capitalize text-xs leading-relaxed break-words whitespace-normal max-w-full overflow-hidden',
  {
    variants: {
      status: {
        pending: 'bg-warning-subtle text-warning-strong border-warning-subtle',
        approved: 'bg-success-subtle text-success-strong border-success-subtle',
        rejected: 'bg-destructive text-destructive-foreground border-destructive',
        cancelled: 'bg-secondary text-secondary-foreground border-secondary',
        on_leave: 'bg-info-subtle text-info-strong border-info-subtle',
        completed: 'bg-success-subtle text-success-strong border-success-subtle',
        active: 'bg-info-subtle text-info-strong border-info-subtle',
        inactive: 'bg-secondary text-secondary-foreground border-secondary',
        expired: 'bg-warning-subtle text-warning-strong border-warning-subtle',
      },
    },
    defaultVariants: {
      status: 'pending',
    },
  }
);

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'on_leave' | 'completed' | 'active' | 'inactive' | 'expired';

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusVariants> {
  status: LeaveStatus;
  showIcon?: boolean; // defaults to true
}

export function getStatusVariant(status: LeaveStatus): 'warning' | 'success' | 'destructive' | 'secondary' | 'info' {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'destructive';
    case 'cancelled':
      return 'secondary';
    case 'on_leave':
      return 'info';
    case 'completed':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export function getStatusIcon(status: LeaveStatus) {
  switch (status) {
    case 'pending':
      return Clock;
    case 'approved':
      return CheckCircle2;
    case 'rejected':
      return XCircle;
    case 'cancelled':
      return AlertCircle;
    case 'on_leave':
      return Calendar;
    case 'completed':
      return CheckCircle2;
    default:
      return AlertCircle;
  }
}

export function getStatusLabel(status: LeaveStatus): string {
  // Special case for on_leave to ensure proper capitalization
  if (status === 'on_leave') {
    return 'On Leave';
  }
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}

export function getStatusColorClasses(status: LeaveStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-warning-subtle text-warning-strong border-warning-subtle';
    case 'approved':
      return 'bg-success-subtle text-success-strong border-success-subtle';
    case 'rejected':
      return 'bg-destructive-subtle text-destructive-strong border-destructive-subtle';
    case 'cancelled':
      return 'bg-secondary text-secondary-foreground border-border';
    case 'on_leave':
      return 'bg-info-subtle text-info-strong border-info-subtle';
    case 'completed':
      return 'bg-success-subtle text-success-strong border-success-subtle';
    case 'active':
      return 'bg-info-subtle text-info-strong border-info-subtle';
    case 'inactive':
      return 'bg-secondary text-secondary-foreground border-border';
    case 'expired':
      return 'bg-warning-subtle text-warning-strong border-warning-subtle';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function StatusBadge({ status, showIcon = true, className, ...props }: StatusBadgeProps) {
  const Icon = getStatusIcon(status);
  const label = getStatusLabel(status);

  return (
    <Badge
      className={cn(statusVariants({ status }), className)}
      role="status"
      aria-label={`Status: ${label}`}
      {...props}
    >
      {showIcon && <Icon className="mr-1 h-3 w-3" aria-hidden="true" />}
      {label}
    </Badge>
  );
}
