import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple';
  size?: 'sm' | 'md';
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, React.CSSProperties> = {
  default: {
    background: 'var(--color-input)',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
  },
  primary: {
    background: 'var(--color-accent-muted)',
    color: 'var(--color-accent)',
    border: '1px solid var(--color-active-border)',
  },
  success: {
    background: 'rgba(34,197,94,0.12)',
    color: '#16a34a',
    border: '1px solid rgba(34,197,94,0.3)',
  },
  warning: {
    background: 'rgba(245,158,11,0.12)',
    color: 'var(--color-away)',
    border: '1px solid rgba(245,158,11,0.3)',
  },
  danger: {
    background: 'var(--color-danger-muted)',
    color: 'var(--color-danger)',
    border: '1px solid rgba(239,68,68,0.3)',
  },
  purple: {
    background: 'var(--color-accent-muted)',
    color: 'var(--color-accent)',
    border: '1px solid var(--color-active-border)',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  style,
  ...props
}) => {
  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 font-medium rounded',
    md: 'text-xs px-2 py-0.5 font-medium rounded-md',
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1 font-semibold', sizes[size], className)}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </span>
  );
};
