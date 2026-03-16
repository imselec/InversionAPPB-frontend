import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { registerPushNotifications } from './services/pushNotificationService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      retryDelay: 2000,
      staleTime: 60000,        // 1 min — don't refetch on every mount
      gcTime: 300000,          // 5 min cache
    },
  },
});

// Unregister any stale service workers (they don't work with file:// / Capacitor)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => reg.unregister());
  }).catch(() => {});
}

// Register push notifications on native platforms (Android/iOS)
registerPushNotifications().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
