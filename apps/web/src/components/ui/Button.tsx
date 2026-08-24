import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, style, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variantStyles: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
      primary: {
        background: 'var(--color-accent)',
        color: '#ffffff',
      },
      secondary: {
        background: 'var(--color-input)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border)',
      },
      ghost: {
        background: 'transparent',
        color: 'var(--color-text-secondary)',
      },
      danger: {
        background: 'var(--color-danger)',
        color: '#ffffff',
      },
      outline: {
        background: 'transparent',
        color: 'var(--color-text-secondary)',
        border: '1px solid var(--color-border)',
      },
    };

    const variantClasses = {
      primary: 'shadow-md active:scale-[0.98] hover:opacity-90',
      secondary: 'active:scale-[0.98] hover-surface',
      ghost: 'active:scale-[0.98] hover-surface',
      danger: 'shadow-md active:scale-[0.98] hover:opacity-90',
      outline: 'active:scale-[0.98] hover-surface',
    };

    const sizes = {
      xs: 'text-xs px-2 py-1 gap-1',
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-3.5 py-2 gap-2',
      lg: 'text-base px-4 py-2.5 gap-2.5',
      icon: 'p-2 rounded-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantClasses[variant], sizes[size], className)}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      >
        {isLoading && (
          <svg className="h-4 w-4 animate-spin mr-1.5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
