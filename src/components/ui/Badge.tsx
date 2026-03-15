import React from 'react';
import { cn } from '../../utils/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'primary';
}

export function Badge({ children, variant = 'default', className, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-surface text-text-primary border border-border',
    success: 'bg-success/20 text-success border border-success/30',
    danger: 'bg-danger/20 text-danger border border-danger/30',
    warning: 'bg-warning/20 text-warning border border-warning/30',
    primary: 'bg-primary/20 text-primary border border-primary/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
