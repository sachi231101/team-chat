import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700/60',
    primary: 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/50',
    success: 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50',
    warning: 'bg-amber-950/80 text-amber-300 border border-amber-700/50',
    danger: 'bg-rose-950/80 text-rose-300 border border-rose-700/50',
    purple: 'bg-purple-950/80 text-purple-300 border border-purple-700/50',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 font-medium rounded',
    md: 'text-xs px-2 py-0.5 font-medium rounded-md',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 font-semibold', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
