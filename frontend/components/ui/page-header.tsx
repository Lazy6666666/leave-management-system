import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, actions, className }: PageHeaderProps) {
  const displayAction = actions || action;

  return (
    <div className={cn('flex flex-col gap-4 pb-6 max-w-full overflow-hidden', className)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 max-w-full overflow-hidden">
        <div className="flex-1 min-w-0 max-w-full overflow-hidden space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-relaxed break-words whitespace-normal max-w-full">
            {title}
          </h1>
          {description && (
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed break-words whitespace-normal max-w-full">
              {description}
            </p>
          )}
        </div>
        {displayAction && (
          <div className="shrink-0">
            {displayAction}
          </div>
        )}
      </div>
    </div>
  );
}
