// client/src/components/ui/Card.tsx

// Reusable container Card primitive with optional header, title, and description.

import * as React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function Card({
  title,
  description,
  action,
  children,
  className = '',
  ...props
}: CardProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <div className={`card ${className}`.trim()} {...props}>
      {hasHeader && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {description && <p className="card-description">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
