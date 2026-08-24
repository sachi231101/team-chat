import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'form-input w-full rounded-lg px-3.5 py-2 text-sm transition-colors disabled:opacity-50',
            icon && 'pl-9',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
