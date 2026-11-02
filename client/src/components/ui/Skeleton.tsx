// client/src/components/ui/Skeleton.tsx

// Reusable placeholder Skeleton loader primitive with animated pulse effect.

import * as React from 'react';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return <div className={`skeleton ${className}`.trim()} aria-hidden="true" {...props} />;
}
