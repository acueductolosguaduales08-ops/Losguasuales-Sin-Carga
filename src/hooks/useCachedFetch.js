import { useEffect, useRef, useState, useCallback } from 'react';
import { cacheGet, cacheSet } from '../utils/apiCache';

/**
 * Like useFetch but with localStorage cache (stale-while-revalidate).
 * Shows cached data immediately, then fetches fresh data in background.
 */
export function useCachedFetch(fetcher, deps = [], ttl) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);
  const cacheKey = useRef(null);

  const run = useCallback(() => {
    const currentId = ++requestId.current;
    const key = typeof fetcher === 'function' ? String(fetcher) : '';

    // Try cache first for instant display
    const cached = cacheGet(key);
    if (cached !== null) {
      setData(cached);
      setLoading(false);
    }

    // Always fetch fresh
    setError(null);
    fetcher()
      .then((result) => {
        if (currentId === requestId.current) {
          setData(result);
          setLoading(false);
          cacheSet(key, result, ttl);
        }
      })
      .catch((err) => {
        if (currentId === requestId.current) {
          // If we have cached data, keep it but show error too
          if (cached === null) {
            setLoading(false);
          }
          setError(err);
        }
      });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, refetch: run };
}
