import { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  Search,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  Eye,
  EyeOff,
  Lock,
  X,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DatosImportantesAPI, TIPOS_DATO_CONFIG } from '../api/datosImportantes';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

const CASCADE_LABELS = {
  facturas: 'Facturas',
  conceptos: 'Conceptos adicionales',
  pagos: 'Pagos',
  recibos: 'Recibos',
  multas: 'Multas',
  lecturas: 'Lecturas',
  movimientos: 'Movimientos de tesorería',
  movimientosTesoreria: 'Movimientos de tesorería',
  notas_credito: 'Notas de crédito',
  medidores: 'Medidores',
  notificaciones: 'Notificaciones',
  cuentaVinculada: 'Cuenta de usuario vinculada',
  medidorDesvinculado: 'Medidor (solo se desvincula)',
  formularios: 'Formularios',
  preguntas: 'Preguntas',
  respuestas: 'Respuestas',
  mesesContables: 'Meses contables',
  aniosContables: 'Años contables',
  publicaciones: 'Publicaciones',
  conversacionesChat: 'Conversaciones de chat',
};

export default function DatosImportantes() {
  const { rol } = useAuth();
  const { success, error, warning } = useToast();
  const esAdmin = rol === 'ADMINISTRADOR';

  const [tipo, setTipo] = useState('');
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [selected, setSelected] = useState(null);
  const [verificacion, setVerificacion] = useState(null);

  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Para cuentas de usuario: pedir contraseña antes de listar
  const [listPassword, setListPassword] = useState('');
  const [mostrarListPassword, setMostrarListPassword] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  // Reiniciar numeración
  const [resetTipo, setResetTipo] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [mostrarResetPassword, setMostrarResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useLockBodyScroll(showConfirm || showPasswordPrompt);

  useEffect(() => {
    if (!tipo) {
      setItems([]);
      setSelected(null);
      setVerificacion(null);
      return;
    }
    const config = TIPOS_DATO_CONFIG[tipo];
    if (!config?.listFn) {
      setItems([]);
      return;
    }

    if (config.requiresPassword) {
      setShowPasswordPrompt(true);
      return;
    }

    cargarDatos(config.listFn);
  }, [tipo, cargarDatos]);

  const cargarDatos = async (listFn) => {
    setLoadingList(true);
    setItems([]);
    setSelected(null);
    setVerificacion(null);
    try {
      const data = await DatosImportantesAPI[listFn]();
      setItems(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      error(err.message || 'Error al cargar datos.', 'No se pudo obtener el listado del servidor.');
    } finally {
      setLoadingList(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!listPassword.trim()) {
      warning('Contraseña requerida.', 'Ingresa tu contraseña de administrador.');
      return;
    }
    setShowPasswordPrompt(false);
    setLoadingList(true);
    try {
      const data = await DatosImportantesAPI.listarUsuarios(listPassword);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      error(err.message || 'Contraseña incorrecta.', 'No se pudieron listar las cuentas de usuario.');
      setTipo('');
    } finally {
      setLoadingList(false);
    }
  };

  const config = tipo ? TIPOS_DATO_CONFIG[tipo] : null;

  const itemsFiltrados = useMemo(() => {
    if (!busqueda.trim() || !config) return items;
    const q = busqueda.toLowerCase();
    return items.filter((item) =>
      config.searchFields.some((field) => {
        const val = item[field];
        return val != null && String(val).toLowerCase().includes(q);
      }) || String(item.id).includes(q)
    );
  }, [items, busqueda, config]);

  const handleSelect = async (item) => {
    setSelected(item);
    setLoadingVerificar(true);
    setVerificacion(null);
    try {
      const data = await DatosImportantesAPI.verificar(tipo, item.id);
      setVerificacion(data);
    } catch (err) {
      error(err.message || 'Error al verificar registro.', 'No se pudo obtener la información del registro.');
    } finally {
      setLoadingVerificar(false);
    }
  };

  const handleEliminar = async () => {
    if (!password.trim()) {
      warning('Confirmación requerida.', 'Ingresa tu contraseña para eliminar.');
      return;
    }
    setEliminando(true);
    try {
      const res = await DatosImportantesAPI.eliminar(tipo, verificacion.id, password);
      const cascadaRes = res?.cascada || {};
      const detalles = Object.entries(cascadaRes)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${CASCADE_LABELS[k] || k}: ${v}`)
        .join(', ');
      success(
        `${verificacion.tipo} eliminado.`,
        detalles ? `También se eliminaron: ${detalles}` : 'El registro ha sido removido permanentemente.'
      );
      setShowConfirm(false);
      setVerificacion(null);
      setSelected(null);
      setPassword('');
      // Recargar la lista
      if (config?.listFn) {
        cargarDatos(config.listFn);
      }
    } catch (err) {
      if (err.status === 400 && err.data?.detalles?.length) {
        error(`Error: ${err.data.detalles[0]}`, 'El servidor detalló el problema con el registro.');
      } else {
        error(err.message || 'Error al eliminar registro.', 'No se pudo completar la eliminación.');
      }
    } finally {
      setEliminando(false);
    }
  };

  const cascadaEntries = verificacion?.cascada
    ? Object.entries(verificacion.cascada).filter(([, v]) => v > 0)
    : [];

  const RESET_CONFIG = {
    FACTURA: { label: 'Facturas', nombre: 'facturas' },
    RECIBO: { label: 'Recibos', nombre: 'recibos' },
    NOTA_CREDITO: { label: 'Notas de crédito', nombre: 'notas de crédito' },
    FORMULARIO: { label: 'Formularios', nombre: 'formularios' },
  };

  const handleResetNumeracion = async () => {
    if (!resetPassword.trim()) {
      warning('Contraseña requerida.', 'Ingresa tu contraseña para reiniciar.');
      return;
    }
    setResetLoading(true);
    try {
      await DatosImportantesAPI.reiniciarNumeracion(resetTipo, resetPassword);
      success('Numeración reiniciada.', `El contador de ${RESET_CONFIG[resetTipo].nombre} se ha puesto en 1.`);
      setShowResetConfirm(false);
      setResetPassword('');
      setResetTipo('');
    } catch (err) {
      error(err.message || 'Error al reiniciar numeración.', 'No se pudo completar la operación.');
    } finally {
      setResetLoading(false);
    }
  };

  if (!esAdmin) {
    return (
      <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
        <Header />
        <main className="pt-20 pb-10 px-4 max-w-3xl mx-auto text-center">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Acceso restringido</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Solo los administradores pueden gestionar datos importantes.
          </p>
        </main>
      </div>
    );
  }

  const getDisplayFields = (item) => {
    if (!config?.displayFields) return { principal: `ID ${item.id}`, secundario: '', extra: '' };
    return config.displayFields(item);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen font-sans antialiased">
      <Header />

      <main className="w-full max-w-3xl mx-auto pt-20 md:pt-24 pb-10 px-4 md:px-6">
        <div className="space-y-5">
          {/* Título */}
          <div className="flex items-center gap-3">
            <span className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-900/30">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white">Gestión de datos importantes</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Eliminación definitiva e irreversible de datos del sistema.
              </p>
            </div>
          </div>

          {/* Advertencia */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-700 dark:text-red-300">
              <p className="font-semibold">Acción irreversible</p>
              <p className="mt-1">
                Los datos eliminados no se pueden recuperar. Si el registro tiene
                historial asociado, este también se eliminará en cascada.
              </p>
            </div>
          </div>

          {/* Selector de tipo */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Tipo de dato a eliminar
            </label>
            <div className="relative">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm font-medium text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/40 appearance-none pr-10"
              >
                <option value="">Seleccionar tipo…</option>
                {Object.entries(TIPOS_DATO_CONFIG).map(([value, cfg]) => (
                  <option key={value} value={value}>{cfg.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Barra de búsqueda y lista */}
          {tipo && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl overflow-hidden">
              {loadingList ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando registros…
                </div>
              ) : items.length === 0 ? (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-12">
                  {config?.listFn ? 'No se encontraron registros.' : 'Este tipo no tiene listado disponible. Use la búsqueda por ID.'}
                </p>
              ) : (
                <>
                  <div className="p-3 border-b border-gray-100 dark:border-dark-muted">
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre, ID, documento…"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 px-1">
                      {itemsFiltrados.length} registro{itemsFiltrados.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-dark-muted">
                    {itemsFiltrados.map((item) => {
                      const display = getDisplayFields(item);
                      const isSelected = selected?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`w-full text-left px-4 py-3 transition-colors ${
                            isSelected
                              ? 'bg-red-50 dark:bg-red-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-dark-bg/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                                {display.principal}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {display.secundario}
                                {display.extra ? ` · ${display.extra}` : ''}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 shrink-0">
                              ID {item.id}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Resultado de la verificación */}
          {verificacion && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  verificacion.borrable
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-dark-muted text-gray-500'
                }`}>
                  {verificacion.tipo?.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 dark:text-white">
                    {verificacion.tipo} — {verificacion.referencia || `ID ${verificacion.id}`}
                  </p>
                  {verificacion.mensaje && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {verificacion.mensaje}
                    </p>
                  )}
                </div>
              </div>

              {cascadaEntries.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Se eliminará en cascada:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {cascadaEntries.map(([key, val]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-950 text-xs"
                      >
                        <span className="text-gray-600 dark:text-gray-300 truncate">
                          {CASCADE_LABELS[key] || key}
                        </span>
                        <span className="font-bold text-red-600 dark:text-red-400 ml-2">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {verificacion.motivosBloqueo?.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">No se puede eliminar:</p>
                  {verificacion.motivosBloqueo.map((m, i) => (
                    <p key={i} className="text-xs text-amber-600 dark:text-amber-400">{m}</p>
                  ))}
                </div>
              )}

              {verificacion.borrable && (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar definitivamente
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reiniciar numeración */}
        <div className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">Reiniciar numeración</h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Si borrate todos los registros de un tipo y quieres que la numeración empiece desde 1, usa este botón.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(RESET_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => { setResetTipo(key); setShowResetConfirm(true); }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-gray-700 dark:text-white text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Modal contraseña para listar cuentas */}
      {showPasswordPrompt && (
        <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowPasswordPrompt(false); setTipo(''); }} aria-hidden="true" />
          <div className="modal-shell__card relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease]">
            <div className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">
                Contraseña requerida
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Para listar las cuentas de usuario, confirma tu contraseña de administrador.
              </p>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type={mostrarListPassword ? 'text' : 'password'}
                  value={listPassword}
                  onChange={(e) => setListPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  autoFocus
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
                <button
                  type="button"
                  onClick={() => setMostrarListPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
                >
                  {mostrarListPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => { setShowPasswordPrompt(false); setTipo(''); setPassword(''); }}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={!listPassword.trim()}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-brand hover:bg-brand-dark text-white transition-all disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showConfirm && (
        <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} aria-hidden="true" />
          <div className="modal-shell__card relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]">
            <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-start shrink-0">
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-500" /> Confirmar eliminación
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Esta acción es permanente e irreversible.
                </p>
              </div>
              <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">
                <p className="font-semibold">Estás a punto de eliminar:</p>
                <p className="mt-1">{verificacion?.tipo} — {verificacion?.referencia || `ID ${verificacion?.id}`}</p>
                {cascadaEntries.length > 0 && (
                  <p className="mt-1 text-xs">
                    Incluye {cascadaEntries.reduce((sum, [, v]) => sum + v, 0)} registros en cascada.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  Tu contraseña (confirmación de seguridad)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
                  </div>
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña del administrador"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-shell__footer p-5 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950/40 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => { setShowConfirm(false); setPassword(''); }}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={eliminando || !password.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {eliminando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar reinicio de numeración */}
      {showResetConfirm && (
        <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowResetConfirm(false); setResetPassword(''); }} aria-hidden="true" />
          <div className="modal-shell__card relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease]">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-500" />
                  Reiniciar numeración
                </h3>
                <button onClick={() => { setShowResetConfirm(false); setResetPassword(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                El contador de <strong>{RESET_CONFIG[resetTipo]?.nombre}</strong> se pondrá en 1.
                Esta acción es segura si no hay registros de ese tipo.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  Tu contraseña (confirmación de seguridad)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
                  </div>
                  <input
                    type={mostrarResetPassword ? 'text' : 'password'}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Contraseña del administrador"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarResetPassword((v) => !v)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {mostrarResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-shell__footer p-5 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950/40 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => { setShowResetConfirm(false); setResetPassword(''); }}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetNumeracion}
                disabled={resetLoading || !resetPassword.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
