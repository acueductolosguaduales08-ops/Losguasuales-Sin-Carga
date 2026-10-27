// Cache persistente con IndexedDB + fallback a localStorage
// Tier 1: TTL_FRESH 3min (revalida background), TTL_STALE 7 días (sirve offline)
const DB_NAME = 'acueducto_persistent_cache';
const DB_VERSION = 1;
const STORE = 'responses';
const PREFIX = 'acueducto_cache_';
export const TTL_FRESH = 3 * 60 * 1000;
export const TTL_STALE = 7 * 24 * 60 * 60 * 1000;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IDB not available'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function lsGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function lsSet(key, entry) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(entry)); } catch {}
}
function lsDel(key) {
  try { localStorage.removeItem(PREFIX + key); } catch {}
}

// Guarda en IDB y también en localStorage como mirror
export async function persistentSet(key, data, ttlFresh = TTL_FRESH, ttlStale = TTL_STALE) {
  const entry = { key, data, ts: Date.now(), ttlFresh, ttlStale };
  lsSet(key, entry);
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    await new Promise((res, rej) => { tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); rej(tx.error); }; });
  } catch { /* fallback ya guardado en LS */ }
}

export async function persistentGetFresh(key) {
  // Intenta IDB primero, luego LS
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    const entry = await new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
    db.close();
    if (entry) {
      if (Date.now() - entry.ts <= (entry.ttlFresh || TTL_FRESH)) return entry.data;
      return null;
    }
  } catch {}
  const ls = lsGet(key);
  if (ls && Date.now() - ls.ts <= (ls.ttlFresh || TTL_FRESH)) return ls.data;
  return null;
}

export async function persistentGetStale(key) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    const entry = await new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
    db.close();
    if (entry) {
      if (Date.now() - entry.ts <= (entry.ttlStale || TTL_STALE)) return entry.data;
      // expirado incluso stale -> borrar
      persistentDelete(key);
      return null;
    }
  } catch {}
  const ls = lsGet(key);
  if (ls) {
    if (Date.now() - ls.ts <= (ls.ttlStale || TTL_STALE)) return ls.data;
    lsDel(key);
  }
  return null;
}

// Síncrono para client.js (evita await en hot path) — usa LS mirror
export function persistentGetStaleSync(key) {
  const ls = lsGet(key);
  if (ls && Date.now() - ls.ts <= (ls.ttlStale || TTL_STALE)) return ls.data;
  // si no está en LS pero sí en IDB, no lo veremos sincrónicamente; se recuperará en siguiente carga
  return null;
}

export function persistentGetFreshSync(key) {
  const ls = lsGet(key);
  if (ls && Date.now() - ls.ts <= (ls.ttlFresh || TTL_FRESH)) return ls.data;
  return null;
}

export async function persistentDelete(key) {
  lsDel(key);
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    await new Promise((res, rej) => { tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); rej(tx.error); }; });
  } catch {}
}

export async function persistentInvalidate(prefix) {
  // Borra LS
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        const real = k.slice(PREFIX.length);
        if (real.startsWith(prefix)) keys.push(k);
      }
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
  // Borra IDB
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.getAllKeys();
    const keys = await new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
    for (const k of keys) if (String(k).startsWith(prefix)) store.delete(k);
    await new Promise((res, rej) => { tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); rej(tx.error); }; });
  } catch {}
}

export async function persistentClear() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    await new Promise((res, rej) => { tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); rej(tx.error); }; });
  } catch {}
}

// Helpers síncronos para compatibilidad con apiCache existente
export function isFreshSync(key) {
  const ls = lsGet(key);
  if (!ls) return false;
  return Date.now() - ls.ts <= (ls.ttlFresh || TTL_FRESH);
}
