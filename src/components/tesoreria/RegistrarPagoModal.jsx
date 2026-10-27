import { useEffect, useState } from 'react';
import { X, Loader2, Wallet, FileText, CheckCircle2, ExternalLink, Download, ChevronLeft, MessageCircle, Search } from 'lucide-react';
import { FacturasAPI } from '../../api/facturas';
import { TesoreriaAPI } from '../../api/tesoreria';
import { RecibosAPI } from '../../api/recibos';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import useConfirmClose from '../../hooks/useConfirmClose';
import ConfirmDialog from '../common/ConfirmDialog';
import AsociadoPickerConFiltros from './AsociadoPickerConFiltros';
import MetodoPagoSelect from './MetodoPagoSelect';
import NotificarModal from '../notificarDocumento/NotificarModal';
import { formatCOP, formatCOPInput, unformatCOP } from '../../utils/formatCOP';

const ESTADO_BADGE = {
  PENDIENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PAGADA_PARCIAL: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  VENCIDA: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// Modal principal del tesorero: registra el pago de una factura.
// Operación atómica en el backend: actualiza la factura, crea el movimiento,
// genera el recibo y notifica al asociado (Regla 8.5).
//
// facturaIdInicial permite abrir el modal ya apuntando a una factura concreta
// (llega por la URL /tesoreria?facturaId=, usada desde FacturaDetalleModal y QueryCards).
export default function RegistrarPagoModal({ open, facturaIdInicial, onClose, onSaved }) {
  const { success, error, warning, info } = useToast();
  const [factura, setFactura] = useState(null);
  const [cargandoFactura, setCargandoFactura] = useState(false);

  const [asociado, setAsociado] = useState(null);
  const [facturasAsociado, setFacturasAsociado] = useState([]);
  const [cargandoFacturas, setCargandoFacturas] = useState(false);

  const [valor, setValor] = useState('');
  const [metodoPagoId, setMetodoPagoId] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [descargando, setDescargando] = useState(false);
  const [cargandoHtml, setCargandoHtml] = useState(false);
  const [notificarOpen, setNotificarOpen] = useState(false);

  // Cobro rápido: búsqueda directa por número de factura (coincidencia
  // parcial), para el tesorero que ya tiene el papel del asociado en la mano.
  const [numeroBusqueda, setNumeroBusqueda] = useState('');
  const [buscandoNumero, setBuscandoNumero] = useState(false);
  const [resultadosNumero, setResultadosNumero] = useState([]);
  const [buscoNumero, setBuscoNumero] = useState(false);

  useEffect(() => {
    if (!open) return;
    setResultado(null);
    setObservaciones('');
    setMetodoPagoId(null);
    setAsociado(null);
    setFacturasAsociado([]);
    setFactura(null);
    setValor('');
    setNumeroBusqueda('');
    setResultadosNumero([]);
    setBuscoNumero(false);

    if (facturaIdInicial) {
      setCargandoFactura(true);
      FacturasAPI.obtener(facturaIdInicial)
        .then((data) => {
          setFactura(data);
          setValor(String(data.saldoPendiente ?? data.total ?? ''));
        })
        .catch((err) => error(err.message || 'Error al cargar factura.', "No se pudo obtener la información de la factura seleccionada."))
        .finally(() => setCargandoFactura(false));
    }
  }, [open, facturaIdInicial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!asociado) {
      setFacturasAsociado([]);
      return;
    }
    setCargandoFacturas(true);
    FacturasAPI.listarPorAsociado(asociado.id)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        setFacturasAsociado(lista.filter((f) => f.estado !== 'ANULADA' && Number(f.saldoPendiente) > 0));
      })
      .catch((err) => error(err.message || 'Error al cargar facturas.', "No se pudieron obtener las facturas del asociado seleccionado."))
      .finally(() => setCargandoFacturas(false));
  }, [asociado]); // eslint-disable-line react-hooks/exhaustive-deps

  // Solo pedimos confirmación si ya hay una factura seleccionada (o datos de
  // pago escritos) y el pago aún no se registró; no molestamos si apenas está
  // buscando el asociado, ni después de un pago exitoso.
  const isDirty = Boolean(!resultado && (factura || valor || observaciones.trim() || metodoPagoId));
  const { confirming, requestClose, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  useLockBodyScroll(open, requestClose);

  if (!open) return null;

  const seleccionarFactura = (f) => {
    setFactura(f);
    setValor(String(f.saldoPendiente ?? f.total ?? ''));
  };

  const volverABuscar = () => {
    setFactura(null);
    setValor('');
  };

  const buscarPorNumero = async () => {
    const q = numeroBusqueda.trim();
    if (!q) return;
    setBuscandoNumero(true);
    setBuscoNumero(true);
    try {
      const lista = await FacturasAPI.buscarPorNumero(q);
      setResultadosNumero(lista.filter((f) => f.estado !== 'ANULADA'));
    } catch (err) {
      error(err.message || 'No se pudo buscar la factura.', 'Verifica el número e inténtalo de nuevo.');
      setResultadosNumero([]);
    } finally {
      setBuscandoNumero(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!factura) return;
    if (!valor || Number(valor) <= 0) {
      warning("Valor inválido.", "El monto a pagar debe ser mayor a cero.");
      return;
    }
    if (!metodoPagoId) {
      warning("Método de pago requerido.", "Selecciona un método de pago para continuar.");
      return;
    }
    setSubmitting(true);
    try {
      const pago = await TesoreriaAPI.registrarPago({
        facturaId: factura.id,
        valor: Number(valor),
        metodoPagoId,
        observaciones: observaciones.trim() || undefined,
      });
      success(`Pago registrado.`, `Recibo ${pago.numeroRecibo} generado por ${formatCOP(pago.valor)}.`);
      setResultado(pago);
      onSaved?.(pago);
    } catch (err) {
      info(err.message || 'Error al registrar pago.', "Los datos ingresados no pudieron ser procesados.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerHtml = async () => {
    setCargandoHtml(true);
    info("Vista previa del recibo.", "Abriendo nueva ventana con el recibo en HTML.");
    try {
      const html = await RecibosAPI.html(resultado.numeroRecibo);
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      } else {
        warning("Ventana bloqueada.", "El navegador bloqueó la ventana emergente. Permite ventanas emergentes para este sitio.");
      }
    } catch (err) {
      error(err.message || 'Error al abrir recibo.', "No se pudo generar la vista previa del recibo.");
    } finally {
      setCargandoHtml(false);
    }
  };

  const handleDescargarPdf = async () => {
    setDescargando(true);
    try {
      const res = await RecibosAPI.abrirPdf(resultado.numeroRecibo);
      if (res?.ok) success('Recibo abierto', 'Usa "Guardar como PDF" en el diálogo de impresión.');
    } catch (err) {
      error(err.message || 'Error al descargar recibo.', "No se pudo obtener el archivo PDF del recibo.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={requestClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand" /> Registrar pago
          </h3>
          <button onClick={requestClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-shell__body flex-1 p-5 overflow-y-auto overscroll-contain custom-scroll">
          {resultado ? (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="font-bold text-gray-800 dark:text-white mb-1">Pago registrado con éxito</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Se generó el recibo <strong className="text-gray-800 dark:text-white">{resultado.numeroRecibo}</strong> por{' '}
                {formatCOP(resultado.valor)} para la factura {resultado.numeroFactura}.
              </p>

              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  onClick={handleVerHtml}
                  disabled={cargandoHtml}
                  className="flex flex-col items-center justify-center gap-1 bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 py-2.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-white transition-colors disabled:opacity-60"
                >
                  {cargandoHtml ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  {cargandoHtml ? 'Abriendo…' : 'Vista previa'}
                </button>
                <button
                  onClick={() => setNotificarOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 py-2.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-white transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Notificar
                </button>
                <button
                  onClick={handleDescargarPdf}
                  disabled={descargando}
                  className="flex flex-col items-center justify-center gap-1 bg-brand hover:bg-brand-dark disabled:opacity-60 py-2.5 rounded-lg text-xs font-semibold text-white transition-colors"
                >
                  {descargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Descargar
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <>
              {cargandoFactura && (
                <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Cargando factura…</span>
                </div>
              )}

              {!cargandoFactura && !factura && (
                <div className="space-y-3">
                  {/* Cobro rápido por número de factura: el camino más
                      corto cuando el asociado trae el papel en la mano. */}
                  <div className="bg-brand/5 dark:bg-brand/10 border border-brand/20 rounded-xl p-3 space-y-2">
                    <label className="block text-xs font-bold text-brand uppercase tracking-wide">
                      Cobro rápido por número
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={numeroBusqueda}
                        onChange={(e) => { setNumeroBusqueda(e.target.value); setBuscoNumero(false); setResultadosNumero([]); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarPorNumero(); } }}
                        placeholder="Ej. 0012 o FAC-2026-0012"
                        autoFocus
                        className="flex-1 min-w-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
                      />
                      <button
                        type="button"
                        onClick={buscarPorNumero}
                        disabled={buscandoNumero || !numeroBusqueda.trim()}
                        className="px-3 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white transition-colors text-sm font-semibold flex items-center gap-1.5 shrink-0"
                      >
                        {buscandoNumero ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Buscar
                      </button>
                    </div>
                    {resultadosNumero.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => seleccionarFactura(f)}
                        className="w-full text-left p-3 rounded-lg border border-brand/30 bg-white dark:bg-gray-950 hover:border-brand transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{f.numeroFactura}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{f.asociadoNombre}</p>
                        </div>
                        <span className="text-sm font-bold text-brand shrink-0">{formatCOP(f.saldoPendiente)}</span>
                      </button>
                    ))}
                    {buscoNumero && !buscandoNumero && resultadosNumero.length === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        No se encontró ninguna factura pendiente con ese número.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold">
                    <span className="flex-1 h-px bg-gray-200 dark:bg-dark-muted" />o busca por asociado<span className="flex-1 h-px bg-gray-200 dark:bg-dark-muted" />
                  </div>

                  <AsociadoPickerConFiltros value={asociado} onChange={setAsociado} />

                  {asociado && cargandoFacturas && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando facturas…
                    </div>
                  )}

                  {asociado && !cargandoFacturas && facturasAsociado.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 py-2">
                      Este asociado no tiene facturas pendientes de pago.
                    </p>
                  )}

                  {asociado && !cargandoFacturas && facturasAsociado.length > 0 && (
                    <div className="space-y-2">
                      {facturasAsociado.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => seleccionarFactura(f)}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-dark-muted hover:border-brand bg-gray-50 dark:bg-gray-950 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-brand/70 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{f.numeroFactura}</p>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ESTADO_BADGE[f.estado] || ''}`}>
                                {f.estado}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-brand shrink-0">{formatCOP(f.saldoPendiente)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!cargandoFactura && factura && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl p-3.5">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-brand/70 shrink-0" /> {factura.numeroFactura}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{factura.asociadoNombre}</p>
                      </div>
                      {!facturaIdInicial && (
                        <button
                          type="button"
                          onClick={volverABuscar}
                          className="text-xs text-brand hover:underline flex items-center gap-1 shrink-0"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Cambiar
                        </button>
                      )}
                    </div>
                    <div className="flex justify-between text-sm mt-3 pt-3 border-t border-gray-200 dark:border-dark-muted">
                      <span className="text-gray-500 dark:text-gray-400">Total factura</span>
                      <span className="font-mono text-gray-800 dark:text-white">{formatCOP(factura.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500 dark:text-gray-400">Saldo pendiente</span>
                      <span className="font-mono font-bold text-red-500 dark:text-red-400">{formatCOP(factura.saldoPendiente)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Valor a pagar <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      max={factura.saldoPendiente || undefined}
                      value={formatCOPInput(valor)}
                      onChange={(e) => setValor(unformatCOP(e.target.value))}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
                    />
                    {Number(valor) > 0 && Number(valor) < Number(factura.saldoPendiente) && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                        Pago parcial: quedará un saldo de {formatCOP(factura.saldoPendiente - Number(valor))}.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Método de pago <span className="text-red-500">*</span>
                    </label>
                    <MetodoPagoSelect value={metodoPagoId} onChange={setMetodoPagoId} />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Observaciones</label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      rows={2}
                      placeholder="Opcional…"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors resize-none"
                    />
                  </div>

                  <div className="pt-1 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={requestClose}
                      className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Registrar pago
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog open={confirming} onConfirm={confirmDiscard} onCancel={cancelDiscard} />

      {resultado && (
        <NotificarModal
          open={notificarOpen}
          onClose={() => setNotificarOpen(false)}
          tipo="RECIBO"
          documento={{
            numeroRecibo: resultado.numeroRecibo,
            numeroFactura: resultado.numeroFactura,
            valor: resultado.valor,
            fechaEmision: resultado.fecha,
            metodoPago: resultado.metodoPago,
            saldoPendiente: factura?.saldoPendiente > resultado.valor ? factura.saldoPendiente - resultado.valor : 0,
          }}
          documentoId={resultado.id}
          documentoNumero={resultado.numeroRecibo}
          asociadoId={resultado.asociadoId || factura?.asociadoId || asociado?.id}
          asociadoNombre={factura?.asociadoNombre || (asociado ? `${asociado.nombres} ${asociado.apellidos}` : undefined)}
        />
      )}
    </div>
  );
}
