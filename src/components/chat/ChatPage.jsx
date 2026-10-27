import { useEffect, useState, useCallback, useRef } from 'react';
import { MessageCircle, Plus, Search, Loader2, Trash2, Smartphone, Info } from 'lucide-react';
import { sileo } from 'sileo';
import Header from '../layout/Header';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ChatAPI } from '../../api/chat';
import { mostrarNotificacionSistema } from '../../utils/notificacionesSistema';
import { obtenerConversacionesLocal, guardarConversaciones, eliminarConversacionLocal, eliminarMensajesConversacionLocal } from '../../utils/chatDB';
import NuevoChatModal from './NuevoChatModal';
import ConversacionChat from './ConversacionChat';
import ChatCondiciones, { chatCondicionesAceptadas } from './ChatCondiciones';

function formatFecha(fechaIso) {
  if (!fechaIso) return '';
  const d = new Date(fechaIso);
  const ahora = new Date();
  const diffMs = ahora - d;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDias === 0) {
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDias === 1) return 'Ayer';
  if (diffDias < 7) {
    return d.toLocaleDateString('es-CO', { weekday: 'short' });
  }
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function truncar(texto, max = 60) {
  if (!texto) return '';
  return texto.length > max ? texto.slice(0, max) + '…' : texto;
}

export default function ChatPage() {
  const { usuario, rol, isAuthenticated } = useAuth();
  const { success, error, info } = useToast();
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoChatOpen, setNuevoChatOpen] = useState(false);
  const [convActiva, setConvActiva] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [eliminandoId, setEliminandoId] = useState(null);
  const [condicionesPendientes, setCondicionesPendientes] = useState(!chatCondicionesAceptadas());
  const prevNoLeidosRef = useRef({});
  const toastIdsRef = useRef({});

  const cargarConversaciones = useCallback(async () => {
    try {
      const data = await ChatAPI.listarConversaciones();
      const lista = Array.isArray(data) ? data : [];
      setConversaciones(lista);
      guardarConversaciones(lista).catch(() => {});
    } catch {
      // Si falla la red, intentar caché local
      try {
        const local = await obtenerConversacionesLocal();
        setConversaciones(local);
      } catch {
        error("Error al cargar", "No se pudieron cargar las conversaciones.");
      }
    }
  }, [error]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    cargarConversaciones().finally(() => setLoading(false));
  }, [isAuthenticated, cargarConversaciones]);

  // Refrescar cada 15s si hay conversaciones (sin superposicion de requests)
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    let timerId;
    const poll = async () => {
      await cargarConversaciones();
      if (active) timerId = setTimeout(poll, 15000);
    };
    timerId = setTimeout(poll, 15000);
    return () => { active = false; clearTimeout(timerId); };
  }, [isAuthenticated, cargarConversaciones]);

  // Detectar mensajes nuevos y mostrar toast persistente
  useEffect(() => {
    if (convActiva) return;
    for (const conv of conversaciones) {
      const noLeidos = conv.noLeidos || 0;
      const prev = prevNoLeidosRef.current[conv.id] || 0;
      if (noLeidos > prev && noLeidos > 0) {
        const nombre = conv.participante?.nombre || 'Alguien';
        const toastId = `chat-conv-${conv.id}`;
        if (toastIdsRef.current[toastId]) {
          sileo.dismiss(toastIdsRef.current[toastId]);
        }
        const id = sileo.info({
          id: toastId,
          title: `Nuevo mensaje de ${nombre}`,
          description: conv.ultimoMensaje ? (conv.ultimoMensaje.length > 80 ? conv.ultimoMensaje.slice(0, 80) + '...' : conv.ultimoMensaje) : 'Nuevo mensaje',
          duration: null,
        });
        toastIdsRef.current[toastId] = id;
        mostrarNotificacionSistema({
          id: `chat-conv-${conv.id}`,
          titulo: `Nuevo mensaje de ${nombre}`,
          cuerpo: conv.ultimoMensaje?.slice(0, 120) || 'Nuevo mensaje',
          url: '/chat',
        }).catch(() => {});
      }
      prevNoLeidosRef.current[conv.id] = noLeidos;
    }
  }, [conversaciones, convActiva]);

  const handleEliminar = async (conv) => {
    setEliminandoId(conv.id);
    try {
      if (rol === 'ASOCIADO') {
        // Asociados solo pueden borrar del IndexedDB local
        await eliminarMensajesConversacionLocal(conv.id);
        await eliminarConversacionLocal(conv.id);
        setConversaciones((prev) => prev.filter((c) => c.id !== conv.id));
        if (convActiva?.id === conv.id) setConvActiva(null);
        success("Conversación eliminada", "Se eliminó del dispositivo localmente.");
      } else {
        await ChatAPI.eliminarConversacion(conv.id);
        await eliminarMensajesConversacionLocal(conv.id);
        await eliminarConversacionLocal(conv.id);
        setConversaciones((prev) => prev.filter((c) => c.id !== conv.id));
        if (convActiva?.id === conv.id) setConvActiva(null);
        success("Conversación eliminada", "La conversación fue eliminada del servidor.");
      }
    } catch (err) {
      error("Error al eliminar", err.message || 'No se pudo eliminar la conversación.');
    } finally {
      setEliminandoId(null);
    }
  };

  const conversacionesFiltradas = conversaciones.filter((c) => {
    if (!filtro.trim()) return true;
    const nombre = (c.participante?.nombre || '').toLowerCase();
    const rolText = (c.participante?.rol || '').toLowerCase();
    return nombre.includes(filtro.toLowerCase()) || rolText.includes(filtro.toLowerCase());
  });

  // Si no ha aceptado condiciones, mostrar modal
  if (condicionesPendientes) {
    return (
      <>
        <div className="bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
          <Header />
          <main className="w-full max-w-2xl mx-auto pt-20 md:pt-24 pb-10 px-4 md:px-6">
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
              <Info className="w-5 h-5" />
              <span className="text-sm">Acepta las condiciones para usar el chat.</span>
            </div>
          </main>
        </div>
        <ChatCondiciones
          onAceptar={() => setCondicionesPendientes(false)}
          onCancelar={() => window.history.back()}
        />
      </>
    );
  }

  // Si hay una conversación activa, mostrar la vista de mensajes
  if (convActiva) {
    return (
      <ConversacionChat
        conversacion={convActiva}
        onVolver={() => {
          setConvActiva(null);
          cargarConversaciones();
        }}
      />
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-2xl mx-auto pt-20 md:pt-24 pb-10 px-4 md:px-6">
        <section className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-brand shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Chat</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Mensajes internos</p>
            </div>
          </div>
          <button
            onClick={() => setNuevoChatOpen(true)}
            className="p-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white transition-colors shadow-lg shadow-brand/20"
            aria-label="Nuevo chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </section>

        {/* Barra de búsqueda */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o rol..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando conversaciones…</span>
          </div>
        ) : conversacionesFiltradas.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filtro ? 'No se encontraron conversaciones.' : 'Aún no tienes conversaciones.'}
            </p>
            {!filtro && (
              <button
                onClick={() => setNuevoChatOpen(true)}
                className="mt-3 text-sm font-semibold text-brand hover:underline"
              >
                Iniciar una conversación
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted md:rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-dark-muted">
            {conversacionesFiltradas.map((conv) => {
              const noLeidos = conv.noLeidos || 0;
              const solicitudEnviada = conv.solicitudPendienteEnviada;
              const solicitudRecibida = conv.solicitudPendienteRecibida;
              const nombre = conv.participante?.nombre || 'Desconocido';

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    const toastId = `chat-conv-${conv.id}`;
                    if (toastIdsRef.current[toastId]) {
                      sileo.dismiss(toastIdsRef.current[toastId]);
                      delete toastIdsRef.current[toastId];
                    }
                    setConvActiva(conv);
                  }}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-dark-bg/60 transition-colors"
                >
                  {/* Avatar */}
                  <div className="shrink-0 w-11 h-11 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-sm">
                    {conv.participante?.iniciales || nombre.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Contenido */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                        {nombre}
                      </p>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
                        {formatFecha(conv.fechaUltimoMensaje)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {solicitudEnviada ? (
                          <span className="text-amber-600 dark:text-amber-400">Solicitud de eliminación enviada</span>
                        ) : solicitudRecibida ? (
                          <span className="text-amber-600 dark:text-amber-400">Solicitud de eliminación pendiente</span>
                        ) : (
                          truncar(conv.ultimoMensaje)
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {noLeidos > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[10px] font-bold">
                            {noLeidos > 99 ? '99+' : noLeidos}
                          </span>
                        )}
                        {rol !== 'ASOCIADO' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminar(conv);
                            }}
                            disabled={eliminandoId === conv.id}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            aria-label="Eliminar conversación"
                          >
                            {eliminandoId === conv.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminar(conv);
                            }}
                            disabled={eliminandoId === conv.id}
                            className="p-1 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                            aria-label="Eliminar localmente"
                            title="Eliminar solo de este dispositivo"
                          >
                            {eliminandoId === conv.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Smartphone className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <NuevoChatModal
        open={nuevoChatOpen}
        onClose={() => setNuevoChatOpen(false)}
        onConversacionCreada={(conv) => {
          setConvActiva(conv);
          setNuevoChatOpen(false);
          cargarConversaciones();
        }}
      />
    </div>
  );
}
