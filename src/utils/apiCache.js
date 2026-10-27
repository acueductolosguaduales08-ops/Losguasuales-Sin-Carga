import { persistentGetFreshSync, persistentGetStaleSync, persistentSet, persistentInvalidate, persistentClear, TTL_FRESH } from './persistentCache';

const CACHE_PREFIX = 'acueducto_cache_';
const DEFAULT_TTL = TTL_FRESH; // 3 minutes — re-exported from persistentCache

function getKey(url) {
  return CACHE_PREFIX + url;
}

// Mantiene API original pero ahora delega a persistentCache (IDB + LS mirror)
export function cacheGet(url) {
  // Intenta fresh sync (LS mirror)
  const fresh = persistentGetFreshSync(url);
  if (fresh !== null) return fresh;
  return null;
}

export function cacheSet(url, data, ttl = DEFAULT_TTL) {
  // Guarda con ttl como fresh; stale siempre 7 días
  persistentSet(url, data, ttl, undefined).catch(() => {});
}

// Nuevo: lectura stale síncrona (sirve aunque fresh expirado, dentro de 7d)
export function cacheGetStale(url) {
  return persistentGetStaleSync(url);
}

/**
 * Invalidate cache entries matching a URL prefix or regex.
 * Used after mutations (POST/DELETE/PUT) to ensure stale data is removed.
 */
export function cacheInvalidate(urlPattern) {
  if (urlPattern instanceof RegExp) {
    // Regex: necesita escaneo LS (IDB se limpia async pero LS es lo crítico para sync)
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          const real = k.slice(CACHE_PREFIX.length);
          if (urlPattern.test(real)) keys.push(k);
        }
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {}
    // IDB regex clear async
    import('./persistentCache').then(({ persistentInvalidate }) => {
      // No hay soporte regex en persistentInvalidate, hacemos clear parcial via LS ya hecho
    }).catch(() => {});
    return;
  }
  persistentInvalidate(urlPattern).catch(() => {});
}

/**
 * Clear all API cache entries from localStorage.
 */
export function cacheClear() {
  persistentClear().catch(() => {});
}
