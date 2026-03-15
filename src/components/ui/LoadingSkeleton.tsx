import React from 'react';
import { cn } from '../../utils/utils';

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function LoadingSkeleton({ className, ...props }: LoadingSkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-surface border border-border/50', className)}
      {...props}
    />
  );
}
