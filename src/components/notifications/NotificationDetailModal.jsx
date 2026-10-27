import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, ExternalLink, ImageOff, ShieldAlert, AlertTriangle, Info, Siren, CircleDollarSign, CircleAlert, Banknote, EyeOff } from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

const PRIORIDAD_BADGE = {
  URGENTE: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  ALTA: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  MEDIA: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  NORMAL: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  BAJA: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
};

const PRIORIDAD_ICON = {
  URGENTE: Siren,
  ALTA: ShieldAlert,
  MEDIA: AlertTriangle,
  NORMAL: Info,
  BAJA: Info,
};

const TIPO_LABEL = {
  PUBLICA: 'Pública',
  ASOCIADO: 'Privada',
  ADMINISTRATIVA: 'Interna',
};

const TIPO_BADGE = {
  PUBLICA: 'bg-brand/10 text-brand dark:text-brand-light border-brand/20',
  ASOCIADO: 'bg-gray-500/10 text-gray-600 dark:text-gray-300 border-gray-500/20',
  ADMINISTRATIVA: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
};

function esAvisoTesorero(n) {
  return n?.titulo === 'Aviso de Tesorería';
}

function estaRecibiendoPagos(n) {
  return n?.contenidoCompleto?.includes('recibirá pagos') || n?.descripcionCorta?.includes('recibirá pagos');
}

function formatFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function NotificationDetailModal() {
  const { detalle, cerrarDetalle, ocultarNotificacion } = useNotifications();
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  useLockBodyScroll(Boolean(detalle), cerrarDetalle);

  if (!detalle) return null;

  const esTesorero = esAvisoTesorero(detalle);
  const pagosActivos = esTesorero && estaRecibiendoPagos(detalle);

  // --- Layout especial para Avisos de Tesorería ---
  if (esTesorero) {
    return (
      <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={cerrarDetalle} aria-hidden="true" />
        <div className="modal-shell__card relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh] bg-white dark:bg-gray-900"
          role="dialog" aria-modal="true"
        >
          {/* Barra de color superior */}
          <div className={`h-2 w-full shrink-0 ${pagosActivos ? 'bg-emerald-500' : 'bg-red-500'}`} />

          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b shrink-0 ${
            pagosActivos
              ? 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5'
              : 'border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${
                pagosActivos
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Aviso de Tesorería</h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                  pagosActivos
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                }`}>
                  {pagosActivos ? <CircleDollarSign className="w-3 h-3" /> : <CircleAlert className="w-3 h-3" />}
                  {pagosActivos ? 'Recibiendo pagos' : 'Servicio suspendido'}
                </span>
              </div>
            </div>
            <button onClick={cerrarDetalle} aria-label="Cerrar"
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="modal-shell__body flex-1 p-6 overflow-y-auto overscroll-contain custom-scroll">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mb-4">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatFecha(detalle.fechaPublicacion)}</span>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {detalle.contenidoCompleto || detalle.descripcionCorta}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-shell__footer p-4 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950/40 flex justify-between shrink-0">
            <button
              onClick={() => { ocultarNotificacion(detalle.id); }}
              className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-bold transition-all flex items-center gap-1.5"
            >
              <EyeOff className="w-3.5 h-3.5" /> Ocultar
            </button>
            <button
              onClick={cerrarDetalle}
              className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-dark-muted/50 hover:bg-gray-200 dark:hover:bg-dark-muted rounded-xl font-bold transition-all border border-gray-200 dark:border-dark-muted"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Layout normal para el resto de notificaciones ---
  const PrioridadIcon = PRIORIDAD_ICON[detalle.prioridad] || Info;
  const tieneImagen = !!detalle.enlaceUrl && !imgError;
  const esEnlaceExterno = /^https?:\/\//i.test(detalle.enlaceUrl || '');
  const esRutaPublicacion = /^\/publicaciones\/\d+/.test(detalle.enlaceUrl || '');

  const handleVerRecurso = (e) => {
    if (esEnlaceExterno) return;
    e.preventDefault();
    cerrarDetalle();
    if (esRutaPublicacion && detalle.enlaceUrl) {
      navigate(detalle.enlaceUrl);
    } else {
      navigate('/publicaciones');
    }
  };

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={cerrarDetalle} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-muted overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]"
        role="dialog" aria-modal="true"
      >
        {/* Header */}
        <div className="modal-shell__header flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-muted shrink-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${TIPO_BADGE[detalle.tipo] || TIPO_BADGE.PUBLICA}`}>
              {TIPO_LABEL[detalle.tipo] || detalle.tipo}
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border flex items-center gap-1 ${PRIORIDAD_BADGE[detalle.prioridad] || PRIORIDAD_BADGE.BAJA}`}>
              <PrioridadIcon className="w-3 h-3" />
              {detalle.prioridad}
            </span>
          </div>
          <button onClick={cerrarDetalle} aria-label="Cerrar"
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-shell__body flex-1 p-6 overflow-y-auto overscroll-contain custom-scroll">
          <div className="relative w-full h-44 rounded-xl mb-5 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-dark-muted bg-gradient-to-br from-gray-100 to-gray-50 dark:from-dark-muted dark:to-dark-bg">
            {tieneImagen ? (
              <img src={detalle.enlaceUrl} alt={detalle.titulo} loading="lazy" className="w-full h-full object-cover" onError={() => setImgError(true)} />
            ) : (
              <div className="flex flex-col items-center gap-1.5 p-4 text-center">
                <div className="p-2.5 rounded-full bg-brand/10 border border-brand/20 text-brand">
                  <ImageOff className="w-6 h-6" />
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">Sin adjunto gráfico</span>
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 leading-snug">{detalle.titulo}</h3>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mb-4">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatFecha(detalle.fechaPublicacion)}</span>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {detalle.contenidoCompleto || detalle.descripcionCorta}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-shell__footer p-4 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950/40 flex justify-between gap-3 shrink-0">
          <button
            onClick={() => { ocultarNotificacion(detalle.id); }}
            className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-bold transition-all flex items-center gap-1.5"
          >
            <EyeOff className="w-3.5 h-3.5" /> Ocultar
          </button>
          <div className="flex gap-3">
            {detalle.enlaceUrl && (
              <a
                href={esEnlaceExterno ? detalle.enlaceUrl : detalle.enlaceUrl || '/publicaciones'}
                target={esEnlaceExterno ? '_blank' : undefined}
                rel={esEnlaceExterno ? 'noreferrer' : undefined}
                onClick={handleVerRecurso}
                className="px-4 py-2 text-xs text-white bg-brand hover:bg-brand-dark rounded-xl font-bold transition-all flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> {esEnlaceExterno ? 'Ver recurso' : esRutaPublicacion ? 'Ver publicación' : 'Ver más detalles'}
              </a>
            )}
            <button onClick={cerrarDetalle}
              className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-dark-muted/50 hover:bg-gray-200 dark:hover:bg-dark-muted rounded-xl font-bold transition-all border border-gray-200 dark:border-dark-muted"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
