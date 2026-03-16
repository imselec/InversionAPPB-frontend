import { useState, useEffect } from 'react';

/**
 * Debounces a value — only updates after `delay` ms of no changes.
 * Used to prevent excessive API calls on rapid user input.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
