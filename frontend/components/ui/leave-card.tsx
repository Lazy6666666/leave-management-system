import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Calendar, Clock, Check, X } from 'lucide-react';
import { format } from 'date-fns';

export interface LeaveCardProps {
  id?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  daysCount?: number;
  duration?: string;
  employeeName?: string;
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onClick?: () => void;
}

const statusColors = {
  pending: 'warning' as const,
  approved: 'success' as const,
  rejected: 'destructive' as const,
};

export function LeaveCard({
  leaveType,
  startDate,
  endDate,
  status,
  reason,
  daysCount,
  duration,
  employeeName,
  showActions,
  onApprove,
  onReject,
  onClick,
}: LeaveCardProps) {
  const displayDuration = duration || (daysCount ? `${daysCount} ${daysCount === 1 ? 'day' : 'days'}` : '');
  const dateRange = `${startDate} - ${endDate}`;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer max-w-full overflow-hidden"
      onClick={onClick}
    >
      <CardHeader className="max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 max-w-full">
          <div className="flex-1 min-w-0 max-w-full overflow-hidden">
            <CardTitle className="text-base md:text-lg leading-relaxed break-words whitespace-normal max-w-full">
              {leaveType}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm leading-relaxed break-words whitespace-normal max-w-full">
              {employeeName && <span className="block mb-1">{employeeName}</span>}
              {displayDuration}
            </CardDescription>
          </div>
          <Badge
            variant={statusColors[status]}
            className="capitalize shrink-0 text-xs leading-relaxed break-words"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-w-full overflow-hidden break-words">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs md:text-sm text-muted-foreground max-w-full">
          <div className="flex items-center gap-2 min-w-0 max-w-full overflow-hidden">
            <Calendar className="size-4 shrink-0" />
            <span className="leading-relaxed break-words whitespace-normal flex-1">
              {dateRange}
            </span>
          </div>
        </div>
        {reason && (
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed break-words whitespace-normal max-w-full overflow-hidden">
            {reason}
          </p>
        )}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
                onApprove?.();
              }}
              aria-label="Approve leave request"
            >
              <Check className="size-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onReject?.();
              }}
              aria-label="Reject leave request"
            >
              <X className="size-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
