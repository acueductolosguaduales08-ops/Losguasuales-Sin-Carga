import { useEffect, useRef, useState } from 'react';
import { X, Loader2, Gauge } from 'lucide-react';
import { AsociadosAPI, TIPOS_DOCUMENTO } from '../../api/asociados';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import useConfirmClose from '../../hooks/useConfirmClose';
import ConfirmDialog from '../common/ConfirmDialog';
import SeleccionarMedidorModal from './SeleccionarMedidorModal';

const inputCls =
  'w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors';

const labelCls = 'block text-sm text-gray-500 dark:text-gray-400 mb-1';

const TIPO_DOC_LABEL = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  TI: 'Tarjeta de identidad',
  NIT: 'NIT',
  PASAPORTE: 'Pasaporte',
};

const initialForm = {
  tipoDocumento: 'CC',
  documento: '',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  telefonoPrincipal: '',
  telefonoAlternativo: '',
  correo: '',
  direccion: '',
  barrioVereda: '',
  observaciones: '',
  numeroMedidor: '',
  fechaAfiliacion: '',
};

// Modal de creación / edición de asociado (POST /api/v1/asociados, PUT /api/v1/asociados/{id}).
export default function AsociadoFormModal({ open, asociado, onClose, onSaved }) {
  const { success, error, warning, info } = useToast();
  const [form, setForm] = useState(initialForm);
  const [medidorElegido, setMedidorElegido] = useState(null);
  const [seleccionarMedidorOpen, setSeleccionarMedidorOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const baselineRef = useRef(initialForm);

  const esEdicion = !!asociado;

  useEffect(() => {
    if (!open) return;
    const base = asociado
      ? {
          tipoDocumento: asociado.tipoDocumento || 'CC',
          documento: asociado.documento || '',
          nombres: asociado.nombres || '',
          apellidos: asociado.apellidos || '',
          fechaNacimiento: asociado.fechaNacimiento || '',
          telefonoPrincipal: asociado.telefonoPrincipal || '',
          telefonoAlternativo: asociado.telefonoAlternativo || '',
          correo: asociado.correo || '',
          direccion: asociado.direccion || '',
          barrioVereda: asociado.barrioVereda || '',
          observaciones: asociado.observaciones || '',
          numeroMedidor: asociado.numeroMedidor || '',
          fechaAfiliacion: asociado.fechaAfiliacion || '',
        }
      : initialForm;
    setForm(base);
    baselineRef.current = base;
    setMedidorElegido(null);
  }, [open, asociado]);

  const isDirty = open && JSON.stringify(form) !== JSON.stringify(baselineRef.current);
  const { confirming, requestClose, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  useLockBodyScroll(open, requestClose);

  if (!open) return null;

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.documento.trim() || !form.nombres.trim() || !form.apellidos.trim()) {
      warning("Campos obligatorios.", "Documento, nombres y apellidos son requeridos.");
      return;
    }
    if (!form.direccion.trim()) {
      warning("Campos obligatorios.", "La dirección es un campo requerido.");
      return;
    }
    if (!form.numeroMedidor.trim()) {
      warning("Campos obligatorios.", "Debes seleccionar un medidor.");
      return;
    }

    const payload = {
      tipoDocumento: form.tipoDocumento,
      documento: form.documento.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      fechaNacimiento: form.fechaNacimiento || null,
      telefonoPrincipal: form.telefonoPrincipal.trim() || 'N/A',
      telefonoAlternativo: form.telefonoAlternativo.trim() || null,
      correo: form.correo.trim() || null,
      direccion: form.direccion.trim(),
      barrioVereda: form.barrioVereda.trim() || null,
      observaciones: form.observaciones.trim() || null,
      numeroMedidor: form.numeroMedidor.trim(),
      fechaAfiliacion: form.fechaAfiliacion || null,
    };

    setSubmitting(true);
    try {
      if (esEdicion) {
        await AsociadosAPI.editar(asociado.id, payload);
        success("Asociado actualizado.", "Los datos del asociado se guardaron exitosamente.");
      } else {
        await AsociadosAPI.crear(payload);
        success("Asociado creado.", "El nuevo asociado fue registrado correctamente.");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      const detalle = err?.data?.detalles?.length ? '\n' + err.data.detalles.join('\n') : '';
      error("Error al guardar.", (err.message || 'No se pudo guardar el asociado.') + detalle);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={requestClose} aria-hidden="true" />
      <div className="modal-shell__card relative w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            {esEdicion ? 'Editar asociado' : 'Registrar nuevo asociado'}
          </h3>
          <button
            onClick={requestClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-shell__body flex-1 p-5 space-y-4 overflow-y-auto overscroll-contain custom-scroll">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>
                Tipo doc. <span className="text-red-500">*</span>
              </label>
              <select value={form.tipoDocumento} onChange={handleChange('tipoDocumento')} className={inputCls}>
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t} value={t}>
                    {t} — {TIPO_DOC_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>
                Número de documento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.documento}
                onChange={handleChange('documento')}
                placeholder="Escriba el documento"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Nombres <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.nombres}
                onChange={handleChange('nombres')}
                placeholder="Ingrese el nombre"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.apellidos}
                onChange={handleChange('apellidos')}
                placeholder="Ingrese el apellido"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Teléfono principal</label>
              <input
                type="text"
                value={form.telefonoPrincipal}
                onChange={handleChange('telefonoPrincipal')}
                placeholder="Ingrese el teléfono (opcional)"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Teléfono alternativo</label>
              <input
                type="text"
                value={form.telefonoAlternativo}
                onChange={handleChange('telefonoAlternativo')}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Correo</label>
              <input
                type="email"
                value={form.correo}
                onChange={handleChange('correo')}
                placeholder="Ingrese el correo"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Fecha de nacimiento</label>
              <input
                type="date"
                value={form.fechaNacimiento}
                onChange={handleChange('fechaNacimiento')}
                className={`${inputCls} [color-scheme:light] dark:[color-scheme:dark]`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Dirección <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.direccion}
                onChange={handleChange('direccion')}
                placeholder="Ingrese la dirección"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Barrio / Vereda</label>
              <input
                type="text"
                value={form.barrioVereda}
                onChange={handleChange('barrioVereda')}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Medidor <span className="text-red-500">*</span>
              </label>
              {form.numeroMedidor ? (
                <div className="flex items-center justify-between gap-2 bg-brand/10 border border-brand/30 rounded-lg px-4 py-2 h-[42px]">
                  <div className="min-w-0 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-brand shrink-0" />
                    <span className="text-sm font-semibold text-brand dark:text-brand-light truncate">
                      Nº {form.numeroMedidor}
                      {medidorElegido?.ubicacion && (
                        <span className="font-normal text-brand/70 dark:text-brand-light/70"> · {medidorElegido.ubicacion}</span>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMedidorElegido(null);
                      setForm((prev) => ({ ...prev, numeroMedidor: '' }));
                    }}
                    className="shrink-0 text-brand hover:text-brand-dark dark:text-brand-light"
                    aria-label="Deseleccionar medidor"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSeleccionarMedidorOpen(true)}
                  className="w-full flex items-center justify-center gap-2 h-[42px] rounded-lg border border-dashed border-gray-300 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:border-brand hover:text-brand transition-colors text-sm font-semibold"
                >
                  <Gauge className="w-4 h-4" /> Elegir medidor
                </button>
              )}
            </div>
            <div>
              <label className={labelCls}>Fecha de afiliación</label>
              <input
                type="date"
                value={form.fechaAfiliacion}
                onChange={handleChange('fechaAfiliacion')}
                className={`${inputCls} [color-scheme:light] dark:[color-scheme:dark]`}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={handleChange('observaciones')}
              placeholder="Notas adicionales sobre el asociado…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
        </form>

        <div className="p-5 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950/40 flex justify-end gap-3 shrink-0">
          <button
            onClick={requestClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {esEdicion ? 'Guardar cambios' : 'Guardar asociado'}
          </button>
        </div>
      </div>

      <ConfirmDialog open={confirming} onConfirm={confirmDiscard} onCancel={cancelDiscard} />

      <SeleccionarMedidorModal
        open={seleccionarMedidorOpen}
        onClose={() => setSeleccionarMedidorOpen(false)}
        onSeleccionar={(medidor) => {
          setMedidorElegido(medidor);
          setForm((prev) => ({ ...prev, numeroMedidor: String(medidor.numero) }));
          setSeleccionarMedidorOpen(false);
        }}
      />
    </div>
  );
}
