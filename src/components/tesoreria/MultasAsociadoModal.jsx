import { useEffect, useState } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import {
  X, Loader2, ShieldAlert, BarChart3, Users, MessageCircle,
  Wallet, Check, Pencil, AlertTriangle, Receipt, ExternalLink, Download, FileText,
} from 'lucide-react';
import { TesoreriaAPI } from '../../api/tesoreria';
import { RecibosAPI } from '../../api/recibos';
import { ConfiguracionAPI } from '../../api/configuracion';
import { useToast } from '../../context/ToastContext';
import AsociadoPicker from './AsociadoPicker';
import NotificarModal from '../notificarDocumento/NotificarModal';
import MultaDetalleModal from '../multas/MultaDetalleModal';
import { formatCOP, formatCOPInput, unformatCOP } from '../../utils/formatCOP';

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
  PAGADA: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  ANULADA: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600',
};

const INDEPENDIENTE_BADGE = 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';

// Modal de consulta de multas. Usa GET /multas (global) para el resumen general y
// GET /multas/asociado/{id} para la vista por asociado. Soporta multas independientes
// con pago directo y edición de valor.
export default function MultasAsociadoModal({ open, onClose }) {
  useLockBodyScroll(Boolean(open), onClose);

  const { success, error, warning, info } = useToast();
  const [tab, setTab] = useState('asociado');

  const [asociado, setAsociado] = useState(null);
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [resumen, setResumen] = useState(null);
  const [cargandoResumen, setCargandoResumen] = useState(false);
  const [notificarOpen, setNotificarOpen] = useState(false);
  const [multaNotificar, setMultaNotificar] = useState(null);

  const [metodosPago, setMetodosPago] = useState([]);
  const [pagarOpen, setPagarOpen] = useState(false);
  const [multaPagar, setMultaPagar] = useState(null);
  const [metodoPagoId, setMetodoPagoId] = useState('');
  const [pagando, setPagando] = useState(false);

  const [editarOpen, setEditarOpen] = useState(false);
  const [multaEditar, setMultaEditar] = useState(null);
  const [nuevoValor, setNuevoValor] = useState('');
  const [editando, setEditando] = useState(false);

  const [cargandoRecibo, setCargandoRecibo] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [descargandoMultaPdf, setDescargandoMultaPdf] = useState(null);
  const [selectedMulta, setSelectedMulta] = useState(null);

  useEffect(() => {
    if (open) {
      setTab('asociado');
      setAsociado(null);
      setResumen(null);
    }
  }, [open]);

  useEffect(() => {
    if (!asociado) {
      setMultas([]);
      return;
    }
    setLoading(true);
    TesoreriaAPI.listarMultasAsociado(asociado.id)
      .then((data) => setMultas(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => error(err.message || 'Error al cargar multas.', "No se pudieron obtener las multas del asociado."))
      .finally(() => setLoading(false));
  }, [asociado]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarMetodosPago = () => {
    if (metodosPago.length === 0) {
      ConfiguracionAPI.listarMetodosPago()
        .then((data) => setMetodosPago(Array.isArray(data) ? data : data?.content || []))
        .catch(() => {});
    }
  };

  if (!open) return null;

  const totalPendiente = multas.filter((m) => m.estado === 'PENDIENTE').reduce((acc, m) => acc + Number(m.valor || 0), 0);

  const cargarResumenGlobal = async () => {
    setCargandoResumen(true);
    setResumen(null);
    try {
      const data = await TesoreriaAPI.listarMultas();
      const todas = Array.isArray(data) ? data : data?.content || [];

      let totalMultas = todas.length;
      let pendientes = 0;
      let pagadas = 0;
      let anuladas = 0;
      let valorPendiente = 0;
      let valorPagado = 0;
      let valorTotal = 0;
      let independientes = 0;
      let independientesPendientes = 0;
      let valorIndependientesPendiente = 0;

      for (const m of todas) {
        valorTotal += Number(m.valor || 0);
        if (m.estado === 'PENDIENTE') {
          pendientes++;
          valorPendiente += Number(m.valor || 0);
          if (m.independiente) {
            independientesPendientes++;
            valorIndependientesPendiente += Number(m.valor || 0);
          }
        } else if (m.estado === 'PAGADA') {
          pagadas++;
          valorPagado += Number(m.valor || 0);
        } else if (m.estado === 'ANULADA') {
          anuladas++;
        }
        if (m.independiente) independientes++;
      }

      setResumen({
        totalMultas,
        pendientes,
        pagadas,
        anuladas,
        valorPendiente,
        valorPagado,
        valorTotal,
        independientes,
        independientesPendientes,
        valorIndependientesPendiente,
        todas,
      });
    } catch (err) {
      error(err.message || 'Error al cargar resumen.', "No se pudo obtener el resumen global de multas.");
    } finally {
      setCargandoResumen(false);
    }
  };

  const abrirPagar = (m) => {
    setMultaPagar(m);
    setMetodoPagoId('');
    setPagarOpen(true);
    cargarMetodosPago();
  };

  const confirmarPago = async () => {
    if (!metodoPagoId) {
      warning("Método de pago requerido.", "Selecciona un método de pago para confirmar.");
      return;
    }
    setPagando(true);
    try {
      await TesoreriaAPI.pagarMulta(multaPagar.id, { metodoPagoId });
      success("Pago registrado.", "La multa fue pagada y su estado se actualizó.");
      setPagarOpen(false);
      setMultaPagar(null);
      if (asociado) {
        const data = await TesoreriaAPI.listarMultasAsociado(asociado.id);
        setMultas(Array.isArray(data) ? data : data?.content || []);
      }
      if (tab === 'resumen') cargarResumenGlobal();
    } catch (err) {
      error(err.message || 'Error al pagar multa.', "No se pudo procesar el pago de la multa.");
    } finally {
      setPagando(false);
    }
  };

  const abrirEditar = (m) => {
    setMultaEditar(m);
    setNuevoValor(String(m.valor || ''));
    setEditarOpen(true);
  };

  const handleVerRecibo = async (m) => {
    setCargandoRecibo(true);
    try {
      const recibo = await RecibosAPI.buscarPorMulta(m.id);
      if (recibo) {
        info("Vista previa del recibo.", "Abriendo nueva ventana con el recibo en HTML.");
        const html = await RecibosAPI.html(recibo.numeroRecibo);
        const ventana = window.open('', '_blank');
        if (ventana) {
          ventana.document.write(html);
          ventana.document.close();
        } else {
          warning("Ventana bloqueada.", "El navegador bloqueó la ventana emergente. Permite ventanas emergentes para este sitio.");
        }
      } else {
        warning("Recibo no encontrado.", "La multa no tiene un recibo asociado.");
      }
    } catch {
      warning("Error al cargar recibo.", "No se pudo obtener el recibo. Intenta de nuevo.");
    } finally {
      setCargandoRecibo(false);
    }
  };

  const handleDescargarRecibo = async (m) => {
    setDescargandoPdf(true);
    try {
      const recibo = await RecibosAPI.buscarPorMulta(m.id);
      if (recibo) {
        await RecibosAPI.abrirPdf(recibo.numeroRecibo);
        success("Recibo abierto.", "Usa 'Guardar como PDF' en el diálogo de impresión.");
      } else {
        warning("Recibo no encontrado.", "La multa no tiene un recibo asociado.");
      }
    } catch {
      error("Error al descargar recibo.", "No se pudo obtener el archivo PDF.");
    } finally {
      setDescargandoPdf(false);
    }
  };

  const handleDescargarMultaPdf = async (m) => {
    setDescargandoMultaPdf(m.id);
    try {
      await TesoreriaAPI.descargarMultaPdf(m.id);
      success("PDF listo.", "Usa 'Guardar como PDF' en el diálogo de impresión.");
    } catch (err) {
      console.error('[MultasAsociadoModal] Error al descargar PDF de multa:', err);
      error("Error al descargar multa.", err.message || "No se pudo obtener el archivo PDF.");
    } finally {
      setDescargandoMultaPdf(null);
    }
  };

  const handleVerMultaHtml = async (m) => {
    info("Abriendo vista previa.", "Se abrirá en una nueva pestaña del navegador.");
    try {
      const html = await TesoreriaAPI.verMultaHtml(m.id);
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      } else {
        warning("Ventana bloqueada.", "El navegador bloqueó la ventana emergente.");
      }
    } catch (err) {
      console.error('[MultasAsociadoModal] Error al abrir vista previa HTML:', err);
      error("Error al abrir vista previa.", err.message || "Intenta descargar el PDF.");
    }
  };

  const confirmarEdicion = async () => {
    if (!nuevoValor || Number(nuevoValor) <= 0) {
      warning("Valor inválido.", "El nuevo valor debe ser mayor a cero.");
      return;
    }
    setEditando(true);
    try {
      await TesoreriaAPI.editarValorMulta(multaEditar.id, { valor: Number(nuevoValor) });
      success("Valor actualizado.", "El valor de la multa se guardó correctamente.");
      setEditarOpen(false);
      setMultaEditar(null);
      if (asociado) {
        const data = await TesoreriaAPI.listarMultasAsociado(asociado.id);
        setMultas(Array.isArray(data) ? data : data?.content || []);
      }
      if (tab === 'resumen') cargarResumenGlobal();
    } catch (err) {
      error(err.message || 'Error al editar valor.', "No se pudo actualizar el valor de la multa.");
    } finally {
      setEditando(false);
    }
  };

  const renderMultaCard = (m, { showPagar = false, showEditar = false, showNotificar = false } = {}) => (
    <div key={m.id} className="p-3 rounded-lg border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-colors" onClick={() => setSelectedMulta(m)}>
      <div className="flex justify-between items-start gap-2 mb-1">
        <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">{m.motivo}</p>
        <div className="flex items-center gap-1 shrink-0">
          {m.independiente && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${INDEPENDIENTE_BADGE}`}>
              INDEPENDIENTE
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ESTADO_BADGE[m.estado] || ESTADO_BADGE.PENDIENTE}`}>
            {m.estado}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500">
        <span>{formatFecha(m.fecha)}</span>
        <span className="font-bold text-gray-800 dark:text-white text-sm">{formatCOP(m.valor)}</span>
      </div>
      <div className="mt-2 flex gap-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); handleVerMultaHtml(m); }}
          className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-gray-600 dark:text-gray-300 text-xs font-semibold transition-colors"
          title="Ver comprobante en línea"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDescargarMultaPdf(m); }}
          disabled={descargandoMultaPdf === m.id}
          className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold transition-colors disabled:opacity-50"
          title="Descargar comprobante de multa"
        >
          {descargandoMultaPdf === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          Multa
        </button>
        {showPagar && m.independiente && m.estado === 'PENDIENTE' && (
          <button
            onClick={(e) => { e.stopPropagation(); abrirPagar(m); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold transition-colors"
          >
            <Wallet className="w-3.5 h-3.5" /> Pagar
          </button>
        )}
        {showEditar && m.independiente && m.estado === 'PENDIENTE' && (
          <button
            onClick={(e) => { e.stopPropagation(); abrirEditar(m); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar valor
          </button>
        )}
        {showNotificar && m.estado === 'PENDIENTE' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMultaNotificar(m);
              setNotificarOpen(true);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-gray-600 dark:text-gray-300 text-xs font-semibold transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Notificar
          </button>
        )}
        {m.estado === 'PAGADA' && m.independiente && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleVerRecibo(m); }}
              disabled={cargandoRecibo}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {cargandoRecibo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />} Ver recibo
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDescargarRecibo(m); }}
              disabled={descargandoPdf}
              title="Descargar recibo PDF"
              className="flex items-center justify-center py-1.5 px-2.5 rounded-lg bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-emerald-600 dark:text-emerald-400 transition-colors disabled:opacity-50"
            >
              {descargandoPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" /> Multas
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-4 flex gap-1.5 shrink-0">
          <button
            onClick={() => setTab('asociado')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
              tab === 'asociado'
                ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:border-gray-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Por asociado
          </button>
          <button
            onClick={() => {
              setTab('resumen');
              if (!resumen) cargarResumenGlobal();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
              tab === 'resumen'
                ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:border-gray-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Resumen general
          </button>
        </div>

        <div className="modal-shell__body flex-1 p-5 overflow-y-auto overscroll-contain custom-scroll space-y-4">
          {tab === 'asociado' && (
            <>
              <AsociadoPicker value={asociado} onChange={setAsociado} autoFocus />

              {loading && (
                <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Cargando multas…</span>
                </div>
              )}

              {!loading && asociado && multas.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                  Este asociado no tiene multas registradas.
                </p>
              )}

              {!loading && multas.length > 0 && (
                <>
                  <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    Multas del asociado
                  </h4>
                  {totalPendiente > 0 && (
                    <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-lg px-3.5 py-2.5">
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Total pendiente</span>
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{formatCOP(totalPendiente)}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {multas.map((m) =>
                      renderMultaCard(m, {
                        showPagar: true,
                        showEditar: true,
                        showNotificar: true,
                      })
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {tab === 'resumen' && (
            <>
              {cargandoResumen && (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Cargando resumen global…</span>
                </div>
              )}

              {resumen && !cargandoResumen && (
                <>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 flex flex-col items-center">
                      <span className="text-2xl font-black text-gray-800 dark:text-white">{resumen.totalMultas}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center">Multas totales</span>
                    </div>
                    <div className="p-3 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 flex flex-col items-center">
                      <span className="text-2xl font-black text-amber-500">{resumen.pendientes}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center">Por cobrar</span>
                    </div>
                    <div className="p-3 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 flex flex-col items-center">
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{resumen.pagadas}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center">Pagadas</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl p-3.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Valor por cobrar</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{formatCOP(resumen.valorPendiente)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Valor ya cobrado</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCOP(resumen.valorPagado)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-gray-200 dark:border-dark-muted">
                      <span className="text-gray-500 dark:text-gray-400">Valor total histórico</span>
                      <span className="font-bold text-gray-800 dark:text-white">{formatCOP(resumen.valorTotal)}</span>
                    </div>
                  </div>

                  {resumen.independientes > 0 && (
                    <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50 dark:bg-purple-900/10 space-y-1.5">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldAlert className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-400">Multas independientes</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-purple-600 dark:text-purple-400">Total independientes</span>
                        <span className="font-bold text-purple-700 dark:text-purple-300">{resumen.independientes}</span>
                      </div>
                      {resumen.independientesPendientes > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-purple-600 dark:text-purple-400">Pendientes por cobrar</span>
                          <span className="font-bold text-purple-700 dark:text-purple-300">
                            {resumen.independientesPendientes} ({formatCOP(resumen.valorIndependientesPendiente)})
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {resumen.pendientes > 0 && (
                    <>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Multas pendientes por cobrar
                      </p>
                      <div className="space-y-2">
                        {resumen.todas
                          .filter((m) => m.estado === 'PENDIENTE')
                          .map((m) => renderMultaCard(m, { showPagar: true, showEditar: true }))}
                      </div>
                    </>
                  )}

                  <button
                    onClick={cargarResumenGlobal}
                    className="w-full py-2 rounded-lg bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-gray-600 dark:text-gray-300 text-xs font-semibold transition-colors"
                  >
                    Actualizar resumen
                  </button>
                </>
              )}

              {!resumen && !cargandoResumen && (
                <div className="text-center py-6">
                  <AlertTriangle className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                    Consulta el listado completo de multas del sistema, incluyendo las independientes.
                  </p>
                  <button
                    onClick={cargarResumenGlobal}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" /> Cargar resumen
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <NotificarModal
        open={notificarOpen}
        onClose={() => setNotificarOpen(false)}
        tipo="MULTA"
        documento={multaNotificar}
        documentoId={multaNotificar?.id}
        asociadoId={asociado?.id}
        asociadoNombre={asociado ? `${asociado.nombres} ${asociado.apellidos}` : undefined}
      />

      {/* Modal de detalle de multa */}
      <MultaDetalleModal
        open={!!selectedMulta}
        multa={selectedMulta}
        esAsociado={false}
        onClose={() => setSelectedMulta(null)}
      />

      {pagarOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPagarOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" /> Pagar multa
              </h4>
              <button onClick={() => setPagarOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            {multaPagar && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Motivo:</strong> {multaPagar.motivo}
                </p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 text-center">
                  {formatCOP(multaPagar.valor)}
                </p>
              </>
            )}
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                Método de pago <span className="text-red-500">*</span>
              </label>
              <select
                value={metodoPagoId}
                onChange={(e) => setMetodoPagoId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
              >
                <option value="">Seleccione…</option>
                {metodosPago.map((mp) => (
                  <option key={mp.id} value={mp.id}>{mp.nombre}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPagarOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPago}
                disabled={pagando || !metodoPagoId}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                {pagando && <Loader2 className="w-4 h-4 animate-spin" />}
                <Check className="w-4 h-4" /> Confirmar pago
              </button>
            </div>
          </div>
        </div>
      )}

      {editarOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditarOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-500" /> Editar valor
              </h4>
              <button onClick={() => setEditarOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            {multaEditar && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Motivo:</strong> {multaEditar.motivo}
              </p>
            )}
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                Nuevo valor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatCOPInput(nuevoValor)}
                onChange={(e) => setNuevoValor(unformatCOP(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditarOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEdicion}
                disabled={editando || !nuevoValor || Number(nuevoValor) <= 0}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                {editando && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
