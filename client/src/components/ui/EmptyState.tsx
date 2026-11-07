// client/src/components/ui/EmptyState.tsx

// Reusable EmptyState UI primitive for displaying consistent empty feedback, iconography, and call-to-action buttons.

import * as React from 'react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={`text-center p-8 sm:p-12 rounded-2xl bg-surface border border-border-subtle space-y-4 ${className}`.trim()}
      {...props}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-surface-muted text-fg-muted flex items-center justify-center mx-auto">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="font-semibold text-fg">{title}</h3>
        {description && <p className="text-sm text-fg-muted max-w-sm mx-auto">{description}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
