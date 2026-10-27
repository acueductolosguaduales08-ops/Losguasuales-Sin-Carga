import { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Send, Loader2, MoreVertical, Pencil, Trash2, Check, CheckCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ChatAPI } from '../../api/chat';
import { mostrarNotificacionSistema } from '../../utils/notificacionesSistema';
import {
  obtenerMensajesLocal,
  guardarMensajes,
  eliminarMensajeLocal,
  actualizarMensajeLocal,
} from '../../utils/chatDB';
import SolicitudesEliminacionModal from './SolicitudesEliminacionModal';

function formatHora(fechaIso) {
  if (!fechaIso) return '';
  return new Date(fechaIso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

export default function ConversacionChat({ conversacion, onVolver }) {
  const { usuario } = useAuth();
  const { success, error, warning, info, chatMessage, dismissById } = useToast();
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editandoTexto, setEditandoTexto] = useState('');
  const [menuMsgId, setMenuMsgId] = useState(null);
  const [solicitudesOpen, setSolicitudesOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const mensajesIdsRef = useRef(new Set());

  const usuarioId = usuario?.id;
  const convId = conversacion?.id;
  const nombreContacto = conversacion?.participante?.nombre || 'Alguien';

  // Ajustar altura cuando el teclado virtual se abre/cierra en móvil
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      setViewportHeight(`${vv.height}px`);
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('change', onResize);
    onResize();
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('change', onResize);
    };
  }, []);

  // Cerrar menú contextual al tocar fuera
  useEffect(() => {
    if (menuMsgId === null) return;
    const close = () => setMenuMsgId(null);
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [menuMsgId]);

  const scrollAlFondo = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const cargarMensajes = useCallback(async () => {
    if (!convId) return;
    try {
      const data = await ChatAPI.obtenerMensajes(convId);
      const lista = Array.isArray(data) ? data : [];
      setMensajes(lista);
      mensajesIdsRef.current = new Set(lista.map((m) => m.id));
      guardarMensajes(lista.map((m) => ({ ...m, conversacionId: convId, contenido: m.contenido || m.texto }))).catch(() => {});
    } catch {
      try {
        const local = await obtenerMensajesLocal(convId);
        setMensajes(local);
      } catch {
        error("Error al cargar", "No se pudieron cargar los mensajes.");
      }
    }
  }, [convId, error]);

  useEffect(() => {
    if (!convId) return;
    setLoading(true);
    cargarMensajes().finally(() => setLoading(false));
    ChatAPI.marcarLeidos(convId).catch(() => {});
  }, [convId, cargarMensajes]);

  // Auto-refresh cada 5s sin perder el foco del input
  useEffect(() => {
    if (!convId) return;
    const interval = setInterval(() => {
      ChatAPI.obtenerMensajes(convId)
        .then((data) => {
          const lista = Array.isArray(data) ? data : [];
          setMensajes((prev) => {
            const prevIds = new Set(prev.map((m) => m.id));
            const nuevos = lista.filter((m) => !prevIds.has(m.id));
            if (nuevos.length === 0) return prev;
            for (const msg of nuevos) {
              if (msg.remitente?.id !== usuarioId) {
                const remitente = msg.remitente?.nombre || nombreContacto;
                chatMessage(remitente, msg.contenido, `chat-msg-${convId}`);
                mostrarNotificacionSistema({
                  id: `chat-${msg.id}`,
                  titulo: `${remitente}`,
                  cuerpo: msg.contenido?.slice(0, 120) || 'Nuevo mensaje',
                  url: '/chat',
                }).catch(() => {});
              }
            }
            return [...prev, ...nuevos];
          });
          guardarMensajes(lista.map((m) => ({ ...m, conversacionId: convId, contenido: m.contenido || m.texto }))).catch(() => {});
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [convId, usuarioId, nombreContacto, error]);

  // Scroll al fondo cuando llegan mensajes nuevos
  useEffect(() => {
    scrollAlFondo();
  }, [mensajes, scrollAlFondo]);

  // Marcar leídos al salir
  useEffect(() => {
    return () => {
      if (convId) ChatAPI.marcarLeidos(convId).catch(() => {});
    };
  }, [convId]);

  const handleEnviar = async () => {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    try {
      const msg = await ChatAPI.enviarMensaje(convId, t);
      if (msg) {
        setMensajes((prev) => [...prev, msg]);
        guardarMensajes([{ ...msg, conversacionId: convId }]).catch(() => {});
      }
      setTexto('');
      // En móvil, no quitar foco del input para mantener el teclado abierto
      if (window.innerWidth >= 768) {
        inputRef.current?.focus();
      }
    } catch (err) {
      info("Error al enviar", err.message || 'No se pudo enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
  };

  const handleEditar = async (msg) => {
    const nuevoTexto = editandoTexto.trim();
    if (!nuevoTexto || nuevoTexto === msg.contenido) {
      setEditandoId(null);
      return;
    }
    try {
      await ChatAPI.editarMensaje(msg.id, nuevoTexto);
      setMensajes((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, contenido: nuevoTexto, editado: true } : m))
      );
      actualizarMensajeLocal({ ...msg, contenido: nuevoTexto, editado: true, conversacionId: convId }).catch(() => {});
      setEditandoId(null);
      success("Mensaje editado", "Los cambios se guardaron correctamente.");
    } catch (err) {
      error("Error al editar", err.message || 'No se pudo editar el mensaje.');
    }
  };

  const handleSolicitarEliminacion = async (msg) => {
    setMenuMsgId(null);
    try {
      await ChatAPI.solicitarEliminacion(msg.id);
      success("Solicitud enviada", "Se notificará al administrador para revisar la eliminación.");
    } catch (err) {
      error("Error al solicitar", err.message || 'No se pudo enviar la solicitud.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editandoId) {
        const msg = mensajes.find((m) => m.id === editandoId);
        if (msg) handleEditar(msg);
      } else {
        handleEnviar();
      }
    }
    if (e.key === 'Escape' && editandoId) {
      setEditandoId(null);
    }
  };

  return (
    <div
      className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 font-sans antialiased flex flex-col transition-colors"
      style={{ height: viewportHeight, maxHeight: viewportHeight }}
    >
      {/* Header del chat */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-dark-muted px-4 py-3 flex items-center gap-3 shrink-0 z-10">
        <button
          onClick={onVolver}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="shrink-0 w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
          {conversacion?.participante?.iniciales || (conversacion?.participante?.nombre || '?').slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
            {conversacion?.participante?.nombre || 'Desconocido'}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {conversacion?.participante?.rol || ''}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSolicitudesOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors relative"
            aria-label="Solicitudes de eliminación"
            title="Solicitudes de eliminación"
          >
            <AlertTriangle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Lista de mensajes */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando mensajes…</span>
          </div>
        ) : mensajes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400 dark:text-gray-500">No hay mensajes aún.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Envía el primer mensaje para comenzar.</p>
          </div>
        ) : (
          mensajes.map((msg) => {
            const esMio = msg.remitente?.id === usuarioId;
            const editado = msg.editado;
            const estaEditando = editandoId === msg.id;
            const leido = msg.leido;
            const esEditable = esMio;

            return (
              <div
                key={msg.id}
                className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    esMio
                      ? 'bg-brand text-white rounded-br-md'
                      : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-bl-md'
                  }`}
                >
                  {estaEditando ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editandoTexto}
                        onChange={(e) => setEditandoTexto(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-b border-white/50 text-sm text-white placeholder-white/60 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditar(msg)}
                        className="p-1 rounded hover:bg-white/20"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditandoId(null)}
                        className="p-1 rounded hover:bg-white/20"
                      >
                        <span className="text-xs">✕</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm break-words whitespace-pre-wrap">
                        {msg.contenido}
                      </p>
                      <div className={`flex items-center gap-1.5 mt-1 ${esMio ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[10px] ${esMio ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
                          {formatHora(msg.fechaCreacion)}
                        </span>
                        {editado && (
                          <span className={`text-[10px] italic ${esMio ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'}`}>
                            editado
                          </span>
                        )}
                        {esMio && (
                          leido ? (
                            <CheckCheck className="w-3.5 h-3.5 text-white/70" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-white/70" />
                          )
                        )}
                      </div>
                    </>
                  )}

                  {/* Menú contextual */}
                  {esEditable && !estaEditando && (
                    <div className="absolute top-1 right-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuMsgId(menuMsgId === msg.id ? null : msg.id); }}
                        className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      {menuMsgId === msg.id && (
                        <div className="absolute right-0 top-7 z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl shadow-xl overflow-hidden min-w-[160px] animate-[modalPop_0.12s_ease]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditandoId(msg.id);
                              setEditandoTexto(msg.contenido);
                              setMenuMsgId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg/60"
                          >
                            <Pencil className="w-4 h-4" /> Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSolicitarEliminacion(msg);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" /> Solicitar eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input de envío */}
      <div
        className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-dark-muted px-4 py-3 shrink-0 z-10"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        {editandoId && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-300">
            <Pencil className="w-3.5 h-3.5 shrink-0" />
            Editando mensaje
            <button
              onClick={() => setEditandoId(null)}
              className="ml-auto text-amber-600 dark:text-amber-400 hover:underline"
            >
              Cancelar
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="flex-1 bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors resize-none max-h-24"
            style={{ minHeight: '40px', fontSize: '16px' }}
          />
          <button
            onClick={editandoId ? () => handleEditar(mensajes.find((m) => m.id === editandoId)) : handleEnviar}
            disabled={(!texto.trim() && !editandoId) || enviando}
            className="p-2.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white transition-colors shrink-0"
          >
            {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <SolicitudesEliminacionModal
        open={solicitudesOpen}
        onClose={() => setSolicitudesOpen(false)}
      />
    </div>
  );
}
