import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * Shows a banner when the device loses internet connectivity.
 * Automatically hides when connection is restored.
 */
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-danger text-white text-xs font-medium py-2 px-4 flex items-center justify-center gap-2">
      <WifiOff className="w-3.5 h-3.5" />
      Sin conexión — mostrando datos en caché
    </div>
  );
}
