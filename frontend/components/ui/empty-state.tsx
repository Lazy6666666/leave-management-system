import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

export interface ActionConfig {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode | ActionConfig;
  primaryAction?: ReactNode | ActionConfig;
  secondaryAction?: ReactNode | ActionConfig;
  className?: string;
}

function renderAction(action: ReactNode | ActionConfig | undefined) {
  if (!action) return null;

  // Check if it's an ActionConfig object
  if (typeof action === 'object' && action !== null && 'label' in action && 'onClick' in action) {
    const config = action as ActionConfig;
    return (
      <Button onClick={config.onClick} aria-label={config.label}>
        {config.label}
      </Button>
    );
  }

  // Otherwise render as ReactNode
  return action as ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const renderedAction = renderAction(action);
  const renderedPrimaryAction = renderAction(primaryAction);
  const renderedSecondaryAction = renderAction(secondaryAction);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center max-w-full overflow-hidden',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 text-muted-foreground shrink-0" aria-hidden="true">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-lg md:text-xl lg:text-2xl font-semibold tracking-tight mb-2 leading-relaxed break-words whitespace-normal max-w-full">
        {title}
      </h3>
      {description && (
        <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md leading-relaxed break-words whitespace-normal">
          {description}
        </p>
      )}
      {(renderedAction || renderedPrimaryAction || renderedSecondaryAction) && (
        <div className="mt-4 flex gap-2">
          {renderedAction}
          {renderedPrimaryAction}
          {renderedSecondaryAction}
        </div>
      )}
    </div>
  );
}
