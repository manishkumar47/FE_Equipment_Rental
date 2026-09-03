import { useEffect, useState } from 'react';

/**
 * Returns a copy of `value` that only updates after `delayMs` of no changes.
 * Use for search inputs that drive a server fetch, so each keystroke doesn't
 * fire its own request.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
