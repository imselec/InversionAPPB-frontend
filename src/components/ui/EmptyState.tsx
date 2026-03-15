import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 text-text-muted">
        {icon}
      </div>
      <p className="text-text-secondary mb-4">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
