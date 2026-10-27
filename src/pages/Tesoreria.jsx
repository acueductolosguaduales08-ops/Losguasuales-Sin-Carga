import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wallet,
  Loader2,
  RefreshCw,
  Wallet2,
  TrendingUp,
  TrendingDown,
  Scale,
  Hash,
  ShieldAlert,
  ListChecks,
  Target,
  CheckCircle2,
  Search,
  AlertTriangle,
  Clock,
  BadgeDollarSign,
  Split,
  QrCode,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TesoreriaAPI } from '../api/tesoreria';
import { EstadisticasAPI } from '../api/estadisticas';
import { FacturasAPI } from '../api/facturas';
import RegistrarPagoModal from '../components/tesoreria/RegistrarPagoModal';
import RegistrarMovimientoModal from '../components/tesoreria/RegistrarMovimientoModal';
import RegistrarMultaModal from '../components/tesoreria/RegistrarMultaModal';
import MultasAsociadoModal from '../components/tesoreria/MultasAsociadoModal';
import AnularMovimientoModal from '../components/tesoreria/AnularMovimientoModal';
import MovimientoReciboModal from '../components/tesoreria/MovimientoReciboModal';
import MovimientoRow from '../components/tesoreria/MovimientoRow';
import Pagination from '../components/common/Pagination';
import DownloadCsvButton from '../components/common/DownloadCsvButton';
import { prepararMovimientosParaExportar } from '../utils/exportarExcel';
import usePagination from '../hooks/usePagination';
import HistorialNotificacionesModal from '../components/notificarDocumento/HistorialNotificacionesModal';
import PageHeader from '../components/ui/PageHeader';
import StatPanel from '../components/ui/StatPanel';
import { formatCOP } from '../utils/formatCOP';

const TABS = [
  { value: 'todos', label: 'Todos los movimientos' },
  { value: 'ENTRADA', label: 'Entradas' },
  { value: 'SALIDA', label: 'Salidas' },
];

function ProgressBar({ progress, colorClass, label, value }) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-bold text-gray-800 dark:text-white">{value}</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-dark-muted h-2.5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Tesoreria() {
  const { rol } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const esAdmin = rol === 'ADMINISTRADOR';
  const puedeGestionar = esAdmin || rol === 'TESORERO';

  const [caja, setCaja] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [facturasParciales, setFacturasParciales] = useState(null);
  const [multasEstadisticas, setMultasEstadisticas] = useState(null);
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const [tab, setTab] = useState('todos');
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoMov, setCargandoMov] = useState(false);
  const [totalMov, setTotalMov] = useState(null);

  const [expanded, setExpanded] = useState(false);

  const [pagoOpen, setPagoOpen] = useState(false);
  const [facturaIdInicial, setFacturaIdInicial] = useState(null);
  const [movModalOpen, setMovModalOpen] = useState(false);
  const [movModalTipo, setMovModalTipo] = useState('ingreso');
  const [multaOpen, setMultaOpen] = useState(false);
  const [multasConsultaOpen, setMultasConsultaOpen] = useState(false);
  const [historialNotifOpen, setHistorialNotifOpen] = useState(false);
  const [anularOpen, setAnularOpen] = useState(false);
  const [movimientoAnular, setMovimientoAnular] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [movimientoDetalle, setMovimientoDetalle] = useState(null);
  const [busquedaMov, setBusquedaMov] = useState('');

  const cargarResumen = useCallback(
    ({ silent = false } = {}) => {
      if (silent) setRefrescando(true);
      else setCargandoResumen(true);
      return Promise.all([
        TesoreriaAPI.cajaDiaria(),
        EstadisticasAPI.dashboard(),
        FacturasAPI.listarPorEstado('PAGADA_PARCIAL', { size: 1 }),
        TesoreriaAPI.estadisticasMultas(),
      ])
        .then(([cajaData, dashData, parcialesData, multasData]) => {
          setCaja(cajaData);
          setDashboard(dashData);
          setFacturasParciales(
            Array.isArray(parcialesData) ? parcialesData.length : parcialesData?.totalElements ?? 0
          );
          setMultasEstadisticas(multasData);
        })
        .catch((err) => error("Error al cargar resumen.", err.message || "Verifica tu conexión o contacta al administrador."))
        .finally(() => {
          setCargandoResumen(false);
          setRefrescando(false);
        });
    },
    [error]
  );

  const cargarMovimientos = useCallback(() => {
    setCargandoMov(true);
    const peticion =
      tab === 'todos'
        ? TesoreriaAPI.listarTodosMovimientos({ sort: 'fecha,desc' })
        : TesoreriaAPI.listarMovimientos(tab, { sort: 'fecha,desc' });

    peticion
      .then((data) => {
        if (Array.isArray(data)) {
          setMovimientos(data);
          setTotalMov(data.length);
        } else {
          setMovimientos(data?.content || []);
          setTotalMov(typeof data?.totalElements === 'number' ? data.totalElements : data?.content?.length ?? null);
        }
      })
      .catch((err) => error("Error al cargar movimientos.", err.message || "Verifica tu conexión e inténtalo de nuevo."))
      .finally(() => setCargandoMov(false));
  }, [tab, error]);

  useEffect(() => {
    if (!puedeGestionar) return;
    cargarResumen();
  }, [puedeGestionar]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!puedeGestionar) return;
    cargarMovimientos();
  }, [puedeGestionar, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const facturaId = searchParams.get('facturaId');
    // ?pago=1 abre el modal de cobro vacío (atajo "Registrar pago" del menú).
    const pagoDirecto = searchParams.get('pago');
    if (facturaId) {
      setFacturaIdInicial(facturaId);
      setPagoOpen(true);
      setSearchParams({}, { replace: true });
    } else if (pagoDirecto === '1') {
      setPagoOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refrescarTodo = () => {
    cargarResumen({ silent: true });
    cargarMovimientos();
  };

  const movimientosFiltrados = useMemo(() => {
    const texto = busquedaMov.trim().toLowerCase();
    if (!texto) return movimientos;
    return movimientos.filter((m) => {
      const descripcion = String(m.descripcion || '').toLowerCase();
      const tipo = String(m.tipo || '').toLowerCase();
      const categoria = String(m.categoria || '').toLowerCase();
      const asociado = String(m.asociadoNombre || '').toLowerCase();
      const factura = String(m.numeroFactura || '').toLowerCase();
      return descripcion.includes(texto) || tipo.includes(texto) || categoria.includes(texto) || asociado.includes(texto) || factura.includes(texto);
    });
  }, [movimientos, busquedaMov]);

  const movPag = usePagination(movimientosFiltrados, 15);

  const d = dashboard || {};
  const totalFacturas = (d.facturasPagadas || 0) + (d.facturasPendientes || 0) + (d.facturasVencidas || 0);
  const tasaRecaudo = totalFacturas > 0 ? (d.facturasPagadas / totalFacturas) * 100 : 0;
  const recaudoColor = tasaRecaudo >= 80 ? 'bg-emerald-500' : tasaRecaudo >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const recaudoText =
    tasaRecaudo >= 80
      ? 'text-emerald-600 dark:text-emerald-400'
      : tasaRecaudo >= 50
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-500 dark:text-red-400';

  const c = caja || { totalIngresos: 0, totalGastos: 0, balance: 0, numeroMovimientos: 0 };

  if (!puedeGestionar) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <Wallet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores y tesoreros pueden gestionar la tesorería del acueducto.
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
        <PageHeader
          icon={Wallet}
          title="Tesorería"
          subtitle="Caja diaria, movimientos, pagos y multas"
          actions={
            <div className="flex items-center gap-2">
              <DownloadCsvButton
                data={movimientos}
                preparar={prepararMovimientosParaExportar}
                filename="tesoreria"
                label="CSV"
              />
              <button
                onClick={refrescarTodo}
                disabled={cargandoResumen || refrescando}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-200 dark:border-dark-muted text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-muted/40 transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${refrescando ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          }
        />

        {/* Acciones rápidas */}
        <section className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2.5">
            Acciones rápidas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            <button
              onClick={() => {
                setFacturaIdInicial(null);
                setPagoOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-colors text-center"
            >
              <Wallet2 className="w-4 h-4 shrink-0" /> Registrar pago
            </button>
            <button
              onClick={() => {
                setMovModalTipo('ingreso');
                setMovModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold shadow-lg shadow-brand/20 transition-colors text-center"
            >
              <TrendingUp className="w-4 h-4 shrink-0" /> Registrar ingreso
            </button>
            <button
              onClick={() => {
                setMovModalTipo('gasto');
                setMovModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-lg shadow-red-600/20 transition-colors text-center"
            >
              <TrendingDown className="w-4 h-4 shrink-0" /> Registrar gasto
            </button>
            <button
              onClick={() => setMultaOpen(true)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-lg shadow-amber-500/20 transition-colors text-center"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" /> Registrar multa
            </button>
            <button
              onClick={() => setMultasConsultaOpen(true)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-gray-700 dark:text-white text-sm font-semibold transition-colors text-center"
            >
              <ListChecks className="w-4 h-4 shrink-0" /> Consultar multas
            </button>
            <button
              onClick={() => setHistorialNotifOpen(true)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-gray-700 dark:text-white text-sm font-semibold transition-colors text-center"
            >
              <History className="w-4 h-4 shrink-0" /> Notificaciones enviadas
            </button>
            <button
              onClick={() => navigate('/escanear-qr?origin=tesoreria')}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold shadow-lg shadow-gray-800/20 transition-colors text-center col-span-2 sm:col-span-1"
            >
              <QrCode className="w-4 h-4 shrink-0" /> Escanear QR
            </button>
          </div>
        </section>

        {cargandoResumen ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando panel de tesorería…</span>
          </div>
        ) : (
          <>
            {/* Caja diaria — siempre visible */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl overflow-hidden mb-6">
              <div className="p-5 pb-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet2 className="w-4 h-4 text-brand" />
                    <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">
                      Caja de hoy
                    </h2>
                  </div>
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-dark-muted hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    {expanded ? (
                      <>Ver menos <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>Ver más <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pb-5">
                  <StatPanel label="Ingresos" icon={TrendingUp} value={formatCOP(c.totalIngresos)} tone="text-emerald-600 dark:text-emerald-400" />
                  <StatPanel label="Gastos" icon={TrendingDown} value={formatCOP(c.totalGastos)} tone="text-red-500 dark:text-red-400" />
                  <StatPanel
                    label="Balance"
                    icon={Scale}
                    value={formatCOP(c.balance)}
                    tone={c.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}
                  />
                  <StatPanel icon={Hash} label="Movimientos" value={c.numeroMovimientos ?? 0} tone="text-brand" hint="Contabilizados hoy" />
                </div>
              </div>

              {/* Sección expandible: Metas de cobro + Cartera pendiente */}
              {expanded && (
                <div className="border-t border-gray-200 dark:border-dark-muted px-5 py-5 space-y-5 animate-[slideDown_0.2s_ease]">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Metas de cobro */}
                    <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-950 rounded-xl p-5">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-4">
                        <Target className="w-4 h-4 text-brand" /> Metas de cobro
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" />
                          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{d.facturasPagadas ?? 0}</span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">Pagadas</span>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
                          <Split className="w-4 h-4 text-sky-500 mb-1" />
                          <span className="text-3xl font-black text-sky-500 dark:text-sky-400 mb-1">{facturasParciales ?? 0}</span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 text-center">Pago parcial</span>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
                          <Clock className="w-4 h-4 text-amber-500 mb-1" />
                          <span className="text-3xl font-black text-amber-500 dark:text-amber-400 mb-1">{d.facturasPendientes ?? 0}</span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">Pendientes</span>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-red-500 mb-1" />
                          <span className="text-3xl font-black text-red-500 dark:text-red-400 mb-1">{d.facturasVencidas ?? 0}</span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">Vencidas</span>
                        </div>
                      </div>
                      <ProgressBar
                        progress={tasaRecaudo}
                        colorClass={recaudoColor}
                        label={`${d.facturasPagadas ?? 0} de ${totalFacturas} facturas cobradas al 100%`}
                        value={<span className={recaudoText}>{tasaRecaudo.toFixed(0)}%</span>}
                      />
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
                        Sin ningún pago:{' '}
                        <strong className="text-gray-600 dark:text-gray-300">{(d.facturasPendientes ?? 0) + (d.facturasVencidas ?? 0)}</strong>{' '}
                        factura(s) ({d.facturasPendientes ?? 0} pendientes + {d.facturasVencidas ?? 0} vencidas). Además hay{' '}
                        <strong className="text-gray-600 dark:text-gray-300">{facturasParciales ?? 0}</strong> factura(s) con pago
                        parcial a las que aún les falta saldo por cobrar.
                      </p>
                    </div>

                    {/* Cartera pendiente */}
                    <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-5 flex flex-col">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-4">
                        <BadgeDollarSign className="w-4 h-4 text-brand" /> Cartera pendiente
                      </h3>
                      <p className="text-2xl font-black text-red-500 dark:text-red-400 mb-1">{formatCOP(d.totalCarteraPendiente)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Deuda acumulada por facturas pendientes o vencidas.
                      </p>
                      <div className="mt-auto pt-3 border-t border-gray-200 dark:border-dark-muted space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Ingresos del mes</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCOP(d.ingresosMesActual)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Gastos del mes</span>
                          <span className="font-semibold text-red-500 dark:text-red-400">{formatCOP(d.gastosMesActual)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Balance del mes</span>
                          <span
                            className={`font-bold ${
                              d.balanceMesActual >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                            }`}
                          >
                            {formatCOP(d.balanceMesActual)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas de multas */}
                  {multasEstadisticas && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-3">
                        <ShieldAlert className="w-4 h-4 text-amber-500" /> Multas
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
                          <ShieldAlert className="w-4 h-4 text-amber-500 mb-1" />
                          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mb-1">{multasEstadisticas.totalMultas}</span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">Total</span>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
                          <Clock className="w-4 h-4 text-red-500 mb-1" />
                          <span className="text-2xl font-black text-red-500 dark:text-red-400 mb-1">{multasEstadisticas.pendientes}</span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">Pendientes</span>
                          <span className="text-[10px] text-red-400 dark:text-red-500 mt-0.5">{formatCOP(multasEstadisticas.totalValorPendiente)}</span>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" />
                          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{multasEstadisticas.pagadas}</span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">Pagadas</span>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-gray-400 mb-1" />
                          <span className="text-2xl font-black text-gray-400 dark:text-gray-500 mb-1">{multasEstadisticas.anuladas}</span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">Anuladas</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Historial de movimientos */}
        <section>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Movimientos</h2>
            {totalMov !== null && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {totalMov} movimiento{totalMov === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Todo lo registrado en caja: pagos de facturas, ingresos y gastos.
          </p>

          <div className="flex gap-1.5 mb-4 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  tab === t.value
                    ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                    : 'border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-gray-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {!cargandoMov && movimientos.length > 0 && (
            <div className="relative mb-4 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busquedaMov}
                onChange={(e) => setBusquedaMov(e.target.value)}
                placeholder="Buscar por descripción, tipo, asociado o factura…"
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
              />
            </div>
          )}

          {cargandoMov && (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando movimientos…</span>
            </div>
          )}

          {!cargandoMov && movimientos.length === 0 && (
            <div className="text-center py-16">
              <Wallet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No hay movimientos para mostrar con este filtro.</p>
            </div>
          )}

          {!cargandoMov && movimientos.length > 0 && movimientosFiltrados.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Ningún movimiento coincide con la búsqueda.</p>
            </div>
          )}

          {!cargandoMov && movimientosFiltrados.length > 0 && (
            <>
              <div className="space-y-2">
                {movPag.paginatedItems.map((m) => (
                  <MovimientoRow
                    key={m.id}
                    movimiento={m}
                    onVerDetalle={(mov) => {
                      setMovimientoDetalle(mov);
                      setDetalleOpen(true);
                    }}
                    onAnular={
                      esAdmin
                        ? (mov) => {
                            setMovimientoAnular(mov);
                            setAnularOpen(true);
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
              <Pagination currentPage={movPag.page} totalPages={movPag.totalPages} onPageChange={movPag.goToPage} />
            </>
          )}
        </section>
      </main>

      <RegistrarPagoModal
        open={pagoOpen}
        facturaIdInicial={facturaIdInicial}
        onClose={() => {
          setPagoOpen(false);
          setFacturaIdInicial(null);
        }}
        onSaved={refrescarTodo}
      />
      <RegistrarMovimientoModal open={movModalOpen} tipo={movModalTipo} onClose={() => setMovModalOpen(false)} onSaved={refrescarTodo} />
      <RegistrarMultaModal open={multaOpen} onClose={() => setMultaOpen(false)} onSaved={refrescarTodo} />
      <MultasAsociadoModal open={multasConsultaOpen} onClose={() => setMultasConsultaOpen(false)} />
      <HistorialNotificacionesModal open={historialNotifOpen} onClose={() => setHistorialNotifOpen(false)} tipoDocumento="MULTA" />
      <AnularMovimientoModal
        open={anularOpen}
        movimiento={movimientoAnular}
        onClose={() => setAnularOpen(false)}
        onSaved={refrescarTodo}
      />
      <MovimientoReciboModal
        open={detalleOpen}
        movimiento={movimientoDetalle}
        onClose={() => setDetalleOpen(false)}
      />
    </div>
  );
}
