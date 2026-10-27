import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Ejecuta una función que retorna una promesa (normalmente una llamada a la API)
 * y expone { data, loading, error, refetch }. Cancela peticiones obsoletas
 * si las dependencias cambian antes de que resuelvan.
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const run = useCallback(() => {
    const currentId = ++requestId.current;
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (currentId === requestId.current) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (currentId === requestId.current) {
          setError(err);
          setLoading(false);
        }
      });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, refetch: run };
}
