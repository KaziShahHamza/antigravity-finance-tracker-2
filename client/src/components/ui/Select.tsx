// client/src/components/ui/Select.tsx

// Reusable Select dropdown primitive with custom options, label, error state, and hint text.

import * as React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ id, label, error, hint, options, children, className = '', disabled, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = selectId && error ? `${selectId}-error` : undefined;
    const hintId = selectId && hint ? `${selectId}-hint` : undefined;

    const controlClassName = ['field-control', error ? 'field-control-error' : '', className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="field-group">
        {label && (
          <label htmlFor={selectId} className="field-label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={controlClassName}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
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

Select.displayName = 'Select';
