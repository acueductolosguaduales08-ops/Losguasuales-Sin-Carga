import { useEffect, useState } from 'react';
import { X, Loader2, ShieldAlert, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { TesoreriaAPI } from '../../api/tesoreria';
import { FacturasAPI } from '../../api/facturas';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import useConfirmClose from '../../hooks/useConfirmClose';
import ConfirmDialog from '../common/ConfirmDialog';
import AsociadoPicker from './AsociadoPicker';
import { formatCOP, formatCOPInput, unformatCOP } from '../../utils/formatCOP';

// Modal para registrar una multa (POST /api/v1/tesoreria/multas).
// La factura relacionada es opcional; si se indica, se sugiere desde las facturas del asociado.
export default function RegistrarMultaModal({ open, onClose, onSaved }) {
  const { success, error, warning, info } = useToast();
  const [asociado, setAsociado] = useState(null);
  const [facturasAsociado, setFacturasAsociado] = useState([]);
  const [cargandoFacturas, setCargandoFacturas] = useState(false);
  const [facturaId, setFacturaId] = useState(null);
  const [independiente, setIndependiente] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [valor, setValor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAsociado(null);
      setFacturasAsociado([]);
      setFacturaId(null);
      setIndependiente(false);
      setMotivo('');
      setValor('');
    }
  }, [open]);

  useEffect(() => {
    if (!asociado) {
      setFacturasAsociado([]);
      setFacturaId(null);
      return;
    }
    setCargandoFacturas(true);
    FacturasAPI.listarPorAsociado(asociado.id)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        setFacturasAsociado(lista.filter((f) => f.estado !== 'ANULADA'));
      })
      .catch(() => setFacturasAsociado([]))
      .finally(() => setCargandoFacturas(false));
  }, [asociado]);

  const isDirty = Boolean(asociado || independiente || motivo.trim() || valor);
  const { confirming, requestClose, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  useLockBodyScroll(open, requestClose);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!asociado) {
      warning("Asociado requerido.", "Selecciona un asociado para aplicar la multa.");
      return;
    }
    if (!motivo.trim()) {
      warning("Motivo requerido.", "Describe la razón de la multa.");
      return;
    }
    if (!valor || Number(valor) <= 0) {
      warning("Valor inválido.", "El monto de la multa debe ser mayor a cero.");
      return;
    }

    setSubmitting(true);
    try {
      await TesoreriaAPI.registrarMulta({
        asociadoId: asociado.id,
        ...(independiente ? {} : { facturaId: facturaId || undefined }),
        motivo: motivo.trim(),
        valor: Number(valor),
        independiente,
      });
      success("Multa registrada.", "La multa quedó guardada en el sistema.");
      onSaved?.();
      onClose();
    } catch (err) {
      error(err.message || 'Error al registrar multa.', "No se pudo guardar la multa en el sistema.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={requestClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" /> Registrar multa
          </h3>
          <button onClick={requestClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-shell__body flex-1 p-5 overflow-y-auto overscroll-contain custom-scroll space-y-4">
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Asociado <span className="text-red-500">*</span>
            </label>
            <AsociadoPicker value={asociado} onChange={setAsociado} autoFocus />
          </div>

          <button
            type="button"
            onClick={() => {
              setIndependiente(!independiente);
              setFacturaId(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-left ${
              independiente
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-dark-muted text-gray-600 dark:text-gray-400 hover:border-gray-400'
            }`}
          >
            {independiente ? (
              <ToggleRight className="w-5 h-5 shrink-0 text-amber-500" />
            ) : (
              <ToggleLeft className="w-5 h-5 shrink-0 text-gray-400" />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold block">Multa independiente</span>
              <span className="text-[11px] opacity-70 block">
                Se paga aparte, no se une a ninguna factura
              </span>
            </div>
          </button>

          {asociado && !independiente && (
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                Factura relacionada <span className="text-gray-400">(opcional)</span>
              </label>
              {cargandoFacturas ? (
                <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando facturas…
                </div>
              ) : facturasAsociado.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">Este asociado no tiene facturas registradas.</p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setFacturaId(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      !facturaId
                        ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                        : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    Sin factura relacionada
                  </button>
                  {facturasAsociado.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFacturaId(f.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-between gap-2 ${
                        facturaId === f.id
                          ? 'bg-brand border-brand text-white'
                          : 'border-gray-200 dark:border-dark-muted text-gray-600 dark:text-gray-300 hover:border-brand'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 shrink-0" /> {f.numeroFactura}
                      </span>
                      <span className="shrink-0">{formatCOP(f.total)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="Describa el motivo de la multa"
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Valor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formatCOPInput(valor)}
              onChange={(e) => setValor(unformatCOP(e.target.value))}
              placeholder="Ingrese el valor"
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
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
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar multa{independiente ? ' independiente' : ''}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog open={confirming} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  );
}
