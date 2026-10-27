import { useEffect, useState } from 'react';
import { X, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { TesoreriaAPI } from '../../api/tesoreria';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import useConfirmClose from '../../hooks/useConfirmClose';
import ConfirmDialog from '../common/ConfirmDialog';
import AsociadoPicker from './AsociadoPicker';
import MetodoPagoSelect from './MetodoPagoSelect';
import PeriodoPicker from './PeriodoPicker';
import { formatCOP, formatCOPInput, unformatCOP } from '../../utils/formatCOP';

const CONFIG = {
  ingreso: {
    titulo: 'Registrar ingreso',
    subtitulo: 'Donaciones, reconexiones, nuevas afiliaciones u otros ingresos (Regla 8.4).',
    icon: TrendingUp,
    color: 'bg-emerald-600 hover:bg-emerald-700',
    placeholderConcepto: 'Ej: Donación de material para tanque comunal',
    accion: (payload) => TesoreriaAPI.registrarIngreso(payload),
    exito: 'Ingreso registrado correctamente.',
  },
  gasto: {
    titulo: 'Registrar gasto',
    subtitulo: 'Servicios, materiales, reparaciones, personal u otros egresos (Regla 8.9).',
    icon: TrendingDown,
    color: 'bg-red-600 hover:bg-red-700',
    placeholderConcepto: 'Ej: Compra de tubería PVC 3 pulgadas',
    accion: (payload) => TesoreriaAPI.registrarGasto(payload),
    exito: 'Gasto registrado correctamente.',
  },
};

// Modal compartido para POST /api/v1/tesoreria/ingresos y /gastos (mismo request/response shape).
export default function RegistrarMovimientoModal({ open, tipo = 'ingreso', onClose, onSaved }) {
  const { success, error, warning, info } = useToast();
  const cfg = CONFIG[tipo] || CONFIG.ingreso;
  const Icon = cfg.icon;

  const [valor, setValor] = useState('');
  const [metodoPagoId, setMetodoPagoId] = useState(null);
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [asociado, setAsociado] = useState(null);
  const [mesContableId, setMesContableId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValor('');
      setMetodoPagoId(null);
      setConcepto('');
      setCategoria('');
      setObservaciones('');
      setComprobanteUrl('');
      setAsociado(null);
      setMesContableId(null);
    }
  }, [open, tipo]);

  const isDirty = Boolean(
    valor || metodoPagoId || concepto.trim() || categoria.trim() || observaciones.trim() || comprobanteUrl.trim() || asociado
  );
  const { confirming, requestClose, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  useLockBodyScroll(open, requestClose);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!concepto.trim()) {
      warning("Concepto requerido.", "Describe el motivo del movimiento.");
      return;
    }
    if (!valor || Number(valor) <= 0) {
      warning("Valor inválido.", "El monto del movimiento debe ser mayor a cero.");
      return;
    }
    if (!metodoPagoId) {
      warning("Método de pago requerido.", "Selecciona un método de pago para continuar.");
      return;
    }
    if (!mesContableId) {
      warning("Período requerido.", "Selecciona el mes contable del movimiento.");
      return;
    }

    setSubmitting(true);
    try {
      await cfg.accion({
        valor: Number(valor),
        metodoPagoId,
        concepto: concepto.trim(),
        categoria: categoria.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        asociadoId: asociado?.id || undefined,
        mesContableId,
        comprobanteUrl: comprobanteUrl.trim() || undefined,
      });
      success(cfg.exito, "El movimiento quedó guardado en el sistema.");
      onSaved?.();
      onClose();
    } catch (err) {
      error(err.message || `Error al registrar ${tipo}.`, "No se pudo guardar el movimiento en el sistema.");
    } finally {
      setSubmitting(false);
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
            <Icon className="w-5 h-5 text-brand" /> {cfg.titulo}
          </h3>
          <button onClick={requestClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-shell__body flex-1 p-5 overflow-y-auto overscroll-contain custom-scroll space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{cfg.subtitulo}</p>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Concepto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={200}
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder={cfg.placeholderConcepto}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Categoría</label>
              <input
                type="text"
                maxLength={60}
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Opcional"
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Método de pago <span className="text-red-500">*</span>
            </label>
            <MetodoPagoSelect value={metodoPagoId} onChange={setMetodoPagoId} />
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">
              Período contable <span className="text-red-500">*</span>
            </label>
            <PeriodoPicker value={mesContableId} onChange={setMesContableId} />
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Asociado relacionado <span className="text-gray-400">(opcional)</span>
            </label>
            <AsociadoPicker value={asociado} onChange={setAsociado} placeholder="Solo si el movimiento aplica a un asociado…" />
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

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              URL de comprobante <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={comprobanteUrl}
              onChange={(e) => setComprobanteUrl(e.target.value)}
              placeholder="https://…"
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
              className={`px-4 py-2 rounded-lg disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2 ${cfg.color}`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {cfg.titulo}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog open={confirming} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  );
}
