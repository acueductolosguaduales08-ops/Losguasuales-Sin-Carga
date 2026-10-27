import { useEffect, useState } from 'react';
import { Trash2, X, ShieldAlert, Check, Loader2 } from 'lucide-react';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

export default function PendingDeletesModal() {
  const { pendingDeletes, confirmDelete, cancelDelete } = useOfflineQueue();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useLockBodyScroll(open);

  useEffect(() => {
    const handler = () => {
      // Solo abrir si hay pendientes y el servidor está despierto (evento awake)
      if (pendingDeletes.length > 0) setOpen(true);
    };
    window.addEventListener('acueducto-awake', handler);
    // También si ya había pendientes al montar y llega sync-needed
    return () => window.removeEventListener('acueducto-awake', handler);
  }, [pendingDeletes.length]);

  // Auto-abrir si hay pendingDeletes y el usuario navega (visibility) — no invasivo
  useEffect(() => {
    if (pendingDeletes.length === 0) setOpen(false);
  }, [pendingDeletes.length]);

  if (!open || pendingDeletes.length === 0) return null;

  const handleConfirm = async (id) => {
    setBusyId(id);
    try { await confirmDelete(id); } finally { setBusyId(null); }
  };
  const handleCancel = async (id) => {
    setBusyId(id);
    try { await cancelDelete(id); } finally { setBusyId(null); }
  };

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]">
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-start">
          <div className="flex gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-white">Confirmar eliminaciones pendientes</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                El servidor estaba dormido. Estas eliminaciones se guardaron localmente y requieren tu confirmación al despertar.
              </p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">{pendingDeletes.length} eliminación{pendingDeletes.length !== 1 ? 'es' : ''} pendiente{pendingDeletes.length !== 1 ? 's' : ''}</p>
          {pendingDeletes.map((op) => (
            <div key={op.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono text-gray-600 dark:text-gray-300 truncate">{op.method} {op.path}</p>
                <p className="text-[11px] text-gray-400">{new Date(op.createdAt).toLocaleString('es-CO')}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleCancel(op.id)}
                  disabled={busyId === op.id}
                  className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-dark-muted text-gray-700 dark:text-white text-xs font-semibold disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleConfirm(op.id)}
                  disabled={busyId === op.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {busyId === op.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Confirmar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950/40 flex justify-between items-center">
          <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-dark-muted text-gray-700 dark:text-white text-sm font-semibold">Cerrar</button>
          <p className="text-[11px] text-gray-400 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Se eliminará definitivamente al confirmar</p>
        </div>
      </div>
    </div>
  );
}
