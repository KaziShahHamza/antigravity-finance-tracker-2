// client/src/components/ui/Input.tsx

// Reusable text input primitive with label, hint, error message, and accessibility attributes.

import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, error, hint, className = '', disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = inputId && error ? `${inputId}-error` : undefined;
    const hintId = inputId && hint ? `${inputId}-hint` : undefined;

    const controlClassName = ['field-control', error ? 'field-control-error' : '', className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="field-group">
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={controlClassName}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="field-hint">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="field-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
