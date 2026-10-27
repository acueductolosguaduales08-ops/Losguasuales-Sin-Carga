import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { X, Loader2, MessageCircle, Mail, MessageSquareText, Copy, Check, AlertTriangle, Pencil, Link2 } from 'lucide-react';
import { AsociadosAPI } from '../../api/asociados';
import { FacturasAPI } from '../../api/facturas';
import { RecibosAPI } from '../../api/recibos';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  normalizarTelefono,
  esCorreoValido,
  construirEnlaceWhatsApp,
  construirEnlaceMailto,
  construirEnlaceSms,
  copiarAlPortapapeles,
  abrirEnlace,
} from '../../utils/notificarDocumento/canales';
import { generarMensaje, generarAsunto, SALUDOS_HORARIO, saludoPorHoraActual, obtenerSaludoHorario } from '../../utils/notificarDocumento/plantillas';
import { obtenerPrefs, obtenerConfigInstitucional } from '../../utils/notificarDocumento/prefs';
import { registrarHistorial, ESTADOS_HISTORIAL } from '../../utils/notificarDocumento/historial';

const CANALES = [
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle, estado: ESTADOS_HISTORIAL.WHATSAPP },
  { value: 'GMAIL', label: 'Gmail', icon: Mail, estado: ESTADOS_HISTORIAL.GMAIL },
  { value: 'SMS', label: 'SMS', icon: MessageSquareText, estado: ESTADOS_HISTORIAL.SMS },
  { value: 'COPIAR', label: 'Copiar', icon: Copy, estado: ESTADOS_HISTORIAL.COPIADA },
];

function numeroDocumento(documento) {
  return documento?.numeroFactura || documento?.numeroRecibo || '';
}

function nombreUsuarioActual(usuario) {
  if (!usuario) return 'Usuario';
  if (usuario.nombres) return `${usuario.nombres} ${usuario.apellidos || ''}`.trim();
  return usuario.username || usuario.email || 'Usuario';
}

/**
 * Modal reutilizable del módulo de Notificaciones Inteligentes.
 *
 * Props:
 * - open, onClose
 * - tipo: 'FACTURA' (por ahora; ver plantillas.js para agregar más tipos)
 * - documento: objeto del documento (ej. la factura)
 * - documentoId, documentoNumero: para el registro en historial
 * - asociadoId, asociadoNombre: datos del asociado dueño del documento
 * - telefonoRegistrado, correoRegistrado: opcional, si ya se tienen a mano
 *   (evita una llamada extra a AsociadosAPI)
 */
export default function NotificarModal({
  open,
  onClose,
  tipo = 'FACTURA',
  documento,
  documentoId,
  documentoNumero,
  asociadoId,
  asociadoNombre,
  telefonoRegistrado,
  correoRegistrado,
}) {
  useLockBodyScroll(Boolean(open), onClose);

  const { usuario } = useAuth();
  const { success, error, warning, info } = useToast();

  const [cargandoAsociado, setCargandoAsociado] = useState(false);
  const [telefono, setTelefono] = useState(telefonoRegistrado || '');
  const [correo, setCorreo] = useState(correoRegistrado || '');

  const [canal, setCanal] = useState('WHATSAPP');
  const [origenDestinatario, setOrigenDestinatario] = useState('registrado'); // 'registrado' | 'manual'
  const [destinatarioManual, setDestinatarioManual] = useState('');

  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [horarioId, setHorarioId] = useState(saludoPorHoraActual());

  const [incluirEnlace, setIncluirEnlace] = useState(false);
  const [enlacePublico, setEnlacePublico] = useState(null);
  const [generandoEnlace, setGenerandoEnlace] = useState(false);
  const mensajeBaseRef = useRef('');

  // Cargar teléfono/correo del asociado si no vinieron ya como props.
  useEffect(() => {
    if (!open) return;
    setTelefono(telefonoRegistrado || '');
    setCorreo(correoRegistrado || '');

    if (telefonoRegistrado || correoRegistrado) return;

    if (asociadoId) {
      setCargandoAsociado(true);
      AsociadosAPI.obtener(asociadoId)
        .then((a) => {
          setTelefono(a?.telefonoPrincipal || a?.telefono || '');
          setCorreo(a?.correo || a?.email || '');
        })
        .catch(() => {
          // Si falla, el usuario puede escribir el destinatario manualmente.
        })
        .finally(() => setCargandoAsociado(false));
      return;
    }

    // Respaldo: si el documento no trae el id del asociado, intentamos ubicarlo
    // por nombre exacto. Solo se usa si hay una única coincidencia inequívoca;
    // de lo contrario se deja en manual para no arriesgar enviar al destinatario
    // equivocado.
    const nombreBusqueda = (asociadoNombre || documento?.asociadoNombre || '').trim();
    if (!nombreBusqueda) return;

    setCargandoAsociado(true);
    AsociadosAPI.buscar(nombreBusqueda)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        const coincidencias = lista.filter(
          (a) => `${a.nombres} ${a.apellidos}`.trim().toLowerCase() === nombreBusqueda.toLowerCase()
        );
        if (coincidencias.length === 1) {
          setTelefono(coincidencias[0]?.telefonoPrincipal || coincidencias[0]?.telefono || '');
          setCorreo(coincidencias[0]?.correo || coincidencias[0]?.email || '');
        }
      })
      .catch(() => {
        // Si falla, el usuario puede escribir el destinatario manualmente.
      })
      .finally(() => setCargandoAsociado(false));
  }, [open, asociadoId, asociadoNombre, documento, telefonoRegistrado, correoRegistrado]);

  // Generar el mensaje con la plantilla correspondiente al abrir el modal.
  useEffect(() => {
    if (!open || !documento) return;
    let cancelado = false;
    setGenerando(true);
    setEditando(false);

    obtenerConfigInstitucional()
      .then((institucional) => {
        if (cancelado) return;
        const horario = obtenerSaludoHorario(horarioId);
        const prefs = { ...obtenerPrefs(), saludo: horario.saludo, despedida: horario.despedida };
        const texto = generarMensaje({ tipo, documento, asociadoNombre, institucional, prefs });
        mensajeBaseRef.current = texto;
        setMensaje(texto);
      })
      .catch(() => {
        if (!cancelado) error("Error al generar", "No se pudo generar el mensaje de notificación.");
      })
      .finally(() => {
        if (!cancelado) setGenerando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open, documento, tipo, asociadoNombre, horarioId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generar enlace público cuando se activa el toggle.
  useEffect(() => {
    if (!incluirEnlace || !open || !documento) {
      // Quitar enlace del mensaje si se desactivó
      if (!incluirEnlace && mensajeBaseRef.current) {
        setMensaje(mensajeBaseRef.current);
        setEnlacePublico(null);
      }
      return;
    }

    let cancelado = false;
    setGenerandoEnlace(true);

    const promesa = tipo === 'FACTURA'
      ? FacturasAPI.generarEnlacePublico(documento.id)
      : RecibosAPI.generarEnlacePublico(documento.numeroRecibo);

    promesa
      .then((resp) => {
        if (cancelado) return;
        setEnlacePublico(resp);
      })
      .catch(() => {
          if (!cancelado) {
          error("Error al generar enlace", "No se pudo generar el enlace de descarga.");
          setIncluirEnlace(false);
        }
      })
      .finally(() => {
        if (!cancelado) setGenerandoEnlace(false);
      });

    return () => { cancelado = true; };
  }, [incluirEnlace, open, documento, tipo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reconstruir el mensaje cuando cambia el enlace público
  useEffect(() => {
    const base = mensajeBaseRef.current;
    if (!base) return;

    if (!enlacePublico || !incluirEnlace) {
      setMensaje(base);
      return;
    }

    const fechaExp = new Date(enlacePublico.expiresAt);
    const dia = String(fechaExp.getDate()).padStart(2, '0');
    const mes = String(fechaExp.getMonth() + 1).padStart(2, '0');
    const anio = fechaExp.getFullYear();

    const tipoLabel = tipo === 'FACTURA' ? 'la factura' : 'el recibo';
    const bloqueEnlace = [
      '',
      `Puedes descargar ${tipoLabel} en este enlace (no requiere que tengas la app ni iniciar sesión):`,
      '',
      enlacePublico.publicDownloadUrl,
      '',
      `Tienes un plazo de 72 horas para descargar. Si el tiempo expira, puedes solicitar otro enlace.`,
      `Fecha de vencimiento: ${dia}/${mes}/${anio}`,
    ].join('\n');

    // Insertar antes de la despedida (últimas 2 líneas: despedida + firma)
    const lineas = base.split('\n');
    const despedida = lineas[lineas.length - 3]; // línea de despedida
    const firma = lineas[lineas.length - 2]; // línea de firma
    const antes = lineas.slice(0, lineas.length - 2);
    setMensaje([...antes, bloqueEnlace, '', despedida, firma].join('\n'));
  }, [enlacePublico, incluirEnlace, tipo]);

  useEffect(() => {
    if (!open) return;
    setCanal('WHATSAPP');
    setOrigenDestinatario('registrado');
    setDestinatarioManual('');
    setCopiado(false);
    setHorarioId(saludoPorHoraActual());
    setIncluirEnlace(false);
    setEnlacePublico(null);
    setGenerandoEnlace(false);
  }, [open]);

  const requiereCorreo = canal === 'GMAIL';

  const valorRegistrado = requiereCorreo ? correo : telefono;
  const hayRegistrado = requiereCorreo ? esCorreoValido(correo) : !!normalizarTelefono(telefono);

  const destinatarioFinal = origenDestinatario === 'registrado' ? valorRegistrado : destinatarioManual;

  const destinatarioValido = useMemo(() => {
    if (canal === 'COPIAR') return true;
    if (requiereCorreo) return esCorreoValido(destinatarioFinal);
    return !!normalizarTelefono(destinatarioFinal);
  }, [canal, requiereCorreo, destinatarioFinal]);

  if (!open) return null;

  const registrar = (estado) => {
    registrarHistorial({
      tipoDocumento: tipo,
      documentoId: documentoId ?? documento?.id,
      documentoNumero: documentoNumero ?? numeroDocumento(documento),
      asociadoNombre: asociadoNombre || documento?.asociadoNombre,
      canal,
      destinatario: canal === 'COPIAR' ? '—' : destinatarioFinal,
      usuario: nombreUsuarioActual(usuario),
      estado,
    });
  };

  const handleCopiar = async () => {
    const ok = await copiarAlPortapapeles(mensaje);
    if (ok) {
      setCopiado(true);
      registrar(ESTADOS_HISTORIAL.COPIADA);
      success("Mensaje copiado", "El mensaje se copió al portapapeles.");
      setTimeout(() => setCopiado(false), 2000);
    } else {
      error("Error al copiar", "No se pudo copiar el mensaje al portapapeles.");
    }
  };

  const handleAbrirCanal = () => {
    if (!destinatarioValido) {
      warning("Destinatario inválido", "Verifica el número de teléfono o correo electrónico.");
      return;
    }

    let url = null;
    let estado = null;
    if (canal === 'WHATSAPP') {
      url = construirEnlaceWhatsApp(destinatarioFinal, mensaje);
      estado = ESTADOS_HISTORIAL.WHATSAPP;
    } else if (canal === 'SMS') {
      url = construirEnlaceSms(destinatarioFinal, mensaje);
      estado = ESTADOS_HISTORIAL.SMS;
    } else if (canal === 'GMAIL') {
      url = construirEnlaceMailto(destinatarioFinal, generarAsunto({ tipo, documento }), mensaje);
      estado = ESTADOS_HISTORIAL.GMAIL;
    }

    if (!url) {
      error("Error al abrir", "No se pudo generar el enlace para este canal.");
      return;
    }

    abrirEnlace(url);
    registrar(estado);
    onClose();
  };

  const canalActivo = CANALES.find((c) => c.value === canal);

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Notificar</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {documentoNumero || numeroDocumento(documento) || generarAsunto({ tipo, documento: documento || {} })} ·{' '}
              {asociadoNombre || documento?.asociadoNombre}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-shell__body flex-1 p-5 overflow-y-auto overscroll-contain custom-scroll space-y-5">
          {/* Selección de canal */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Medio de comunicación</p>
            <div className="grid grid-cols-4 gap-2">
              {CANALES.map((c) => {
                const Icon = c.icon;
                const activo = canal === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => {
                      setCanal(c.value);
                      setOrigenDestinatario('registrado');
                    }}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                      activo
                        ? 'bg-brand border-brand text-white'
                        : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:border-brand hover:text-brand'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selección de destinatario */}
          {canal !== 'COPIAR' && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                {requiereCorreo ? 'Correo del destinatario' : 'Número del destinatario'}
              </p>

              {cargandoAsociado ? (
                <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Consultando datos del asociado…
                </div>
              ) : (
                <div className="space-y-2">
                  {hayRegistrado ? (
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={origenDestinatario === 'registrado'}
                        onChange={() => setOrigenDestinatario('registrado')}
                        className="accent-brand"
                      />
                      Usar el {requiereCorreo ? 'correo' : 'teléfono'} registrado: <span className="font-mono">{valorRegistrado}</span>
                    </label>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      El asociado no tiene {requiereCorreo ? 'correo' : 'teléfono'} registrado. Ingrésalo manualmente.
                    </p>
                  )}

                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                    <input
                      type="radio"
                      checked={origenDestinatario === 'manual'}
                      onChange={() => setOrigenDestinatario('manual')}
                      className="accent-brand"
                    />
                    Escribir {requiereCorreo ? 'un correo' : 'un número'} diferente
                  </label>

                  {origenDestinatario === 'manual' && (
                    <input
                      type={requiereCorreo ? 'email' : 'tel'}
                      value={destinatarioManual}
                      onChange={(e) => setDestinatarioManual(e.target.value)}
                      placeholder={requiereCorreo ? 'correo@ejemplo.com' : '300 123 4567'}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
                    />
                  )}

                  {!destinatarioValido && destinatarioFinal && (
                    <p className="text-xs text-red-500">
                      {requiereCorreo ? 'Ese correo no parece válido.' : 'Ese número no parece válido.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Saludo y despedida: se autoselecciona según la hora actual, pero
              se puede ajustar a mano (por ejemplo, si se redacta de día un
              mensaje que se enviará de noche). */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Saludo del mensaje
            </p>
            <div className="grid grid-cols-4 gap-2">
              {SALUDOS_HORARIO.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHorarioId(h.id)}
                  className={`py-2 rounded-lg border text-xs font-semibold transition-all ${
                    horarioId === h.id
                      ? 'bg-brand border-brand text-white'
                      : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:border-brand hover:text-brand'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vista previa / edición del mensaje */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vista previa del mensaje</p>
              <button
                onClick={() => setEditando((v) => !v)}
                className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" /> {editando ? 'Listo' : 'Editar'}
              </button>
            </div>

            {generando ? (
              <div className="flex items-center gap-2 text-gray-400 text-xs py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Generando mensaje…
              </div>
            ) : editando ? (
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={10}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white font-mono"
              />
            ) : (
              <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg p-3.5 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap max-h-64 overflow-y-auto custom-scroll">
                {mensaje}
              </div>
            )}
          </div>

          {/* Toggle: incluir enlace de descarga público */}
          {(tipo === 'FACTURA' || tipo === 'RECIBO') && (
            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg cursor-pointer select-none">
              <input
                type="checkbox"
                checked={incluirEnlace}
                onChange={() => setIncluirEnlace((v) => !v)}
                disabled={generando || generandoEnlace || editando}
                className="accent-brand w-4 h-4"
              />
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <Link2 className="w-4 h-4 text-brand shrink-0" />
                <span>
                  Incluir enlace de descarga {tipo === 'FACTURA' ? 'de la factura' : 'del recibo'}
                  <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Enlace temporal (72 h) · no requiere sesión
                  </span>
                </span>
              </div>
            </label>
          )}
        </div>

        <div className="p-5 border-t border-gray-200 dark:border-dark-muted shrink-0 flex flex-wrap gap-2">
          <button
            onClick={onClose}
            disabled={generandoEnlace}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-muted hover:bg-gray-50 dark:hover:bg-dark-muted/40 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>

          {canal === 'COPIAR' ? (
            <button
              onClick={handleCopiar}
              disabled={generando}
              className="flex-[2] flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-dark disabled:opacity-60 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
            >
              {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiado ? 'Copiado' : 'Copiar mensaje'}
            </button>
          ) : (
            <button
              onClick={handleAbrirCanal}
              disabled={generando || generandoEnlace || !destinatarioValido}
              className="flex-[2] flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-dark disabled:opacity-40 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
            >
              {canalActivo && <canalActivo.icon className="w-4 h-4" />}
              Abrir {canalActivo?.label}
            </button>
          )}
        </div>

        {/* Overlay de carga al generar enlace público */}
        {generandoEnlace && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mb-4">
              <Loader2 className="w-7 h-7 text-brand animate-spin" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">Generando enlace de descarga</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
              Esto puede tardar unos segundos mientras el servidor se activa. El enlace durará 72 horas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
