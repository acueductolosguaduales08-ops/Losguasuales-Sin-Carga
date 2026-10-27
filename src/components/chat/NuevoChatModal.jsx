import { useState, useEffect } from 'react';
import { X, Loader2, Search, UserPlus, MessageCircle, Shield, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ChatAPI } from '../../api/chat';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

const ROL_BADGE = {
  ADMINISTRADOR: { label: 'Administrador', icon: Crown, cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  TESORERO: { label: 'Tesorero', icon: Shield, cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  ASOCIADO: { label: 'Asociado', icon: UserPlus, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

export default function NuevoChatModal({ open, onClose, onConversacionCreada }) {
  const { rol } = useAuth();
  const { success, error, info } = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [creando, setCreando] = useState(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  useLockBodyScroll(open, onClose);

  useEffect(() => {
    if (!open) return;
    setCargandoInicial(true);
    setResultados([]);
    setBusqueda('');

    ChatAPI.obtenerContactos()
      .then((contactos) => setResultados(contactos))
      .catch(() => error("Error al cargar", "No se pudieron cargar los contactos."))
      .finally(() => setCargandoInicial(false));
  }, [open, rol, error]);

  const resultadosFiltrados = resultados.filter((r) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      (r.nombre || '').toLowerCase().includes(q) ||
      (r.rol || '').toLowerCase().includes(q) ||
      (r.contacto || '').toLowerCase().includes(q)
    );
  });

  // Agrupar por rol para asociados
  const agrupados = rol === 'ASOCIADO'
    ? resultadosFiltrados.reduce((acc, c) => {
        const key = c.rol || 'OTRO';
        if (!acc[key]) acc[key] = [];
        acc[key].push(c);
        return acc;
      }, {})
    : null;

  const handleCrear = async (contacto) => {
    setCreando(contacto.id);
    try {
      const destinatarioId = contacto.usuarioId || contacto.id;
      const conv = await ChatAPI.crearConversacion(destinatarioId);
      success("Conversación creada", "Se abrió una nueva conversación con el contacto.");
      onConversacionCreada?.(conv);
    } catch (err) {
      error("Error al crear", err.message || 'No se pudo crear la conversación.');
    } finally {
      setCreando(null);
    }
  };

  const renderContacto = (contacto) => {
    const badge = ROL_BADGE[contacto.rol] || ROL_BADGE.ASOCIADO;
    const BadgeIcon = badge.icon;
    return (
      <button
        key={contacto.id}
        onClick={() => handleCrear(contacto)}
        disabled={creando === contacto.id}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-dark-bg/60 transition-colors disabled:opacity-50"
      >
        <div className="shrink-0 w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
          {contacto.iniciales || (contacto.nombre || '?').slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
            {contacto.nombre || 'Sin nombre'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.cls}`}>
              <BadgeIcon className="w-2.5 h-2.5" />
              {badge.label}
            </span>
            {contacto.contacto && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                {contacto.contacto}
              </span>
            )}
          </div>
        </div>
        {creando === contacto.id ? (
          <Loader2 className="w-4 h-4 text-brand animate-spin shrink-0" />
        ) : (
          <MessageCircle className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
        )}
      </button>
    );
  };

  if (!open) return null;

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="modal-shell__card relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[80dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-brand" /> Nuevo chat
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, rol o contacto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand transition-colors"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain custom-scroll">
          {cargandoInicial ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando contactos…</span>
            </div>
          ) : resultadosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {busqueda ? 'No se encontraron contactos.' : 'No hay contactos disponibles.'}
              </p>
            </div>
          ) : agrupados ? (
            // Vista agrupada por rol (para asociados)
            Object.entries(agrupados).map(([rolKey, contactos]) => {
              const badge = ROL_BADGE[rolKey] || { label: rolKey, cls: '' };
              return (
                <div key={rolKey}>
                  <div className="px-5 py-2 bg-gray-50 dark:bg-gray-950/50">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {badge.label} ({contactos.length})
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-dark-muted">
                    {contactos.map(renderContacto)}
                  </div>
                </div>
              );
            })
          ) : (
            // Lista plana (para admin/tesorero)
            <div className="divide-y divide-gray-100 dark:divide-dark-muted">
              {resultadosFiltrados.map(renderContacto)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
