import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  History,
  Search,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldOff,
  User,
  Layers,
  Info,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuditoriaAPI } from '../api/auditoria';
import SimpleModal from '../components/encuestas/SimpleModal';

const PAGE_SIZE = 20;

const fmtFecha = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Heurística puramente visual: colorea la acción según palabras clave del texto libre que envía el backend.
const accionBadgeClass = (accion = '') => {
  const a = accion.toUpperCase();
  if (a.includes('ELIMIN') || a.includes('ARCHIV') || a.includes('DESACTIV') || a.includes('ANUL'))
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (a.includes('CREA') || a.includes('ACTIV') || a.includes('REABR'))
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (a.includes('EDIT') || a.includes('ACTUALIZ') || a.includes('CAMBI') || a.includes('CERR'))
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-gray-100 text-gray-600 dark:bg-dark-muted dark:text-gray-300';
};

export default function Auditoria() {
  const { rol, usuario } = useAuth();
  const { success, error, warning } = useToast();
  const esAdmin = rol === 'ADMINISTRADOR';

  // --- Estado de la auditoría (activa/inactiva) ---
  const [estadoActiva, setEstadoActiva] = useState(null);
  const [loadingEstado, setLoadingEstado] = useState(true);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  // --- Confirmación con nombre de usuario antes de activar/desactivar (lo exige la API) ---
  const [confirmAccion, setConfirmAccion] = useState(null); // 'activar' | 'desactivar' | null
  const [nombreConfirm, setNombreConfirm] = useState('');

  // --- Filtros ---
  const [modo, setModo] = useState('todos'); // 'todos' | 'modulo' | 'usuario'
  const [inputModulo, setInputModulo] = useState('');
  const [inputUsuario, setInputUsuario] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');

  // --- Listado paginado ---
  const [pageData, setPageData] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const cargarEstado = useCallback(() => {
    setLoadingEstado(true);
    AuditoriaAPI.obtenerEstado()
      .then((res) => setEstadoActiva(!!res?.activa))
      .catch((err) => error(err.message || 'Error al consultar estado de auditoría.', 'No se pudo verificar si la auditoría está activa.'))
      .finally(() => setLoadingEstado(false));
  }, [error]);

  const cargarRegistros = useCallback(
    (targetPage = 0) => {
      setLoading(true);
      const params = { page: targetPage, size: PAGE_SIZE, sort: 'fecha,desc' };
      const peticion =
        modo === 'modulo' && filtroModulo
          ? AuditoriaAPI.filtrarPorModulo(filtroModulo, params)
          : modo === 'usuario' && filtroUsuario
          ? AuditoriaAPI.filtrarPorUsuario(filtroUsuario, params)
          : AuditoriaAPI.listar(params);

      peticion
        .then((data) => {
          if (Array.isArray(data)) {
            setPageData({ content: data, totalPages: 1, totalElements: data.length, number: 0 });
          } else {
            setPageData(data);
          }
          setPage(targetPage);
        })
        .catch((err) => error(err.message || 'Error al cargar registros de auditoría.', 'No se pudieron obtener los registros del sistema.'))
        .finally(() => setLoading(false));
    },
    [modo, filtroModulo, filtroUsuario, error]
  );

  useEffect(() => {
    if (esAdmin) cargarEstado();
  }, [esAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (esAdmin) cargarRegistros(0);
  }, [esAdmin, modo, filtroModulo, filtroUsuario]); // eslint-disable-line react-hooks/exhaustive-deps

  const aplicarFiltroModulo = (e) => {
    e.preventDefault();
    setModo('modulo');
    setFiltroModulo(inputModulo.trim());
  };

  const aplicarFiltroUsuario = (e) => {
    e.preventDefault();
    setModo('usuario');
    setFiltroUsuario(inputUsuario.trim());
  };

  const limpiarFiltros = () => {
    setModo('todos');
    setInputModulo('');
    setInputUsuario('');
    setFiltroModulo('');
    setFiltroUsuario('');
  };

  const toggleAuditoria = () => {
    // La API exige "nombre" como query param tanto para activar como para desactivar.
    setNombreConfirm(usuario?.username || usuario?.nombre || '');
    setConfirmAccion(estadoActiva ? 'desactivar' : 'activar');
  };

  const confirmarCambioEstado = async (e) => {
    e.preventDefault();
    const nombre = nombreConfirm.trim();
    if (!nombre) return;
    setCambiandoEstado(true);
    try {
      if (confirmAccion === 'desactivar') {
        await AuditoriaAPI.desactivar(nombre);
        warning("Auditoría desactivada.", "Las acciones no se registrarán hasta que se reactive.");
        setEstadoActiva(false);
      } else {
        await AuditoriaAPI.activar(nombre);
        success("Auditoría activada.", "El sistema volverá a registrar todas las acciones.");
        setEstadoActiva(true);
      }
      setConfirmAccion(null);
      cargarRegistros(0);
    } catch (err) {
      error(err.message || 'Error al cambiar estado de auditoría.', 'No se pudo activar o desactivar la auditoría.');
    } finally {
      setCambiandoEstado(false);
    }
  };

  const registros = pageData?.content || [];
  const totalPages = pageData?.totalPages ?? 1;
  const totalElements = pageData?.totalElements ?? registros.length;

  const hayFiltroActivo = modo !== 'todos';

  const badgeEstado = useMemo(() => {
    if (loadingEstado) return { text: 'Consultando…', cls: 'bg-gray-100 text-gray-500 dark:bg-dark-muted dark:text-gray-400' };
    return estadoActiva
      ? { text: 'Activa', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }
      : { text: 'Desactivada', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  }, [loadingEstado, estadoActiva]);

  if (!esAdmin) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <History className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo el Administrador puede consultar el registro de auditoría del sistema.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        {/* Encabezado */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-brand shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Auditoría</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Módulo 13 · Historial de acciones realizadas en el sistema
              </p>
            </div>
          </div>

          <button
            onClick={toggleAuditoria}
            disabled={loadingEstado || cambiandoEstado}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 disabled:opacity-60 ${
              estadoActiva
                ? 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400'
                : 'bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/20'
            }`}
          >
            {cambiandoEstado ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : estadoActiva ? (
              <ShieldOff className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {estadoActiva ? 'Desactivar auditoría' : 'Reactivar auditoría'}
          </button>
        </section>

        {/* Estado actual */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-4 mb-4 flex items-center gap-3 flex-wrap">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${badgeEstado.cls}`}>{badgeEstado.text}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            {estadoActiva
              ? 'El sistema está registrando todas las acciones administrativas.'
              : 'El sistema no está registrando nuevas acciones en este momento.'}
          </span>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
          <form onSubmit={aplicarFiltroModulo} className="flex items-center gap-2 flex-grow sm:flex-grow-0 sm:w-56">
            <div className="relative flex-grow">
              <Layers className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={inputModulo}
                onChange={(e) => setInputModulo(e.target.value)}
                placeholder="Filtrar por módulo…"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={!inputModulo.trim()}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted text-gray-600 dark:text-gray-300 hover:text-brand disabled:opacity-40 shrink-0"
              aria-label="Filtrar por módulo"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          <form onSubmit={aplicarFiltroUsuario} className="flex items-center gap-2 flex-grow sm:flex-grow-0 sm:w-56">
            <div className="relative flex-grow">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={inputUsuario}
                onChange={(e) => setInputUsuario(e.target.value)}
                placeholder="Filtrar por usuario…"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={!inputUsuario.trim()}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted text-gray-600 dark:text-gray-300 hover:text-brand disabled:opacity-40 shrink-0"
              aria-label="Filtrar por usuario"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {hayFiltroActivo && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 ml-auto"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar filtros
              {modo === 'modulo' && filtroModulo ? ` (módulo: ${filtroModulo})` : ''}
              {modo === 'usuario' && filtroUsuario ? ` (usuario: ${filtroUsuario})` : ''}
            </button>
          )}
        </div>

        {/* Listado */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando registros de auditoría…</span>
          </div>
        )}

        {!loading && registros.length === 0 && (
          <div className="text-center py-16">
            <History className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {hayFiltroActivo ? 'Ningún registro coincide con el filtro aplicado.' : 'Aún no hay registros de auditoría.'}
            </p>
          </div>
        )}

        {!loading && registros.length > 0 && (
          <>
            {/* Tabla en pantallas medianas+ */}
            <div className="hidden md:block bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-950 text-left text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3 font-bold">Fecha</th>
                    <th className="px-4 py-3 font-bold">Usuario</th>
                    <th className="px-4 py-3 font-bold">Acción</th>
                    <th className="px-4 py-3 font-bold">Módulo</th>
                    <th className="px-4 py-3 font-bold">Registro afectado</th>
                    <th className="px-4 py-3 font-bold">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-muted">
                  {registros.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/60 transition-colors align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">{fmtFecha(r.fecha)}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white whitespace-nowrap">
                        {r.usuario || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${accionBadgeClass(r.accion)}`}>
                          {r.accion || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{r.modulo || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.registroAfectado || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs">{r.observaciones || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tarjetas en móvil */}
            <div className="md:hidden space-y-3">
              {registros.map((r) => (
                <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${accionBadgeClass(r.accion)}`}>
                      {r.accion || '—'}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">{fmtFecha(r.fecha)}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">{r.usuario || '—'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Módulo: <span className="font-medium text-gray-700 dark:text-gray-300">{r.modulo || '—'}</span>
                  </p>
                  {r.registroAfectado && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Registro: {r.registroAfectado}</p>
                  )}
                  {r.observaciones && <p className="text-xs text-gray-400 dark:text-gray-500">{r.observaciones}</p>}
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Página {page + 1} de {totalPages} · {totalElements} registros
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cargarRegistros(page - 1)}
                    disabled={page <= 0}
                    className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:text-brand"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => cargarRegistros(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:text-brand"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <SimpleModal
        open={!!confirmAccion}
        onClose={() => setConfirmAccion(null)}
        title={confirmAccion === 'desactivar' ? 'Desactivar auditoría' : 'Activar auditoría'}
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmAccion(null)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-confirmar-cambio-estado-auditoria"
              disabled={!nombreConfirm.trim() || cambiandoEstado}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${
                confirmAccion === 'desactivar' ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-brand-dark'
              }`}
            >
              {cambiandoEstado && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmAccion === 'desactivar' ? 'Desactivar' : 'Activar'}
            </button>
          </>
        }
      >
        <form id="form-confirmar-cambio-estado-auditoria" onSubmit={confirmarCambioEstado} className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {confirmAccion === 'desactivar'
              ? 'Mientras la auditoría esté desactivada, las acciones del sistema no quedarán registradas. Esta misma acción sí quedará registrada como último movimiento, así que debes confirmar tu nombre de usuario.'
              : 'Confirma tu nombre de usuario para reactivar el registro de auditoría.'}
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Nombre del usuario
            </label>
            <input
              type="text"
              autoFocus
              value={nombreConfirm}
              onChange={(e) => setNombreConfirm(e.target.value)}
              placeholder="Ingrese el nombre"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
            />
          </div>
        </form>
      </SimpleModal>
    </div>
  );
}
