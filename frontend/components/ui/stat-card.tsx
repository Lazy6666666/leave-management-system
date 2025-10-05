import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label?: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, description, trend, className }: StatCardProps) {
  return (
    <Card className={cn('max-w-full overflow-hidden', className)}>
      <CardContent className="p-6 max-w-full overflow-hidden">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2 max-w-full">
          <h3 className="text-xs md:text-sm font-medium text-muted-foreground leading-relaxed break-words whitespace-normal flex-1 min-w-0 max-w-full">
            {title}
          </h3>
          {Icon && (
            <div className="text-muted-foreground shrink-0" aria-hidden="true">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="max-w-full overflow-hidden">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed break-words whitespace-normal max-w-full">
            {value}
          </div>
          {description && (
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed break-words whitespace-normal max-w-full">
              {description}
            </p>
          )}
          {trend && (
            <p
              className={cn(
                'text-xs md:text-sm leading-relaxed break-words whitespace-normal max-w-full',
                trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              <span>
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
              {trend.label && <span> {trend.label}</span>}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
