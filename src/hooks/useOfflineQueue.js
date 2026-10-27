import { useEffect, useState, useCallback } from 'react';
import { getAllPending, getAllPendingDeletes, getQueueCount, removePending, removePendingDelete, confirmDelete } from '../utils/offlineQueue';
import { syncPendingQueue, attachAutoSync } from '../utils/syncManager';

export function useOfflineQueue() {
  const [pending, setPending] = useState([]);
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const [count, setCount] = useState({ pending: 0, pendingDelete: 0, total: 0 });
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const [p, d, c] = await Promise.all([getAllPending(), getAllPendingDeletes(), getQueueCount()]);
    setPending(p);
    setPendingDeletes(d);
    setCount(c);
  }, []);

  useEffect(() => {
    attachAutoSync();
    refresh();
    const handler = () => refresh();
    window.addEventListener('acueducto-queue-changed', handler);
    window.addEventListener('acueducto-sync-done', handler);
    window.addEventListener('acueducto-offline-queued', handler);
    return () => {
      window.removeEventListener('acueducto-queue-changed', handler);
      window.removeEventListener('acueducto-sync-done', handler);
      window.removeEventListener('acueducto-offline-queued', handler);
    };
  }, [refresh]);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await syncPendingQueue();
      await refresh();
      return res;
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  const cancelPending = useCallback(async (id) => {
    await removePending(id);
    await refresh();
  }, [refresh]);

  const cancelDelete = useCallback(async (id) => {
    await removePendingDelete(id);
    await refresh();
  }, [refresh]);

  const confirm = useCallback(async (id) => {
    await confirmDelete(id);
    await refresh();
    // auto-sync tras confirmar
    setSyncing(true);
    try { await syncPendingQueue(); } finally { setSyncing(false); await refresh(); }
  }, [refresh]);

  return { pending, pendingDeletes, count, syncing, refresh, sync, cancelPending, cancelDelete, confirmDelete: confirm };
}
