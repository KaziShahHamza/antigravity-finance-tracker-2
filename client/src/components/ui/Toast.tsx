// client/src/components/ui/Toast.tsx

// Reusable alert/notification Toast banner with icon and status styling.

import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import * as React from 'react';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

const toastIcons = {
  info: <Info className="h-4 w-4 text-brand-600 dark:text-brand-400" />,
  success: <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
  error: <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
};

export function Toast({ variant = 'info', message, className = '', ...props }: ToastProps) {
  return (
    <div role="alert" className={`toast ${className}`.trim()} {...props}>
      <span className="shrink-0">{toastIcons[variant]}</span>
      <span className="font-medium">{message}</span>
    </div>
  );
}
