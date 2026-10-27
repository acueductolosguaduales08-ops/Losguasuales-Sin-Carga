import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Loader2, AlertTriangle, Calculator, CalendarRange, Gauge, Pencil, StickyNote, Droplet, DollarSign } from 'lucide-react';
import { LecturasAPI } from '../../api/lecturas';
import { MedidoresAPI } from '../../api/medidores';
import { ConfiguracionAPI } from '../../api/configuracion';
import { FacturasAPI } from '../../api/facturas';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import useConfirmClose from '../../hooks/useConfirmClose';
import ConfirmDialog from '../common/ConfirmDialog';
import MedidorPicker from './MedidorPicker';
import { formatCOP } from '../../utils/formatCOP';
import CalculadoraConsumoModal from './CalculadoraConsumoModal';

const inputCls =
  'w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors';

const labelCls = 'block text-sm text-gray-500 dark:text-gray-400 mb-1';

// Encabezado de sección reutilizable: numera cada paso del formulario para
// que sea evidente en qué orden llenarlo, en vez de un único bloque largo
// donde es fácil perderse o saltarse algo por error.
function SeccionHeader({ numero, icon: Icon, titulo, ayuda }) {
  return (
    <div className="flex items-start gap-2.5 mb-2.5">
      <span className="shrink-0 w-6 h-6 rounded-full bg-brand/15 text-brand dark:text-brand-light text-xs font-bold flex items-center justify-center mt-0.5">
        {numero}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-white">
          {Icon && <Icon className="w-4 h-4 text-brand shrink-0" />}
          <span>{titulo}</span>
        </div>
        {ayuda && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{ayuda}</p>}
      </div>
    </div>
  );
}

const initialForm = {
  medidorId: '',
  fechaLectura: '',
  lecturaActual: '',
  observaciones: '',
};

// Modal de registro / edición de lectura (POST /api/v1/lecturas, PUT /api/v1/lecturas/{id}).
export default function LecturaFormModal({
  open,
  lectura,
  mesContableId,
  mesLabel,
  lecturasDelMes = [],
  onClose,
  onSaved,
  onEditarExistente,
}) {
  const { success, error, warning, info } = useToast();
  const { rol } = useAuth();
  const esAdmin = rol === 'ADMINISTRADOR';
  // Generar factura de una vez al guardar la lectura (requiere 14_factura_por_lectura.sql).
  // ON por defecto solo para ADMIN: tesoreros registran lecturas sin facturar.
  const [generarFactura, setGenerarFactura] = useState(esAdmin);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [medidores, setMedidores] = useState([]);
  const [loadingMedidores, setLoadingMedidores] = useState(false);
  const [calculadoraOpen, setCalculadoraOpen] = useState(false);
  const [configuracion, setConfiguracion] = useState(null);

  // Lectura anterior manual: opcional. Por defecto el backend la calcula
  // solo (última lectura registrada del medidor); este campo es solo para
  // el caso de que se haya saltado un período y ese cálculo automático ya
  // no sea el correcto. Solo aplica al crear — al editar, el backend
  // ignora este campo (queda fijo desde el registro original).
  const [usarAnteriorManual, setUsarAnteriorManual] = useState(false);
  const [lecturaAnteriorManual, setLecturaAnteriorManual] = useState('');

  const esEdicion = !!lectura;
  const baselineRef = useRef(initialForm);

  useEffect(() => {
    if (!open) return;
    const base = lectura
      ? {
          medidorId: String(lectura.medidorId || ''),
          fechaLectura: lectura.fechaLectura || '',
          lecturaActual: lectura.lecturaActual != null ? String(lectura.lecturaActual) : '',
          observaciones: '',
        }
      : initialForm;
    setForm(base);
    baselineRef.current = base;
    setUsarAnteriorManual(false);
    setLecturaAnteriorManual('');
    setGenerarFactura(rol === 'ADMINISTRADOR');
  }, [open, lectura, rol]);

  useEffect(() => {
    if (!open) return;
    setLoadingMedidores(true);
    MedidoresAPI.listar()
      .then((data) => setMedidores(Array.isArray(data) ? data : data?.content || []))
      .catch(() => setMedidores([]))
      .finally(() => setLoadingMedidores(false));
    ConfiguracionAPI.obtener()
      .then((data) => setConfiguracion(data))
      .catch(() => setConfiguracion(null));
  }, [open]);

  const isDirty = open && JSON.stringify(form) !== JSON.stringify(baselineRef.current);
  const { confirming, requestClose, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  useLockBodyScroll(open, requestClose);

  const medidorSeleccionado = medidores.find((m) => String(m.id) === form.medidorId) || null;
  const lecturaAnteriorAutomatica = esEdicion ? lectura.lecturaAnterior : medidorSeleccionado?.ultimaLectura ?? null;

  // La que realmente se usa para calcular y para enviar: la manual (si el
  // usuario la activó y escribió algo) tiene prioridad sobre la automática
  // — mismo criterio que aplica el backend.
  const lecturaAnteriorEfectiva =
    usarAnteriorManual && lecturaAnteriorManual !== '' ? Number(lecturaAnteriorManual) : lecturaAnteriorAutomatica;

  // Set de medidorId (como string) que ya tienen lectura en este período,
  // para marcarlos en la lista del picker antes de que el usuario elija
  // uno por error. Excluye la propia lectura cuando se está editando.
  const medidoresConLecturaIds = useMemo(
    () =>
      new Set(
        lecturasDelMes
          .filter((l) => !esEdicion || l.id !== lectura.id)
          .map((l) => String(l.medidorId))
      ),
    [lecturasDelMes, esEdicion, lectura]
  );

  // ¿Ya existe una lectura de este medidor en el período seleccionado? Esta
  // es la comprobación que evita el error más común al registrar: crear una
  // segunda lectura para un medidor que ya tiene una este mismo mes. Se
  // excluye la propia lectura cuando se está editando (esa sí es la misma).
  const lecturaExistente = useMemo(() => {
    if (!form.medidorId) return null;
    return (
      lecturasDelMes.find(
        (l) => String(l.medidorId) === form.medidorId && (!esEdicion || l.id !== lectura.id)
      ) || null
    );
  }, [form.medidorId, lecturasDelMes, esEdicion, lectura]);

  if (!open) return null;

  // Consumo con los datos que se van a guardar: reacciona tanto a la
  // automática como a la manual (lo que el backend aclaró que hacía falta:
  // el cálculo en pantalla debe seguir también al valor escrito a mano, no
  // solo esperar la respuesta del servidor).
  const consumo =
    form.lecturaActual !== '' && lecturaAnteriorEfectiva != null
      ? Number(form.lecturaActual) - Number(lecturaAnteriorEfectiva)
      : null;
  const consumoNegativo = consumo != null && consumo < 0;

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.medidorId) {
      warning("Medidor requerido", "Debes seleccionar un medidor para continuar.");
      return;
    }
    if (lecturaExistente) {
      error("Lectura duplicada", "Este medidor ya tiene una lectura registrada en este período.");
      return;
    }
    if (!form.fechaLectura) {
      warning("Fecha requerida", "Debes seleccionar la fecha de la lectura.");
      return;
    }
    if (form.lecturaActual === '' || Number(form.lecturaActual) < 0) {
      warning("Lectura inválida", "La lectura actual debe ser un número positivo.");
      return;
    }
    if (consumoNegativo) {
      error("Consumo negativo", "La lectura actual no puede ser menor que la anterior.");
      return;
    }

    const payload = {
      medidorId: form.medidorId,
      mesContableId,
      fechaLectura: form.fechaLectura,
      lecturaActual: Number(form.lecturaActual),
      observaciones: form.observaciones || null,
    };
    // Solo se envía si el usuario la activó a mano y no estamos editando
    // (el backend ignora este campo en edición de todas formas).
    if (!esEdicion && usarAnteriorManual && lecturaAnteriorManual !== '') {
      payload.lecturaAnterior = Number(lecturaAnteriorManual);
    }

    setSubmitting(true);
    try {
      if (esEdicion) {
        await LecturasAPI.editar(lectura.id, payload);
        success("Lectura actualizada", "Los cambios se guardaron correctamente.");
      } else {
        const creada = await LecturasAPI.crear(payload);
        if (generarFactura && mesContableId && creada?.id) {
          // La lectura ya quedó guardada: si la factura falla, se avisa
          // con warning y el usuario puede reintentar desde Lecturas.
          try {
            const fac = await FacturasAPI.generarDeLectura(creada.id);
            if (fac.creada) {
              success("Lectura y factura generadas",
                `Factura ${fac.numero} por ${formatCOP(fac.total)}. Vence ${fac.fechaLimitePago || 'según configuración'}.`);
            } else {
              warning("Factura no generada",
                `La lectura quedó guardada, pero no se generó factura: ${fac.motivo || 'motivo desconocido'}.`);
            }
          } catch (facErr) {
            warning("Factura no generada",
              `La lectura quedó guardada. Error: ${facErr.message}`);
          }
        } else {
          success("Lectura registrada", "La lectura se guardó en el período actual.");
        }
      }
      onSaved?.();
      onClose();
    } catch (err) {
      error("Error al guardar", err.message || 'No se pudo guardar la lectura.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={requestClose} aria-hidden="true" />
      <div
        className="modal-shell__card relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lectura-modal-titulo"
      >
        <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted shrink-0">
          <div className="flex justify-between items-start gap-3">
            <h3 id="lectura-modal-titulo" className="text-lg font-bold text-gray-800 dark:text-white">
              {esEdicion ? 'Editar lectura' : 'Registrar lectura'}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setCalculadoraOpen(true)}
                title="Calculadora de consumo"
                aria-label="Abrir calculadora de consumo"
                className="text-gray-400 hover:text-brand dark:hover:text-brand-light transition-colors p-1"
              >
                <Calculator className="w-5 h-5" />
              </button>
              <button
                onClick={requestClose}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors p-1"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Período: badge grande y de alto contraste para que sea
              imposible no darse cuenta de para qué mes se está
              registrando — la confusión de mes es la causa más común de
              lecturas duplicadas. */}
          {mesLabel && (
            <div className="mt-2.5 inline-flex items-center gap-2 bg-brand/10 border border-brand/30 rounded-lg px-3 py-1.5">
              <CalendarRange className="w-4 h-4 text-brand shrink-0" />
              <span className="text-sm font-bold text-brand dark:text-brand-light">Período: {mesLabel}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modal-shell__body flex-1 p-5 space-y-5 overflow-y-auto overscroll-contain custom-scroll">
          {/* Paso 1: Medidor */}
          <div>
            <SeccionHeader
              numero={1}
              icon={Gauge}
              titulo="¿Qué medidor vas a leer?"
              ayuda="Busca por nombre del asociado o número de medidor."
            />
            <MedidorPicker
              medidores={medidores}
              value={form.medidorId}
              onChange={(id) => setForm((prev) => ({ ...prev, medidorId: id }))}
              loading={loadingMedidores}
              disabled={esEdicion}
              medidoresConLecturaIds={medidoresConLecturaIds}
            />

            {/* Advertencia de duplicado: esto es lo que evita el error más
                frecuente al registrar (crear dos lecturas del mismo medidor
                en el mismo mes). Aparece de inmediato al elegir el medidor,
                antes de que el usuario llene el resto del formulario. */}
            {lecturaExistente && (
              <div className="mt-2.5 flex items-start gap-2.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/40 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                    Este medidor ya tiene una lectura en {mesLabel}
                  </p>
                  <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">
                    Lectura actual registrada: {lecturaExistente.lecturaActual} m³ · Consumo:{' '}
                    {lecturaExistente.consumoM3} m³. No es posible registrar una segunda lectura para el mismo
                    medidor en el mismo período.
                  </p>
                  {onEditarExistente && (
                    <button
                      type="button"
                      onClick={() => {
                        onEditarExistente(lecturaExistente);
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:underline"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar esa lectura en su lugar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Paso 2: Datos de la lectura */}
          <div>
            <SeccionHeader numero={2} icon={CalendarRange} titulo="Datos de la lectura" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  Fecha de lectura <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.fechaLectura}
                  onChange={handleChange('fechaLectura')}
                  className={`${inputCls} [color-scheme:light] dark:[color-scheme:dark]`}
                />
              </div>
              <div>
                <label className={labelCls}>
                  Lectura actual (m³) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.lecturaActual}
                  onChange={handleChange('lecturaActual')}
                  placeholder="Ingrese la lectura actual"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Lectura anterior: automática por defecto, con opción manual
                para cuando se saltó un período y el último registro ya no
                refleja la lectura real anterior. Solo aplica al crear. */}
            {!esEdicion && (
              <div className="mt-3">
                {!usarAnteriorManual ? (
                  <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Lectura anterior:{' '}
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {lecturaAnteriorAutomatica != null ? `${lecturaAnteriorAutomatica} m³ (automática)` : 'sin registro previo'}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setUsarAnteriorManual(true)}
                      className="text-xs font-semibold text-brand dark:text-brand-light hover:underline shrink-0"
                    >
                      ¿Fue diferente?
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelCls + ' mb-0'}>Lectura anterior (manual)</label>
                      <button
                        type="button"
                        onClick={() => {
                          setUsarAnteriorManual(false);
                          setLecturaAnteriorManual('');
                        }}
                        className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        Usar automática
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={lecturaAnteriorManual}
                      onChange={(e) => setLecturaAnteriorManual(e.target.value)}
                      placeholder={`Automática: ${lecturaAnteriorAutomatica ?? '—'}`}
                      className={inputCls}
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Úsala solo si se saltó un período y el último registro ya no refleja la lectura real anterior.
                    </p>
                  </div>
                )}
              </div>
            )}

            {lecturaAnteriorAutomatica == null && form.medidorId && !usarAnteriorManual && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Sin lectura anterior registrada: se tomará como primera lectura del medidor.
              </p>
            )}

            {/* Consumo en vivo, siempre visible aquí (ya no depende de abrir
                la calculadora aparte): reacciona a la lectura actual y a
                cuál lectura anterior esté activa (automática o manual). */}
            {consumo != null && (
              <div className={`mt-3 flex items-center justify-between rounded-lg px-3 py-2 ${consumoNegativo ? 'bg-red-50 dark:bg-red-900/10' : 'bg-brand/10'}`}>
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${consumoNegativo ? 'text-red-600 dark:text-red-400' : 'text-brand dark:text-brand-light'}`}>
                  <Droplet className="w-3.5 h-3.5" /> Consumo de este registro
                </span>
                <span className={`text-sm font-bold ${consumoNegativo ? 'text-red-600 dark:text-red-400' : 'text-brand dark:text-brand-light'}`}>
                  {consumo} m³
                </span>
              </div>
            )}
            {consumoNegativo && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-red-500 mt-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                La lectura actual no puede ser menor que la lectura anterior ({lecturaAnteriorEfectiva} m³).
              </p>
            )}

            {/* Valor estimado a pagar: muestra el calculo en vivo basado en
                la configuracion actual (tarifa por m3 + cargo fijo admin). */}
            {consumo != null && consumo > 0 && configuracion && (
              <div className="mt-3 flex items-center justify-between rounded-lg px-3 py-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400">
                  <DollarSign className="w-3.5 h-3.5" /> Valor estimado a facturar
                </span>
                <span className="text-sm font-bold text-green-700 dark:text-green-400">
                  {formatCOP((() => {
                    const valorM3 = Number(configuracion.valorM3) || 0;
                    const cargoFijo = Number(configuracion.cargoFijoAdministracion) || 0;
                    const valorConsumo = consumo * valorM3;
                    return valorConsumo + cargoFijo;
                  })())}
                </span>
              </div>
            )}
            {consumo != null && consumo > 0 && configuracion && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                Consumo: {consumo} m³ × {formatCOP(configuracion.valorM3 || 0)} + cargo fijo {formatCOP(configuracion.cargoFijoAdministracion || 0)}
              </p>
            )}
          </div>

          {/* Paso 3: Observaciones */}
          <div>
            <SeccionHeader numero={3} icon={StickyNote} titulo="Observaciones" ayuda="Opcional." />
            <textarea
              value={form.observaciones}
              onChange={handleChange('observaciones')}
              placeholder="Notas sobre la visita o el estado del medidor…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Generar factura al guardar: el flujo operativo del acueducto
              es lectura → factura de una vez; el tesorero luego cobra
              una por una desde el Panel. Solo aplica al crear. */}
          {!esEdicion && mesContableId && (
            <label className="flex items-center gap-3 bg-brand/5 dark:bg-brand/10 border border-brand/20 rounded-xl px-3 py-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={generarFactura}
                onChange={(e) => setGenerarFactura(e.target.checked)}
                className="w-4 h-4 accent-brand shrink-0"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200 font-semibold">
                Generar factura al guardar
              </span>
              <span className="text-xs text-brand font-semibold ml-auto">Recomendado</span>
            </label>
          )}
        </form>

        <div className="modal-shell__footer p-5 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950/40 flex justify-end gap-3 shrink-0">
          <button
            onClick={requestClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || consumoNegativo || !!lecturaExistente}
            title={lecturaExistente ? 'Ya existe una lectura de este medidor en este período' : undefined}
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {esEdicion ? 'Guardar cambios' : 'Guardar lectura'}
          </button>
        </div>
      </div>

      <ConfirmDialog open={confirming} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
      <CalculadoraConsumoModal open={calculadoraOpen} onClose={() => setCalculadoraOpen(false)} />
    </div>
  );
}
