import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title = 'Error', message, onRetry }: ErrorMessageProps) {
  return (
    <div role="alert" className="card border-danger/30 bg-danger/10 flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="w-10 h-10 text-danger mb-3" />
      <h3 className="text-lg font-medium text-danger mb-1">{title}</h3>
      <p className="text-sm text-text-secondary mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-danger/20 hover:bg-danger/30 text-danger rounded-lg transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}
