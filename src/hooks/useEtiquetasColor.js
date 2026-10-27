import { useEffect, useState } from 'react';
import { PublicacionesAPI } from '../api/publicaciones';

let cache = null;
let cachePromise = null;

// Todas las etiquetas comparten el mismo catálogo global, así que se cachea
// en memoria para no repetir la petición cada vez que se muestra una etiqueta.
function fetchEtiquetas() {
  if (cache) return Promise.resolve(cache);
  if (!cachePromise) {
    cachePromise = PublicacionesAPI.etiquetas()
      .then((data) => {
        cache = data || [];
        return cache;
      })
      .catch(() => []);
  }
  return cachePromise;
}

export function useEtiquetasColor() {
  const [mapa, setMapa] = useState({});

  useEffect(() => {
    let activo = true;
    fetchEtiquetas().then((tags) => {
      if (!activo) return;
      const next = {};
      tags.forEach((t) => {
        next[(t.nombre || '').toLowerCase()] = t.color || '#2563EB';
      });
      setMapa(next);
    });
    return () => {
      activo = false;
    };
  }, []);

  const colorDe = (nombre) => mapa[(nombre || '').toLowerCase()] || '#2563EB';

  return { colorDe };
}
