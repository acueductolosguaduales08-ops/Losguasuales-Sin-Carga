// SUPABASE-ONLY: la cola legacy /api/v1/* ya no se reintenta contra Spring.
// Las mutaciones Supabase van directo; si había ops viejas en IndexedDB se descartan
// para no pegar a Render. Se conserva la firma para no romper imports.
import { getAllPending, removePending } from './offlineQueue';
import { cacheInvalidate } from './apiCache';

let syncing = false;
let lastSyncAt = 0;

function invalidateForPath(path) {
  const parts = path.split('/').filter(Boolean);
  const patterns = [];
  for (let i = 3; i <= parts.length; i++) patterns.push('/' + parts.slice(0, i).join('/'));
  patterns.forEach((p) => { try { cacheInvalidate(p); } catch {} });
}

export async function syncPendingQueue() {
  if (syncing) return { synced: 0, failed: 0, skipped: true };
  syncing = true;
  let synced = 0;
  let failed = 0;
  try {
    const pending = await getAllPending();
    // Descarta ops legacy contra Spring (/api/...) sin reintentar red
    for (const op of pending) {
      if (op.path && op.path.startsWith('/api/')) {
        await removePending(op.id);
      } else {
        failed++;
      }
    }
  } finally {
    syncing = false;
    lastSyncAt = Date.now();
    try { window.dispatchEvent(new CustomEvent('acueducto-sync-done', { detail: { synced, failed } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('acueducto-queue-changed')); } catch {}
  }
  return { synced, failed };
}

export function isSyncing() { return syncing; }
export function getLastSyncAt() { return lastSyncAt; }

// Auto-sync al recuperar conexión o al despertar
let listenersAttached = false;
export function attachAutoSync() {
  if (listenersAttached) return;
  listenersAttached = true;
  const trySync = () => {
    if (navigator.onLine) syncPendingQueue().catch(() => {});
  };
  window.addEventListener('online', trySync);
  window.addEventListener('acueducto-awake', trySync);
  window.addEventListener('acueducto-sync-needed', trySync);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) trySync();
  });
  // Intento inicial tras 2s
  setTimeout(trySync, 2000);
}
