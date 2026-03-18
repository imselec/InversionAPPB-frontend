import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

/**
 * Polls the backend root endpoint until it responds.
 * Returns true once the backend is reachable.
 */
export function useBackendReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      while (!cancelled) {
        try {
          await apiClient.get('/', { timeout: 10000 });
          if (!cancelled) setReady(true);
          return;
        } catch {
          // Wait 3s before retrying
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }

    ping();
    return () => { cancelled = true; };
  }, []);

  return ready;
}
