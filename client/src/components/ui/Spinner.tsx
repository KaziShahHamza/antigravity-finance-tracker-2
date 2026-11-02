// client/src/components/ui/Spinner.tsx

// Accessible animated loading Spinner primitive with configurable size and screen-reader label.

import { Loader2 } from 'lucide-react';
import * as React from 'react';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Spinner({
  size = 'md',
  label = 'Loading...',
  className = '',
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      className={`inline-flex items-center justify-center text-brand-600 ${className}`.trim()}
      {...props}
    >
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
