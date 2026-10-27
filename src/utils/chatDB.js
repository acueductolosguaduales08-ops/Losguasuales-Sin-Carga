// Persistencia local del chat en IndexedDB. El backend solo retiene 8 días;
// el historial completo vive aquí.

const DB_NAME = 'acueducto_chat';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('mensajes')) {
        const store = db.createObjectStore('mensajes', { keyPath: 'id' });
        store.createIndex('conversacionId', 'conversacionId', { unique: false });
        store.createIndex('conversacionId_fecha', ['conversacionId', 'fechaEnvio'], { unique: false });
      }
      if (!db.objectStoreNames.contains('conversaciones')) {
        db.createObjectStore('conversaciones', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---- Mensajes ----

export async function guardarMensajes(mensajes) {
  const db = await openDB();
  const tx = db.transaction('mensajes', 'readwrite');
  const store = tx.objectStore('mensajes');
  for (const msg of mensajes) {
    store.put(msg);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function obtenerMensajesLocal(conversacionId) {
  const db = await openDB();
  const tx = db.transaction('mensajes', 'readonly');
  const index = tx.objectStore('mensajes').index('conversacionId');
  const req = index.getAll(conversacionId);
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const mensajes = req.result.sort((a, b) => {
        const fa = a.fechaEnvio || '';
        const fb = b.fechaEnvio || '';
        return fa < fb ? -1 : fa > fb ? 1 : 0;
      });
      db.close();
      resolve(mensajes);
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function obtenerUltimoMensajeLocal(conversacionId) {
  const mensajes = await obtenerMensajesLocal(conversacionId);
  return mensajes.length > 0 ? mensajes[mensajes.length - 1] : null;
}

export async function eliminarMensajeLocal(mensajeId) {
  const db = await openDB();
  const tx = db.transaction('mensajes', 'readwrite');
  tx.objectStore('mensajes').delete(mensajeId);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function actualizarMensajeLocal(mensaje) {
  const db = await openDB();
  const tx = db.transaction('mensajes', 'readwrite');
  tx.objectStore('mensajes').put(mensaje);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// ---- Conversaciones (caché rápido) ----

export async function guardarConversaciones(conversaciones) {
  const db = await openDB();
  const tx = db.transaction('conversaciones', 'readwrite');
  const store = tx.objectStore('conversaciones');
  for (const conv of conversaciones) {
    store.put(conv);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function obtenerConversacionesLocal() {
  const db = await openDB();
  const tx = db.transaction('conversaciones', 'readonly');
  const req = tx.objectStore('conversaciones').getAll();
  return new Promise((resolve, reject) => {
    req.onsuccess = () => { db.close(); resolve(req.result || []); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

// Eliminar todos los mensajes de una conversación de IndexedDB.
export async function eliminarMensajesConversacionLocal(conversacionId) {
  const db = await openDB();
  const tx = db.transaction('mensajes', 'readwrite');
  const store = tx.objectStore('mensajes');
  const index = store.index('conversacionId');
  const req = index.openCursor(conversacionId);
  const aBorrar = [];
  req.onsuccess = () => {
    const cursor = req.result;
    if (cursor) {
      aBorrar.push(cursor.primaryKey);
      cursor.continue();
    } else {
      for (const key of aBorrar) store.delete(key);
    }
  };
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(aBorrar.length); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// Eliminar una conversación de IndexedDB (caché).
export async function eliminarConversacionLocal(conversacionId) {
  const db = await openDB();
  const tx = db.transaction('conversaciones', 'readwrite');
  tx.objectStore('conversaciones').delete(conversacionId);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// Limpiar mensajes antiguos (> 8 días) de IndexedDB.
export async function limpiarMensajesAntiguos() {
  const db = await openDB();
  const cutoff = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
  const tx = db.transaction('mensajes', 'readwrite');
  const store = tx.objectStore('mensajes');
  const req = store.getAll();
  const aBorrar = [];
  req.onsuccess = () => {
    const mensajes = req.result || [];
    for (const msg of mensajes) {
      if (msg.fechaEnvio && msg.fechaEnvio < cutoff) {
        aBorrar.push(msg.id);
      }
    }
    for (const key of aBorrar) store.delete(key);
  };
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(aBorrar.length); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
