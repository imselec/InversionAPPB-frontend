import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Cargando datos...' }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}
