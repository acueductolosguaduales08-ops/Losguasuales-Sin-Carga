import {
  API_BASE_URL,
  getAccessToken,
  getRefreshToken,
  setSession,
  clearSession,
} from './config';
import { cacheGet, cacheSet, cacheInvalidate, cacheGetStale } from '../utils/apiCache';

// Error de API enriquecido con status y payload del backend
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export class OfflineQueuedError extends Error {
  constructor(message, queuedOp) {
    super(message);
    this.name = 'OfflineQueuedError';
    this.queuedOp = queuedOp;
    this.status = 0;
  }
}

let refreshPromise = null;

// Evento custom para despertar la pantalla cuando la API es lenta
export function dispatchSlowRequest() {
  window.dispatchEvent(new CustomEvent('acueducto-slow-request'));
}

export function dispatchOfflineQueued(op) {
  window.dispatchEvent(new CustomEvent('acueducto-offline-queued', { detail: op }));
}
export function dispatchSyncNeeded() {
  window.dispatchEvent(new CustomEvent('acueducto-sync-needed'));
}
export function dispatchAwake() {
  window.dispatchEvent(new CustomEvent('acueducto-awake'));
}

// Detecta si el error es por red / servidor dormido (no por 4xx de negocio)
function isNetworkError(err) {
  if (err instanceof TypeError && /fetch|Failed to fetch|NetworkError|Load failed/i.test(err.message)) return true;
  if (err.name === 'AbortError') return true;
  if (err instanceof ApiError && err.status >= 500) return true;
  if (err instanceof ApiError && err.status === 0) return true;
  return false;
}

// Lista de endpoints que sí se pueden encolar offline (Tier 1 seguros)
// Todo lo de datos-importantes, facturas/generar, periodos, etc. NO se encola
const ENQUEUE_ALLOWLIST = [
  '/api/v1/publicaciones', // crear/editar/reacciones
  '/api/v1/encuestas', // responder / crear (si es admin)
  '/api/v1/notificaciones', // marcar leida, crear aviso
  '/api/v1/reportes-comunidad',
  '/api/v1/chat',
];

const ENQUEUE_BLOCKLIST = [
  '/api/v1/datos-importantes',
  '/api/v1/facturas/generar',
  '/api/v1/auth/usuarios',
  '/api/v1/periodos',
];

function isEnqueueAllowed(path) {
  if (ENQUEUE_BLOCKLIST.some((p) => path.startsWith(p))) return false;
  if (ENQUEUE_ALLOWLIST.some((p) => path.startsWith(p))) return true;
  // Por defecto: solo encola si es POST/PUT/PATCH de encuestas/publicaciones/notificaciones
  return false;
}

function isDeletePendingConfirmation(path, method) {
  if (method !== 'DELETE') return false;
  // Todos los DELETE requieren confirmación al despertar (requisito usuario #4)
  return true;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new ApiError('Sesión expirada', 401, null);

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw new ApiError('No se pudo renovar la sesión', res.status, null);
        const data = await res.json();
        setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function buildCacheKey(path, params) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }
  return url.pathname + url.search;
}

/**
 * Invalidate cache entries related to a mutation path.
 * E.g. POST /api/v1/facturas/generar-mes → invalidate all /api/v1/facturas
 */
function invalidateForMutation(path) {
  const parts = path.split('/').filter(Boolean);
  // Build progressively shorter prefixes: /api/v1/facturas, /api/v1, etc.
  const patterns = [];
  for (let i = 3; i <= parts.length; i++) {
    patterns.push('/' + parts.slice(0, i).join('/'));
  }
  patterns.forEach((p) => cacheInvalidate(p));
}

/**
 * Cliente central de peticiones. Maneja JSON, auth por Bearer token,
 * reintento automático en 401 (refresh) y normalización de errores.
 * Implementa caché persistente (IDB + LS) con stale-while-revalidate:
 *  1. GET fresh → retorna inmediato + revalida background.
 *  2. GET stale (dentro 7d) → retorna inmediato aunque expirado + revalida.
 *  3. Mutaciones: si red falla y está en allowlist → encola offline.
 *  4. DELETE: si red falla → encola como pending_delete con confirmación al despertar.
 */
export async function apiRequest(path, { method = 'GET', body, params, isPublic = false, signal, raw = false, _skipQueue = false } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  const cacheKey = buildCacheKey(path, params);

  const doFetch = async (token, fetchSignal) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: fetchSignal || signal,
    });
  };

  let token = isPublic ? null : getAccessToken();

  // --- Cache for GET requests ---
  // Admin/privado: usa fresh+stale. Público: también cachea (isPublic GET también merece stale para home)
  const shouldCacheGet = method === 'GET' && !raw;
  if (shouldCacheGet) {
    const fresh = cacheGet(cacheKey);
    if (fresh !== null) {
      // Fresh hit: retorna y revalida en background
      const slowTimer = setTimeout(() => dispatchSlowRequest(), 5000);
      const bgController = new AbortController();
      const bgTimeout = setTimeout(() => bgController.abort(), 10000);
      doFetch(token, bgController.signal)
        .then((res) => {
          if (res.status === 401 && getRefreshToken() && !isPublic) {
            return refreshAccessToken().then((t) => doFetch(t, bgController.signal));
          }
          return res;
        })
        .then(async (res) => {
          clearTimeout(slowTimer); clearTimeout(bgTimeout);
          if (res && res.ok) {
            const ct = res.headers.get('content-type') || '';
            const data = ct.includes('application/json') ? await res.json() : await res.text();
            cacheSet(cacheKey, data);
          }
        })
        .catch(() => { clearTimeout(slowTimer); clearTimeout(bgTimeout); });
      return fresh;
    }
    const stale = cacheGetStale(cacheKey);
    if (stale !== null) {
      // Stale hit (dentro 7d): retorna inmediato para evitar spinner cuando Render duerme
      const slowTimer = setTimeout(() => dispatchSlowRequest(), 5000);
      const bgController = new AbortController();
      const bgTimeout = setTimeout(() => bgController.abort(), 10000);
      doFetch(token, bgController.signal)
        .then((res) => {
          if (res.status === 401 && getRefreshToken() && !isPublic) {
            return refreshAccessToken().then((t) => doFetch(t, bgController.signal));
          }
          return res;
        })
        .then(async (res) => {
          clearTimeout(slowTimer); clearTimeout(bgTimeout);
          if (res && res.ok) {
            const ct = res.headers.get('content-type') || '';
            const data = ct.includes('application/json') ? await res.json() : await res.text();
            cacheSet(cacheKey, data);
          }
        })
        .catch(() => { clearTimeout(slowTimer); clearTimeout(bgTimeout); });
      return stale;
    }
  }

  // No cache hit — hacer fetch con timeout 10s para detectar servidor dormido rápido
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const effectiveSignal = signal ? (() => {
    // combinar signal externo con timeout interno
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
    return controller.signal;
  })() : controller.signal;

  const slowTimer = setTimeout(() => dispatchSlowRequest(), 5000);

  let res;
  try {
    res = await doFetch(token, effectiveSignal);
  } catch (err) {
    clearTimeout(slowTimer); clearTimeout(timeoutId);
    // Si es error de red y es mutación encolable → encolar
    if (!_skipQueue && method !== 'GET' && method !== 'HEAD' && isNetworkError(err)) {
      if (isDeletePendingConfirmation(path, method)) {
        // DELETE → pending_delete con confirmación al despertar
        try {
          const { enqueueDelete } = await import('../utils/offlineQueue');
          const op = await enqueueDelete({ path, method, body, params });
          dispatchOfflineQueued(op);
          throw new OfflineQueuedError('Eliminación guardada. Se pedirá confirmación cuando el servidor despierte.', op);
        } catch (e) {
          if (e instanceof OfflineQueuedError) throw e;
        }
      } else if (isEnqueueAllowed(path)) {
        try {
          const { enqueue } = await import('../utils/offlineQueue');
          const op = await enqueue({ path, method, body, params });
          dispatchOfflineQueued(op);
          // Respuesta optimista: retorna body con id temporal para que el caller vea éxito
          const optimistic = body ? { ...body, id: `temp_${Date.now()}`, __offline: true, __queuedId: op.id } : { __offline: true, __queuedId: op.id, success: true };
          try { invalidateForMutation(path); } catch {}
          return optimistic;
        } catch (e) {
          if (e instanceof OfflineQueuedError) throw e;
          // si falló enqueue, intentar stale fallback
        }
      }
      // Si no es encolable, intentar servir stale si existe
      if (shouldCacheGet) {
        const staleFallback = cacheGetStale(cacheKey);
        if (staleFallback !== null) return staleFallback;
      }
    }
    // GET con stale fallback si hay error de red
    if (shouldCacheGet && isNetworkError(err)) {
      const staleFallback = cacheGetStale(cacheKey);
      if (staleFallback !== null) return staleFallback;
    }
    throw err;
  } finally {
    clearTimeout(slowTimer); clearTimeout(timeoutId);
  }

  // Si el token expiró y no es público, intenta refrescar una vez
  if (res.status === 401 && !isPublic && getRefreshToken()) {
    try {
      token = await refreshAccessToken();
      res = await doFetch(token);
    } catch {
      clearSession();
    }
  }

  if (!res.ok) {
    // Si es 5xx y es mutación encolable, encolar también
    if (!_skipQueue && method !== 'GET' && method !== 'HEAD' && res.status >= 500) {
      if (isDeletePendingConfirmation(path, method)) {
        try {
          const { enqueueDelete } = await import('../utils/offlineQueue');
          const op = await enqueueDelete({ path, method, body, params });
          dispatchOfflineQueued(op);
          throw new OfflineQueuedError('Eliminación guardada. Se pedirá confirmación cuando el servidor despierte.', op);
        } catch (e) { if (e instanceof OfflineQueuedError) throw e; }
      } else if (isEnqueueAllowed(path)) {
        try {
          const { enqueue } = await import('../utils/offlineQueue');
          const op = await enqueue({ path, method, body, params });
          dispatchOfflineQueued(op);
          const optimistic = body ? { ...body, id: `temp_${Date.now()}`, __offline: true, __queuedId: op.id, success: true } : { __offline: true, __queuedId: op.id, success: true };
          try { invalidateForMutation(path); } catch {}
          return optimistic;
        } catch (e) { if (e instanceof OfflineQueuedError) throw e; }
      }
    }
    let data = null;
    let textFallback = null;
    try {
      data = await res.json();
    } catch {
      try { textFallback = await res.text(); } catch { /* ignore */ }
    }
    const message = data?.mensaje || data?.message || data?.error || textFallback || defaultMessageFor(res.status);
    throw new ApiError(message, res.status, data || textFallback);
  }

  // After successful mutation, invalidate related cache
  if (method !== 'GET' && method !== 'HEAD') {
    invalidateForMutation(path);
  }

  if (res.status === 204) return null;
  if (raw) return res;

  const contentType = res.headers.get('content-type') || '';
  let result;
  if (contentType.includes('application/json')) {
    result = await res.json();
  } else {
    result = await res.text();
  }

  // Cache the fresh GET response (también para isPublic en Tier1)
  if (shouldCacheGet) {
    cacheSet(cacheKey, result);
  }

  return result;
}

function defaultMessageFor(status) {
  switch (status) {
    case 401:
      return 'Debes iniciar sesión para continuar.';
    case 403:
      return 'No tienes permisos para realizar esta acción.';
    case 404:
      return 'No se encontró el recurso solicitado.';
    case 422:
      return 'Los datos enviados no son válidos.';
    case 500:
      return 'Ocurrió un error en el servidor. Intenta más tarde.';
    default:
      return 'Ocurrió un error inesperado.';
  }
}

export const api = {
  get: (path, opts) => apiRequest(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiRequest(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => apiRequest(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => apiRequest(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => apiRequest(path, { ...opts, method: 'DELETE' }),
};

// Re-export cacheClear for use in UI (e.g. MiCuenta "Borrar Caché" button)
export { cacheClear } from '../utils/apiCache';

/**
 * Sube un archivo como multipart/form-data (sin Content-Type manual, el
 * navegador define el boundary). Reutiliza el mismo manejo de auth/refresh/errores.
 */
export async function apiUpload(path, { paramName = 'archivo', file, params, signal } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  const doFetch = async (token) => {
    const formData = new FormData();
    formData.append(paramName, file);
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url.toString(), { method: 'POST', headers, body: formData, signal });
  };

  let token = getAccessToken();
  let res = await doFetch(token);

  if (res.status === 401 && getRefreshToken()) {
    try {
      token = await refreshAccessToken();
      res = await doFetch(token);
    } catch {
      clearSession();
    }
  }

  if (!res.ok) {
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    const message = data?.mensaje || data?.message || data?.error || defaultMessageFor(res.status);
    throw new ApiError(message, res.status, data);
  }

  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}
