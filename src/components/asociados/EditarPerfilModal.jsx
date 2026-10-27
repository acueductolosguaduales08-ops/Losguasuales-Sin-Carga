import { useEffect, useRef, useState } from 'react';
import { X, Loader2, User } from 'lucide-react';
import { AsociadosAPI, TIPOS_DOCUMENTO } from '../../api/asociados';
import { AuthAPI } from '../../api/auth';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import useConfirmClose from '../../hooks/useConfirmClose';
import ConfirmDialog from '../common/ConfirmDialog';

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
  fechaNacimiento: '',
  telefonoPrincipal: '',
  telefonoAlternativo: '',
  correo: '',
  direccion: '',
  barrioVereda: '',
};

export default function EditarPerfilModal({ open, onClose }) {
  const { success, error, warning, info } = useToast();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const baselineRef = useRef(initialForm);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    AuthAPI.perfil()
      .then((perfil) => {
        if (!perfil?.asociadoId) return;
        return AsociadosAPI.obtener(perfil.asociadoId);
      })
      .then((asociado) => {
        if (!asociado) return;
        const base = {
          tipoDocumento: asociado.tipoDocumento || 'CC',
          documento: asociado.documento || '',
          fechaNacimiento: asociado.fechaNacimiento || '',
          telefonoPrincipal: asociado.telefonoPrincipal || '',
          telefonoAlternativo: asociado.telefonoAlternativo || '',
          correo: asociado.correo || '',
          direccion: asociado.direccion || '',
          barrioVereda: asociado.barrioVereda || '',
        };
        setForm(base);
        baselineRef.current = base;
      })
      .catch((err) => {
        error("Error al cargar.", err.message || 'No se pudieron obtener tus datos.');
      })
      .finally(() => setLoading(false));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = open && JSON.stringify(form) !== JSON.stringify(baselineRef.current);
  const { confirming, requestClose, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  useLockBodyScroll(open, requestClose);

  if (!open) return null;

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.documento.trim()) {
      warning("Campos obligatorios.", "El número de documento es requerido.");
      return;
    }
    if (!form.direccion.trim()) {
      warning("Campos obligatorios.", "La dirección es un campo requerido.");
      return;
    }

    const payload = {
      tipoDocumento: form.tipoDocumento,
      documento: form.documento.trim(),
      fechaNacimiento: form.fechaNacimiento || null,
      telefonoPrincipal: form.telefonoPrincipal.trim() || null,
      telefonoAlternativo: form.telefonoAlternativo.trim() || null,
      correo: form.correo.trim() || null,
      direccion: form.direccion.trim(),
      barrioVereda: form.barrioVereda.trim() || null,
    };

    setSubmitting(true);
    try {
      await AuthAPI.editarPerfilDatos(payload);
      success("Perfil actualizado.", "Tus datos personales se guardaron exitosamente.");
      onClose();
    } catch (err) {
      error("Error al guardar.", err.message || 'No se pudieron actualizar tus datos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={requestClose} aria-hidden="true" />
      <div
        className="modal-shell__card relative w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-brand" /> Editar mis datos personales
          </h3>
          <button
            onClick={requestClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando tus datos…</span>
          </div>
        ) : (
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
                <label className={labelCls}>Fecha de nacimiento</label>
                <input
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={handleChange('fechaNacimiento')}
                  className={`${inputCls} [color-scheme:light] dark:[color-scheme:dark]`}
                />
              </div>
              <div>
                <label className={labelCls}>Correo electrónico</label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={handleChange('correo')}
                  placeholder="correo@ejemplo.com"
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
                  placeholder="Ingrese el teléfono"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Teléfono alternativo</label>
                <input
                  type="text"
                  value={form.telefonoAlternativo}
                  onChange={handleChange('telefonoAlternativo')}
                  placeholder="Opcional"
                  className={inputCls}
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
                  placeholder="Opcional"
                  className={inputCls}
                />
              </div>
            </div>
          </form>
        )}

        {!loading && (
          <div className="p-5 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950/40 flex justify-end gap-3 shrink-0">
            <button
              onClick={requestClose}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || loading}
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar cambios
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog open={confirming} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  );
}
