// client/src/components/ui/Badge.tsx

// Reusable status Badge primitive supporting financial semantic color variants.

import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
}

const badgeVariants: Record<NonNullable<BadgeProps['variant']>, string> = {
  neutral: 'badge-neutral',
  brand: 'badge-brand',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
};

export function Badge({ variant = 'neutral', className = '', children, ...props }: BadgeProps) {
  const combinedClassName = ['badge', badgeVariants[variant], className].filter(Boolean).join(' ');

  return (
    <span className={combinedClassName} {...props}>
      {children}
    </span>
  );
}
