// Cola offline en IndexedDB — guarda mutaciones cuando Render está dormido
const DB_NAME = 'acueducto_offline_queue';
const DB_VERSION = 1;
const STORE_PENDING = 'pending';
const STORE_DELETE = 'pending_delete';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IDB not available'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PENDING)) db.createObjectStore(STORE_PENDING, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_DELETE)) db.createObjectStore(STORE_DELETE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function lsFallbackKey(store) { return `acueducto_queue_${store}`; }
function lsGetAll(store) {
  try { return JSON.parse(localStorage.getItem(lsFallbackKey(store)) || '[]'); } catch { return []; }
}
function lsSetAll(store, arr) {
  try { localStorage.setItem(lsFallbackKey(store), JSON.stringify(arr)); } catch {}
}

export async function enqueue({ path, method, body, params }) {
  const op = {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    path, method, body, params,
    createdAt: new Date().toISOString(),
    retries: 0,
  };
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    tx.objectStore(STORE_PENDING).put(op);
    await new Promise((res, rej) => { tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); rej(tx.error); }; });
  } catch {
    const all = lsGetAll(STORE_PENDING);
    all.push(op);
    lsSetAll(STORE_PENDING, all);
  }
  try { window.dispatchEvent(new CustomEvent('acueducto-queue-changed')); } catch {}
  return op;
}

export async function enqueueDelete({ path, method, body, params }) {
  const op = {
    id: `d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    path, method, body, params,
    createdAt: new Date().toISOString(),
    retries: 0,
  };
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DELETE, 'readwrite');
    tx.objectStore(STORE_DELETE).put(op);
    await new Promise((res, rej) => { tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); rej(tx.error); }; });
  } catch {
    const all = lsGetAll(STORE_DELETE);
    all.push(op);
    lsSetAll(STORE_DELETE, all);
  }
  try { window.dispatchEvent(new CustomEvent('acueducto-queue-changed')); } catch {}
  return op;
}

export async function getAllPending() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PENDING, 'readonly');
    const req = tx.objectStore(STORE_PENDING).getAll();
    const res = await new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
    db.close();
    // merge LS fallback if any
    const ls = lsGetAll(STORE_PENDING);
    if (ls.length && res.length === 0) return ls;
    return res || [];
  } catch {
    return lsGetAll(STORE_PENDING);
  }
}

export async function getAllPendingDeletes() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DELETE, 'readonly');
    const req = tx.objectStore(STORE_DELETE).getAll();
    const res = await new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
    db.close();
    const ls = lsGetAll(STORE_DELETE);
    if (ls.length && res.length === 0) return ls;
    return res || [];
  } catch {
    return lsGetAll(STORE_DELETE);
  }
}

export async function removePending(id) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    tx.objectStore(STORE_PENDING).delete(id);
    await new Promise((res, rej) => { tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); rej(tx.error); }; });
  } catch {}
  const ls = lsGetAll(STORE_PENDING).filter((o) => o.id !== id);
  lsSetAll(STORE_PENDING, ls);
  try { window.dispatchEvent(new CustomEvent('acueducto-queue-changed')); } catch {}
}

export async function removePendingDelete(id) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DELETE, 'readwrite');
    tx.objectStore(STORE_DELETE).delete(id);
    await new Promise((res, rej) => { tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); rej(tx.error); }; });
  } catch {}
  const ls = lsGetAll(STORE_DELETE).filter((o) => o.id !== id);
  lsSetAll(STORE_DELETE, ls);
  try { window.dispatchEvent(new CustomEvent('acueducto-queue-changed')); } catch {}
}

export async function confirmDelete(id) {
  // Mueve de pending_delete a pending para ejecución
  const deletes = await getAllPendingDeletes();
  const op = deletes.find((o) => o.id === id);
  if (!op) return null;
  await removePendingDelete(id);
  // re-encola como pending normal
  const newOp = { ...op, id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` };
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    tx.objectStore(STORE_PENDING).put(newOp);
    await new Promise((res, rej) => { tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); rej(tx.error); }; });
  } catch {
    const all = lsGetAll(STORE_PENDING);
    all.push(newOp);
    lsSetAll(STORE_PENDING, all);
  }
  try { window.dispatchEvent(new CustomEvent('acueducto-queue-changed')); } catch {}
  return newOp;
}

export async function getQueueCount() {
  const [a, b] = await Promise.all([getAllPending(), getAllPendingDeletes()]);
  return { pending: a.length, pendingDelete: b.length, total: a.length + b.length };
}

export async function clearAll() {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_PENDING, STORE_DELETE], 'readwrite');
    tx.objectStore(STORE_PENDING).clear();
    tx.objectStore(STORE_DELETE).clear();
    await new Promise((res, rej) => { tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); rej(tx.error); }; });
  } catch {}
  lsSetAll(STORE_PENDING, []);
  lsSetAll(STORE_DELETE, []);
  try { window.dispatchEvent(new CustomEvent('acueducto-queue-changed')); } catch {}
}
