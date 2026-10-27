import { useEffect, useState } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, Download, ExternalLink, Wallet, QrCode, MessageCircle, Share2 } from 'lucide-react';
import { FacturasAPI } from '../../api/facturas';
import { abrirDocumentoHtml } from '../../utils/documentos';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import NotificarModal from '../notificarDocumento/NotificarModal';
import { generarMensajeFacturaSimple } from '../../utils/notificarDocumento/plantillas';
import { obtenerConfigInstitucional } from '../../utils/notificarDocumento/prefs';
import { formatCOP } from '../../utils/formatCOP';

function formatFecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const ESTADO_BADGE = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  PAGADA_PARCIAL: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800',
  PAGADA: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  VENCIDA: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  ANULADA: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600',
};

// Modal de detalle de factura (GET /api/v1/facturas/{id}), con acceso a HTML/PDF oficiales.
// facturaId permite abrir el modal solo con el id (ej. desde otra pantalla) y refrescar el detalle.
export default function FacturaDetalleModal({ open, factura, facturaId, onClose }) {
  useLockBodyScroll(Boolean(open), onClose);

  const { success, error, warning, info } = useToast();
  const { rol, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [detalle, setDetalle] = useState(factura || null);
  const [loading, setLoading] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [cargandoHtml, setCargandoHtml] = useState(false);
  const [notificarOpen, setNotificarOpen] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);

  const id = factura?.id || facturaId;

  useEffect(() => {
    if (!open || !id) return;
    setDetalle(factura || null);
    setLoading(true);
    FacturasAPI.obtener(id)
      .then(setDetalle)
      .catch((err) => error(err.message || 'Error al cargar factura.', "No se pudo obtener el detalle de la factura."))
      .finally(() => setLoading(false));
  }, [open, id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !id) return null;

  const handleVerHtml = async () => {
    setCargandoHtml(true);
    info("Vista previa de factura.", "Abriendo nueva ventana con la factura en HTML.");
    try {
      const html = await FacturasAPI.htmlSinAbrir(id);
      abrirDocumentoHtml(html);
    } catch (err) {
      error(err.message || 'Error al abrir factura.', "No se pudo generar la vista previa de la factura.");
    } finally {
      setCargandoHtml(false);
    }
  };

  const handleDescargarPdf = async () => {
    setDescargando(true);
    try {
      await FacturasAPI.descargarPdf(id);
      success('Factura abierta', 'Usa "Guardar como PDF" en el diálogo de impresión.');
    } catch (err) {
      error(err.message || 'Error al descargar PDF.', "No se pudo obtener el archivo PDF de la factura.");
    } finally {
      setDescargando(false);
    }
  };

  const irARegistrarPago = () => {
    navigate(`/tesoreria?facturaId=${id}`);
  };

  // El asociado comparte SU PROPIA factura: mensaje corto, sin saludo ni
  // destinatario que elegir (no tiene sentido "notificarse a sí mismo").
  // Usa el selector nativo para compartir del dispositivo cuando existe
  // (WhatsApp, Mensajes, correo, etc. — lo que el usuario ya tenga
  // instalado); si el navegador no lo soporta, copia el texto al
  // portapapeles como alternativa.
  const handleCompartir = async () => {
    setCompartiendo(true);
    try {
      const institucional = await obtenerConfigInstitucional().catch(() => null);
      const texto = generarMensajeFacturaSimple({ documento: detalle, institucional });
      if (navigator.share) {
        await navigator.share({ text: texto, title: `Factura ${detalle.numeroFactura}` });
      } else {
        await navigator.clipboard.writeText(texto);
        success("Enlace copiado.", "Puedes pegar el enlace en cualquier aplicación.");
      }
    } catch (err) {
      // AbortError: el usuario cerró el panel nativo de compartir sin elegir nada — no es un error real.
      if (err?.name !== 'AbortError') error("Error al compartir.", "No se pudo generar el enlace de la factura.");
    } finally {
      setCompartiendo(false);
    }
  };

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Detalle de factura</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-shell__body flex-1 p-5 overflow-y-auto overscroll-contain custom-scroll">
          {loading && !detalle && (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando factura…</span>
            </div>
          )}

          {detalle && (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xl font-black text-gray-800 dark:text-white">{detalle.numeroFactura}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {detalle.asociadoNombre} · Medidor {detalle.numeroMedidor}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${ESTADO_BADGE[detalle.estado] || ESTADO_BADGE.PENDIENTE}`}>
                  {detalle.estado}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <span className="block text-gray-400 dark:text-gray-500 text-xs">Fecha de emisión</span>
                  <span className="text-gray-800 dark:text-white">{formatFecha(detalle.fechaEmision)}</span>
                </div>
                <div>
                  <span className="block text-gray-400 dark:text-gray-500 text-xs">Fecha límite de pago</span>
                  <span className="text-gray-800 dark:text-white">{formatFecha(detalle.fechaLimitePago)}</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-dark-muted divide-y divide-gray-200 dark:divide-dark-muted text-sm mb-4">
                <div className="p-3 flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Lectura anterior → actual</span>
                  <span className="font-mono text-gray-800 dark:text-white">
                    {detalle.lecturaAnterior ?? '—'} → {detalle.lecturaActual} ({detalle.consumoM3} m³)
                  </span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Valor del consumo</span>
                  <span className="font-mono text-gray-800 dark:text-white">{formatCOP(detalle.valorConsumo)}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Cargo de administración</span>
                  <span className="font-mono text-gray-800 dark:text-white">{formatCOP(detalle.cargoAdministracion)}</span>
                </div>
                {detalle.valoresAdicionales > 0 && (
                  <div className="p-3 flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Conceptos adicionales</span>
                    <span className="font-mono text-gray-800 dark:text-white">{formatCOP(detalle.valoresAdicionales)}</span>
                  </div>
                )}
                {detalle.totalMultas > 0 && (
                  <div className="p-3 flex justify-between bg-amber-50 dark:bg-amber-900/10">
                    <span className="text-gray-500 dark:text-gray-400">Multas</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">{formatCOP(detalle.totalMultas)}</span>
                  </div>
                )}
                <div className="p-3 flex justify-between bg-brand/5">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Total factura</span>
                  <span className="font-mono font-bold text-brand">{formatCOP(detalle.total)}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Total pagado</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatCOP(detalle.totalPagado)}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Saldo pendiente</span>
                  <span className="font-mono text-red-600 dark:text-red-400">{formatCOP(detalle.saldoPendiente)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  onClick={handleVerHtml}
                  disabled={cargandoHtml}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 disabled:opacity-60 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-white transition-colors"
                >
                  {cargandoHtml ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  Vista previa
                </button>
                <button
                  onClick={handleDescargarPdf}
                  disabled={descargando}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-dark disabled:opacity-60 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
                >
                  {descargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Descargar PDF
                </button>
              </div>

              {rol === 'ASOCIADO' ? (
                <button
                  onClick={handleCompartir}
                  disabled={compartiendo}
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 disabled:opacity-60 py-2.5 rounded-lg text-sm font-semibold text-emerald-700 dark:text-emerald-400 transition-colors mb-2"
                >
                  {compartiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                  Compartir esta factura
                </button>
              ) : (
                <button
                  onClick={() => setNotificarOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 py-2.5 rounded-lg text-sm font-semibold text-emerald-700 dark:text-emerald-400 transition-colors mb-2"
                >
                  <MessageCircle className="w-4 h-4" /> Notificar al asociado
                </button>
              )}

              {isAuthenticated && rol === 'TESORERO' && detalle.estado !== 'ANULADA' && detalle.estado !== 'PAGADA' && (
                <button
                  onClick={irARegistrarPago}
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors mt-2"
                >
                  <Wallet className="w-4 h-4" /> Registrar pago de esta factura
                </button>
              )}

              {detalle.codigoQr && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5 justify-center mt-3">
                  <QrCode className="w-3.5 h-3.5" /> Código QR de verificación disponible en el PDF impreso
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <NotificarModal
        open={notificarOpen}
        onClose={() => setNotificarOpen(false)}
        tipo="FACTURA"
        documento={detalle}
        documentoId={id}
        documentoNumero={detalle?.numeroFactura}
        asociadoId={detalle?.asociadoId}
        asociadoNombre={detalle?.asociadoNombre}
      />
    </div>
  );
}
