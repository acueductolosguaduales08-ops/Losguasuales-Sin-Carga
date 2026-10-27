import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { CloudOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function OfflineBadge() {
  const { count, sync, syncing } = useOfflineQueue();
  const [lastResult, setLastResult] = useState(null);

  if (count.total === 0 && !lastResult) return null;

  const handleSync = async () => {
    const res = await sync();
    setLastResult(res);
    setTimeout(() => setLastResult(null), 3000);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white text-xs font-medium shadow-xl border border-white/10">
      {count.total > 0 ? (
        <>
          <CloudOff className="w-4 h-4 text-amber-400" />
          <span>{count.pending} pendiente{count.pending !== 1 ? 's' : ''}{count.pendingDelete > 0 ? ` + ${count.pendingDelete} por confirmar` : ''}</span>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="ml-2 flex items-center gap-1 px-3 py-1 rounded-full bg-white text-gray-900 text-xs font-bold disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </>
      ) : lastResult ? (
        <>
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Sincronizado {lastResult.synced} ok{lastResult.failed ? `, ${lastResult.failed} fallo(s)` : ''}</span>
        </>
      ) : null}
    </div>
  );
}
