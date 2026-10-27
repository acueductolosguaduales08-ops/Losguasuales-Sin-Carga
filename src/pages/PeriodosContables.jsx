import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Search,
  Loader2,
  ChevronRight,
  DollarSign,
  Droplet,
  TrendingUp,
  Inbox,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PeriodosAPI, NOMBRES_MESES } from '../api/periodos';
import { InformesAPI } from '../api/informes';
import AnioFormModal from '../components/periodos/AnioFormModal';
import MesFormModal from '../components/periodos/MesFormModal';
import PageHeader from '../components/ui/PageHeader';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import DataTable from '../components/ui/DataTable';
import StatPanel from '../components/ui/StatPanel';
import EstadoBadge from '../components/ui/EstadoBadge';
import { formatNumero } from '../utils/formatCOP';

// Vista jerárquica de períodos contables: Año → Mes → Movimientos.
// Nivel 1 (esta pantalla): lista de ejercicios con su caja agregada.
// Nivel 2 (vista de año): los 12 meses, abiertos/cerrados/no iniciados.
// Nivel 3: DetallePeriodo (movimientos del mes) — ruta aparte.
export default function PeriodosContables() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // ?anio=<id> abre el nivel 2 directo
  const { rol } = useAuth();
  const { error } = useToast();
  const puedeVer = rol === 'ADMINISTRADOR' || rol === 'TESORERO';
  const esAdmin = rol === 'ADMINISTRADOR';

  // --- Nivel 1: lista de años ---
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS'); // TODOS | EN_CURSO | CERRADO

  // --- Nivel 2: detalle del año seleccionado ---
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [months, setMonths] = useState([]);
  const [resumenMeses, setResumenMeses] = useState({}); // { [mesId]: { entradas, salidas, balance, cantidad, ultimaActividad } }
  const [resumenAnio, setResumenAnio] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // --- Filtros de meses (nivel 2) ---
  const [mesSearch, setMesSearch] = useState('');
  const [mesFilter, setMesFilter] = useState('TODOS'); // TODOS | ABIERTO | CERRADO | NO_INICIADO

  // --- Modales ---
  const [showAnioModal, setShowAnioModal] = useState(false);
  const [showMesModal, setShowMesModal] = useState(false);

  const cargarAnios = useCallback(() => {
    setLoading(true);
    PeriodosAPI.listarAnios()
      .then((data) => setYears(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => error('Error al cargar años.', err.message || 'Verifica tu conexión e inténtalo de nuevo.'))
      .finally(() => setLoading(false));
  }, [error]);

  useEffect(() => {
    if (puedeVer) cargarAnios();
  }, [puedeVer, cargarAnios]);

  // Sincronizar el año seleccionado con ?anio= (deep-link desde el
  // breadcrumb del detalle de mes y desde Paneles). Solo valida contra la
  // lista ya cargada para no abrir un id inexistente.
  useEffect(() => {
    const anioParam = searchParams.get('anio');
    if (anioParam && years.length > 0) {
      if (years.some((y) => y.id === anioParam)) setSelectedYearId(anioParam);
      else setSearchParams({}, { replace: true }); // id inválido: limpiar
    }
  }, [searchParams, years, setSearchParams]);

  // Al abrir/cerrar el nivel 2, mantener la URL consistente con la vista.
  const abrirAnio = (id) => {
    setSelectedYearId(id);
    setSearchParams(id ? { anio: id } : {}, { replace: true });
  };
  const cerrarAnio = () => {
    setSelectedYearId(null);
    setSearchParams({}, { replace: true });
  };

  // Cargar el detalle del año elegido: meses, caja por mes y resumen del
  // ejercicio, todo en paralelo. N+1 controlado: una consulta por año.
  useEffect(() => {
    if (!selectedYearId) {
      setMonths([]);
      setResumenMeses({});
      setResumenAnio(null);
      return;
    }
    setLoadingDetalle(true);
    Promise.all([
      PeriodosAPI.listarMeses(selectedYearId),
      InformesAPI.periodoAnio(selectedYearId).catch(() => null),
    ])
      .then(([meses, anio]) => {
        const lista = Array.isArray(meses) ? meses : meses?.content || [];
        setMonths(lista);
        setResumenAnio(anio);
        return PeriodosAPI.resumenMovimientosMeses(lista.map((m) => m.id)).then(setResumenMeses);
      })
      .catch((err) => error('Error al cargar el año.', err.message || 'Intenta de nuevo.'))
      .finally(() => setLoadingDetalle(false));
  }, [selectedYearId, error]);

  const selectedYear = years.find((y) => y.id === selectedYearId) || null;

  const handleAnioCreated = (nuevo) => {
    setYears((prev) => [...prev, nuevo].sort((a, b) => b.anio - a.anio));
    abrirAnio(nuevo.id);
  };

  const handleMesCreated = (nuevo) => {
    setMonths((prev) => [...prev, nuevo].sort((a, b) => a.numeroMes - b.numeroMes));
    // Refrescar caja y resumen del año tras aperturar un mes nuevo.
    PeriodosAPI.resumenMovimientosMeses([nuevo.id]).then((r) => {
      setResumenMeses((prev) => ({ ...prev, [nuevo.id]: r[nuevo.id] }));
    });
    InformesAPI.periodoAnio(selectedYearId).then(setResumenAnio).catch(() => {});
  };

  // Estado general derivado de los meses del año (no inventa datos).
  const estadoAnio = (anioId) => {
    const mesesDelAnio = anioId === selectedYearId ? months : null;
    if (!mesesDelAnio) return null; // fuera del año abierto no tenemos los meses cargados
    if (mesesDelAnio.length === 0) return 'NO_INICIADO';
    return mesesDelAnio.every((m) => m.estado === 'CERRADO') ? 'CERRADO' : 'ABIERTO';
  };

  const filteredYears = useMemo(() => {
    return years.filter((y) => {
      const matchSearch = String(y.anio).includes(search.trim());
      const mesesDelAnio = y.id === selectedYearId ? months : null;
      let matchStatus = true;
      if (statusFilter !== 'TODOS' && mesesDelAnio) {
        const est = mesesDelAnio.length === 0
          ? 'NO_INICIADO'
          : mesesDelAnio.every((m) => m.estado === 'CERRADO')
          ? 'CERRADO'
          : 'ABIERTO';
        matchStatus = est === statusFilter;
      }
      return matchSearch && matchStatus;
    });
  }, [years, search, statusFilter, selectedYearId, months]);

  // Meses del año en formato tabla: combinados con "no iniciados" para
  // que siempre se vean los 12 meses y se distingan los faltantes.
  const filasMeses = useMemo(() => {
    const registrados = new Map(months.map((m) => [m.numeroMes, m]));
    const total = NOMBRES_MESES.map((nombre, i) => {
      const numeroMes = i + 1;
      const real = registrados.get(numeroMes);
      if (real) {
        const r = resumenMeses[real.id] || {};
        return {
          id: real.id,
          numeroMes,
          nombre,
          iniciado: true,
          estado: real.estado,
          fechaApertura: real.fechaApertura,
          entradas: r.entradas ?? 0,
          salidas: r.salidas ?? 0,
          balance: r.balance ?? 0,
          cantidad: r.cantidad ?? 0,
          ultimaActividad: r.ultimaActividad || real.fechaApertura || null,
        };
      }
      return {
        id: `no-${numeroMes}`,
        numeroMes,
        nombre,
        iniciado: false,
        estado: 'NO_INICIADO',
        entradas: 0,
        salidas: 0,
        balance: 0,
        cantidad: 0,
        ultimaActividad: null,
      };
    });
    return total.filter((m) => {
      const matchSearch = m.nombre.toLowerCase().includes(mesSearch.trim().toLowerCase());
      const matchFilter =
        mesFilter === 'TODOS'
          ? true
          : mesFilter === 'NO_INICIADO'
          ? !m.iniciado
          : m.iniciado && m.estado === mesFilter;
      return matchSearch && matchFilter;
    });
  }, [months, resumenMeses, mesSearch, mesFilter]);

  const yearColumns = [
    {
      key: 'anio',
      label: 'Año',
      render: (y) => <span className="font-bold text-gray-800 dark:text-white">{y.anio}</span>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (y) => {
        const est = estadoAnio(y.id);
        if (!est) return <span className="text-xs text-gray-400">—</span>;
        return <EstadoBadge estado={est} />;
      },
    },
    {
      key: 'caja',
      label: 'Caja del año',
      align: 'right',
      render: (y) => {
        if (y.id !== selectedYearId || !resumenAnio) return <span className="text-xs text-gray-400">—</span>;
        return (
          <span className="font-semibold text-gray-800 dark:text-white">
            ${formatNumero(resumenAnio.totalIngresos || 0)}
          </span>
        );
      },
    },
    {
      key: 'gastos',
      label: 'Gastos',
      align: 'right',
      hideOnMobile: true,
      render: (y) => {
        if (y.id !== selectedYearId || !resumenAnio) return <span className="text-xs text-gray-400">—</span>;
        return <span className="text-red-500 dark:text-red-400 font-semibold">${formatNumero(resumenAnio.totalGastos || 0)}</span>;
      },
    },
    {
      key: 'balance',
      label: 'Balance',
      align: 'right',
      hideOnMobile: true,
      render: (y) => {
        if (y.id !== selectedYearId || !resumenAnio) return <span className="text-xs text-gray-400">—</span>;
        const b = Number(resumenAnio.balance || 0);
        return (
          <span className={`font-bold ${b >= 0 ? 'text-brand' : 'text-red-500 dark:text-red-400'}`}>
            ${formatNumero(b)}
          </span>
        );
      },
    },
    {
      key: 'meses',
      label: 'Meses',
      hideOnMobile: true,
      render: (y) => {
        if (y.id !== selectedYearId) return <span className="text-xs text-gray-400">—</span>;
        const abiertos = months.filter((m) => m.estado !== 'CERRADO').length;
        const cerrados = months.filter((m) => m.estado === 'CERRADO').length;
        if (months.length === 0) return <span className="text-xs text-gray-400">Sin meses</span>;
        return (
          <span className="text-xs text-gray-600 dark:text-gray-300">
            <span className="text-brand font-semibold">{abiertos} abiertos</span>
            {' · '}
            {cerrados} cerrados
          </span>
        );
      },
    },
  ];

  const mesColumns = [
    {
      key: 'mes',
      label: 'Mes',
      render: (m) => (
        <span className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-brand/10 text-brand text-[11px] font-black flex items-center justify-center shrink-0">
            {String(m.numeroMes).padStart(2, '0')}
          </span>
          <span className="font-bold text-gray-800 dark:text-white">{m.nombre}</span>
        </span>
      ),
    },
    { key: 'estado', label: 'Estado', render: (m) => <EstadoBadge estado={m.estado} /> },
    {
      key: 'entradas',
      label: 'Entradas',
      align: 'right',
      render: (m) =>
        m.iniciado ? (
          <span className="font-semibold text-gray-800 dark:text-white">${formatNumero(m.entradas)}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'salidas',
      label: 'Salidas',
      align: 'right',
      hideOnMobile: true,
      render: (m) =>
        m.iniciado ? (
          <span className="text-red-500 dark:text-red-400 font-semibold">${formatNumero(m.salidas)}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'balance',
      label: 'Balance',
      align: 'right',
      render: (m) => {
        if (!m.iniciado) return <span className="text-xs text-gray-400">—</span>;
        return (
          <span className={`font-bold ${m.balance >= 0 ? 'text-brand' : 'text-red-500 dark:text-red-400'}`}>
            ${formatNumero(m.balance)}
          </span>
        );
      },
    },
    {
      key: 'cantidad',
      label: 'Movimientos',
      align: 'right',
      hideOnMobile: true,
      render: (m) =>
        m.iniciado ? (
          <span className="text-gray-600 dark:text-gray-300 tabular-nums">{m.cantidad}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'ultima',
      label: 'Última actividad',
      hideOnMobile: true,
      render: (m) =>
        m.ultimaActividad ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {String(m.ultimaActividad).slice(0, 10)}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
  ];

  if (!puedeVer) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo Administradores y Tesoreros pueden gestionar los períodos contables. Inicia sesión con una cuenta
            autorizada.
          </p>
        </main>
      </div>
    );
  }

  const enVistaAnio = Boolean(selectedYear);

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-5xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        {enVistaAnio ? (
          /* ---------- Nivel 2: detalle del año ---------- */
          <>
            <Breadcrumbs
              items={[
                { label: 'Períodos contables', onClick: cerrarAnio },
                { label: String(selectedYear.anio) },
              ]}
            />

            <PageHeader
              icon={Calendar}
              title={`Ejercicio ${selectedYear.anio}`}
              subtitle={
                months.length === 0
                  ? 'Aún no se han aperturado meses en este ejercicio.'
                  : `${months.filter((m) => m.estado !== 'CERRADO').length} de 12 meses abiertos · ${months.filter((m) => m.estado === 'CERRADO').length} cerrados`
              }
              actions={
                esAdmin && (
                  <button
                    onClick={() => setShowMesModal(true)}
                    className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Aperturar mes
                  </button>
                )
              }
            />

            {/* Resumen financiero del ejercicio */}
            {loadingDetalle ? (
              <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando ejercicio…</span>
              </div>
            ) : resumenAnio ? (
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <StatPanel
                  label="Ingresos"
                  icon={DollarSign}
                  value={`$${formatNumero(resumenAnio.totalIngresos || 0)}`}
                  hint="Caja del ejercicio"
                  tone="text-brand"
                />
                <StatPanel
                  label="Gastos"
                  icon={DollarSign}
                  value={`$${formatNumero(resumenAnio.totalGastos || 0)}`}
                  hint="Salidas del ejercicio"
                  tone="text-red-500 dark:text-red-400"
                />
                <StatPanel
                  label="Balance"
                  icon={TrendingUp}
                  value={`$${formatNumero(resumenAnio.balance || 0)}`}
                  hint="Ingresos menos gastos"
                  tone={Number(resumenAnio.balance || 0) >= 0 ? 'text-brand' : 'text-red-500 dark:text-red-400'}
                />
                <StatPanel
                  label="Consumo"
                  icon={Droplet}
                  value={`${Number(resumenAnio.totalM3Consumidos || 0).toLocaleString()} m³`}
                  hint="Agua facturada acumulada"
                  tone="text-sky-600 dark:text-sky-400"
                />
              </section>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
                No hay datos agregados disponibles para este ejercicio todavía.
              </p>
            )}

            {/* Filtros de meses */}
            <section className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar mes…"
                  value={mesSearch}
                  onChange={(e) => setMesSearch(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-lg pl-9 pr-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-lg p-1">
                {[
                  ['TODOS', 'Todos'],
                  ['ABIERTO', 'Abiertos'],
                  ['CERRADO', 'Cerrados'],
                  ['NO_INICIADO', 'No iniciados'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setMesFilter(value)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      mesFilter === value
                        ? 'bg-brand text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Tabla de los 12 meses */}
            <DataTable
              columns={mesColumns}
              rows={filasMeses}
              rowKey={(m) => m.id}
              loading={loadingDetalle}
              onRowClick={(m) => {
                if (m.iniciado) navigate(`/periodos-contables/${m.id}`);
                else if (esAdmin) setShowMesModal(true); // atajo: aperturar el mes faltante
              }}
              empty={
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-10 text-center">
                  <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sin resultados para los filtros activos.</p>
                  <button
                    onClick={() => {
                      setMesSearch('');
                      setMesFilter('TODOS');
                    }}
                    className="text-brand hover:underline text-sm font-semibold mt-2"
                  >
                    Limpiar filtros
                  </button>
                </div>
              }
            />
          </>
        ) : (
          /* ---------- Nivel 1: lista de años ---------- */
          <>
            <PageHeader
              icon={Calendar}
              title="Períodos contables"
              subtitle="Ejercicios contables · selecciona un año para ver sus meses y movimientos"
              actions={
                esAdmin && (
                  <button
                    onClick={() => setShowAnioModal(true)}
                    className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo año contable
                  </button>
                )
              }
            />

            <section className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar año…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-lg pl-9 pr-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-lg p-1">
                {[
                  ['TODOS', 'Todos'],
                  ['ABIERTO', 'En curso'],
                  ['CERRADO', 'Cerrados'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      statusFilter === value
                        ? 'bg-brand text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <DataTable
              columns={yearColumns}
              rows={filteredYears}
              rowKey={(y) => y.id}
              loading={loading}
              onRowClick={(y) => abrirAnio(y.id)}
              empty={
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-10 text-center">
                  <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {years.length === 0
                      ? 'Aún no hay ejercicios contables registrados.'
                      : 'Sin resultados para los filtros activos.'}
                  </p>
                  {years.length === 0 && esAdmin && (
                    <button
                      onClick={() => setShowAnioModal(true)}
                      className="text-brand hover:underline text-sm font-semibold"
                    >
                      Crear el primer año contable
                    </button>
                  )}
                  {years.length > 0 && (
                    <button
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('TODOS');
                      }}
                      className="text-brand hover:underline text-sm font-semibold mt-1"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              }
            />

            {filteredYears.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                Selecciona un año para abrir sus 12 meses y el detalle de movimientos.
              </p>
            )}
          </>
        )}
      </main>

      {/* Modales */}
      <AnioFormModal open={showAnioModal} onClose={() => setShowAnioModal(false)} onCreated={handleAnioCreated} />
      {selectedYear && (
        <MesFormModal
          open={showMesModal}
          anio={selectedYear}
          mesesRegistrados={months.map((m) => m.numeroMes)}
          onClose={() => setShowMesModal(false)}
          onCreated={handleMesCreated}
        />
      )}
    </div>
  );
}
