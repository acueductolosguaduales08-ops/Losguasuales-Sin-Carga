import { useEffect, useMemo, useState } from 'react';
import { Receipt, Loader2, Search, History, UserRound } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RecibosAPI } from '../api/recibos';
import { MisFinanzasAPI } from '../api/misFinanzas';
import { AsociadosAPI } from '../api/asociados';
import ReciboCard from '../components/recibos/ReciboCard';
import NotificarModal from '../components/notificarDocumento/NotificarModal';
import HistorialNotificacionesModal from '../components/notificarDocumento/HistorialNotificacionesModal';
import Pagination from '../components/common/Pagination';
import DownloadCsvButton from '../components/common/DownloadCsvButton';
import { prepararRecibosParaExportar } from '../utils/exportarExcel';
import usePagination from '../hooks/usePagination';

const TABS = [
  { value: 'todos', label: 'Todos' },
  { value: 'asociado', label: 'Por asociado' },
  { value: 'buscar', label: 'Búsqueda directa' },
];

export default function Recibos() {
  const { rol, usuario } = useAuth();
  const { error, warning } = useToast();
  const esGestor = rol === 'ADMINISTRADOR' || rol === 'TESORERO';
  const esAsociado = rol === 'ASOCIADO';

  const [tab, setTab] = useState(esAsociado ? 'asociado' : 'todos');
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busquedaRecibo, setBusquedaRecibo] = useState('');

  // Búsqueda de asociado para la pestaña "Por asociado"
  const [busquedaAsociado, setBusquedaAsociado] = useState('');
  const [asociadosEncontrados, setAsociadosEncontrados] = useState([]);
  const [buscandoAsociados, setBuscandoAsociados] = useState(false);
  const [asociadoSeleccionado, setAsociadoSeleccionado] = useState(null);

  // Búsqueda directa por número de recibo
  const [numeroBusqueda, setNumeroBusqueda] = useState('');
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
  const [buscandoNumero, setBuscandoNumero] = useState(false);

  const [notificarOpen, setNotificarOpen] = useState(false);
  const [reciboNotificar, setReciboNotificar] = useState(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [soloMultas, setSoloMultas] = useState(false);

  const handleNotificar = (recibo) => {
    setReciboNotificar(recibo);
    setNotificarOpen(true);
  };

  // Un asociado ve automáticamente sus propios recibos.
  useEffect(() => {
    if (!esAsociado || !usuario?.asociadoId) return;
    setLoading(true);
    MisFinanzasAPI.listarMisRecibos()
      .then((data) => setRecibos(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => error("Error al cargar recibos.", err.message || "Verifica tu conexión o inicia sesión de nuevo."))
      .finally(() => setLoading(false));
  }, [esAsociado, usuario]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar recibos por asociado seleccionado (solo gestores)
  useEffect(() => {
    if (!esGestor || tab !== 'asociado' || !asociadoSeleccionado) {
      setRecibos([]);
      return;
    }
    setLoading(true);
    RecibosAPI.listarPorAsociado(asociadoSeleccionado.id)
      .then((data) => setRecibos(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => error("Error al cargar recibos.", err.message || "Selecciona un asociado válido o contacta al administrador."))
      .finally(() => setLoading(false));
  }, [esGestor, tab, asociadoSeleccionado]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar todos los recibos (solo gestores, pestaña "Todos")
  useEffect(() => {
    if (!esGestor || tab !== 'todos') return;
    setLoading(true);
    RecibosAPI.listarTodos()
      .then((data) => setRecibos(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => error("Error al cargar recibos.", err.message || "Verifica tu conexión o contacta al administrador."))
      .finally(() => setLoading(false));
  }, [esGestor, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Búsqueda de asociados con debounce
  useEffect(() => {
    if (tab !== 'asociado' || !busquedaAsociado.trim() || esAsociado) {
      setAsociadosEncontrados([]);
      return;
    }
    setBuscandoAsociados(true);
    const t = setTimeout(() => {
      AsociadosAPI.buscar(busquedaAsociado.trim())
        .then((data) => setAsociadosEncontrados(Array.isArray(data) ? data : data?.content || []))
        .catch(() => setAsociadosEncontrados([]))
        .finally(() => setBuscandoAsociados(false));
    }, 350);
    return () => clearTimeout(t);
  }, [busquedaAsociado, tab, esAsociado]);

  const recibosFiltrados = useMemo(() => {
    let resultado = recibos;
    if (soloMultas) {
      resultado = resultado.filter((r) => !r.numeroFactura);
    }
    const texto = busquedaRecibo.trim().toLowerCase();
    if (!texto) return resultado;
    return resultado.filter((r) => {
      const numero = String(r.numeroRecibo || '').toLowerCase();
      const asociado = String(r.asociadoNombre || '').toLowerCase();
      const factura = String(r.numeroFactura || '').toLowerCase();
      return numero.includes(texto) || asociado.includes(texto) || factura.includes(texto);
    });
  }, [recibos, busquedaRecibo, soloMultas]);

  const recPag = usePagination(recibosFiltrados, 12);

  const handleBuscarPorNumero = async () => {
    const numero = numeroBusqueda.trim();
    if (!numero) return;
    setBuscandoNumero(true);
    setResultadoBusqueda(null);
    try {
      const data = await RecibosAPI.buscarPorNumero(numero);
      if (data) {
        setResultadoBusqueda(data);
      } else {
        warning("Recibo no encontrado.", "Verifica el número e intenta con otro dato de búsqueda.");
      }
    } catch (err) {
      error("Recibo no encontrado.", err.message || "Verifica el número e inténtalo de nuevo.");
    } finally {
      setBuscandoNumero(false);
    }
  };

  if (!esGestor && !esAsociado) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <Receipt className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">No tienes permisos para consultar este módulo.</p>
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
            <Receipt className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Recibos</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Módulo 9 · {esAsociado ? 'Comprobantes de tus pagos' : 'Comprobantes de pago generados por tesorería'}
              </p>
            </div>
          </div>
          {esGestor && (
            <div className="flex items-center gap-2">
              <DownloadCsvButton
                data={recibos}
                preparar={prepararRecibosParaExportar}
                filename="recibos"
                label="Descargar CSV"
              />
              <button
                onClick={() => setHistorialOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-dark-muted text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-muted/40 transition-colors shrink-0"
              >
                <History className="w-4 h-4" /> Historial de notificaciones
              </button>
            </div>
          )}
        </section>

        {/* Pestañas (solo gestores) */}
        {esGestor && (
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTab(t.value);
                  setBusquedaRecibo('');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  tab === t.value
                    ? 'bg-emerald-600 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-500 text-white'
                    : 'border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-emerald-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Pestaña: Por asociado */}
        {tab === 'asociado' && !esAsociado && (
          <div className="mb-6 space-y-3">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busquedaAsociado}
                onChange={(e) => {
                  setBusquedaAsociado(e.target.value);
                  setAsociadoSeleccionado(null);
                }}
                placeholder="Buscar asociado por documento, nombre o teléfono…"
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 dark:text-white"
              />
            </div>

            {buscandoAsociados && (
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando…
              </div>
            )}

            {!asociadoSeleccionado && asociadosEncontrados.length > 0 && (
              <div className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-lg divide-y divide-gray-200 dark:divide-dark-muted overflow-hidden">
                {asociadosEncontrados.slice(0, 6).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setAsociadoSeleccionado(a);
                      setBusquedaAsociado(`${a.nombres} ${a.apellidos}`);
                      setAsociadosEncontrados([]);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors flex items-center gap-2"
                  >
                    <UserRound className="w-4 h-4 text-emerald-600/70 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 dark:text-white truncate">
                        {a.nombres} {a.apellidos}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">{a.documento}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {asociadoSeleccionado && (
              <div className="max-w-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
                  {asociadoSeleccionado.nombres} {asociadoSeleccionado.apellidos}
                </span>
                <button
                  onClick={() => {
                    setAsociadoSeleccionado(null);
                    setBusquedaAsociado('');
                    setRecibos([]);
                  }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pestaña: Búsqueda directa por número */}
        {tab === 'buscar' && esGestor && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-4 mb-6">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Buscar por número de recibo
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={numeroBusqueda}
                  onChange={(e) => setNumeroBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscarPorNumero()}
                  placeholder="Ingrese el número de recibo"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 dark:text-white"
                />
              </div>
              <button
                onClick={handleBuscarPorNumero}
                disabled={!numeroBusqueda.trim() || buscandoNumero}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              >
                {buscandoNumero ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Buscar
              </button>
            </div>

            {resultadoBusqueda && (
              <div className="mt-4">
                <ReciboCard recibo={resultadoBusqueda} onNotificar={handleNotificar} />
              </div>
            )}
          </div>
        )}

        {/* Indicador de carga */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando recibos…</span>
          </div>
        )}

        {/* Mensaje cuando no hay selección */}
        {!loading && tab === 'asociado' && !esAsociado && !asociadoSeleccionado && (
          <div className="text-center py-16">
            <Receipt className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Busca y selecciona un asociado para ver su historial de recibos.</p>
          </div>
        )}

        {/* Barra de búsqueda (solo cuando hay recibos) */}
        {!loading && recibos.length > 0 && tab !== 'buscar' && (
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busquedaRecibo}
                onChange={(e) => setBusquedaRecibo(e.target.value)}
                placeholder="Buscar por número de recibo, factura o nombre…"
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 dark:text-white"
              />
            </div>
            <button
              onClick={() => setSoloMultas(!soloMultas)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors shrink-0 ${
                soloMultas
                  ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                  : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dark-muted hover:bg-gray-50 dark:hover:bg-dark-muted/40'
              }`}
            >
              Solo multas
            </button>
          </div>
        )}

        {/* Sin resultados */}
        {!loading && (esAsociado || (tab === 'asociado' && asociadoSeleccionado) || (tab === 'todos' && esGestor)) && recibos.length === 0 && (
          <div className="text-center py-16">
            <Receipt className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {esAsociado ? 'Aún no tienes recibos generados.' : 'No hay recibos para mostrar con este filtro.'}
            </p>
          </div>
        )}

        {/* Resultados de búsqueda sin coincidencias */}
        {!loading && recibos.length > 0 && recibosFiltrados.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Ningún recibo coincide con la búsqueda.</p>
          </div>
        )}

        {/* Lista de recibos */}
        {!loading && recibosFiltrados.length > 0 && (
          <>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              {recibosFiltrados.length} recibo{recibosFiltrados.length === 1 ? '' : 's'} encontrado{recibosFiltrados.length === 1 ? '' : 's'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recPag.paginatedItems.map((r) => (
                <ReciboCard key={r.id} recibo={r} onNotificar={esGestor ? handleNotificar : undefined} />
              ))}
            </div>
            <Pagination currentPage={recPag.page} totalPages={recPag.totalPages} onPageChange={recPag.goToPage} />
          </>
        )}
      </main>

      <NotificarModal
        open={notificarOpen}
        onClose={() => setNotificarOpen(false)}
        tipo="RECIBO"
        documento={reciboNotificar}
        documentoId={reciboNotificar?.id}
        documentoNumero={reciboNotificar?.numeroRecibo}
        asociadoId={asociadoSeleccionado?.id}
        asociadoNombre={reciboNotificar?.asociadoNombre || (asociadoSeleccionado ? `${asociadoSeleccionado.nombres} ${asociadoSeleccionado.apellidos}` : undefined)}
      />
      <HistorialNotificacionesModal open={historialOpen} onClose={() => setHistorialOpen(false)} tipoDocumento="RECIBO" />
    </div>
  );
}
