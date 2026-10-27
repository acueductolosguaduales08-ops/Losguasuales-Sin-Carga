import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, FileStack, Loader2, Search, UserRound, History, SlidersHorizontal, ChevronDown, X, Eye, Download, Bell, FilePlus, Trash2 } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FacturasAPI } from '../api/facturas';
import { AsociadosAPI } from '../api/asociados';
import FacturaDetalleModal from '../components/facturas/FacturaDetalleModal';
import GenerarFacturacionModal from '../components/facturas/GenerarFacturacionModal';
import ConceptoAdicionalModal from '../components/facturas/ConceptoAdicionalModal';
import AnularFacturaModal from '../components/facturas/AnularFacturaModal';
import NotificarModal from '../components/notificarDocumento/NotificarModal';
import HistorialNotificacionesModal from '../components/notificarDocumento/HistorialNotificacionesModal';
import Pagination from '../components/common/Pagination';
import DownloadCsvButton from '../components/common/DownloadCsvButton';
import { prepararFacturasParaExportar } from '../utils/exportarExcel';
import usePagination from '../hooks/usePagination';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import EstadoBadge from '../components/ui/EstadoBadge';
import StatPanel from '../components/ui/StatPanel';
import { formatCOP } from '../utils/formatCOP';

const FILTROS_ESTADO = [
  { value: '', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'PAGADA_PARCIAL', label: 'Pago parcial' },
  { value: 'PAGADA', label: 'Pagadas' },
  { value: 'VENCIDA', label: 'Vencidas' },
  { value: 'ANULADA', label: 'Anuladas' },
];

const TABS = [
  { value: 'estado', label: 'Por estado' },
  { value: 'todas', label: 'Historial completo' },
  { value: 'asociado', label: 'Por asociado' },
];

export default function Facturacion() {
  const { rol } = useAuth();
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const esAdmin = rol === 'ADMINISTRADOR';
  const puedeGestionar = esAdmin || rol === 'TESORERO';

  const [tab, setTab] = useState('estado');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [mesFiltro, setMesFiltro] = useState('');
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busquedaFactura, setBusquedaFactura] = useState('');

  // Búsqueda de asociado para la pestaña "Por asociado"
  const [busquedaAsociado, setBusquedaAsociado] = useState('');
  const [asociadosEncontrados, setAsociadosEncontrados] = useState([]);
  const [buscandoAsociados, setBuscandoAsociados] = useState(false);
  const [asociadoSeleccionado, setAsociadoSeleccionado] = useState(null);

  const [generarOpen, setGenerarOpen] = useState(false);
  const [generarPreset, setGenerarPreset] = useState({ anioId: null, mesId: null });
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [facturaDetalle, setFacturaDetalle] = useState(null);
  const [facturaIdDesdeUrl, setFacturaIdDesdeUrl] = useState(null);
  const [conceptoOpen, setConceptoOpen] = useState(false);
  const [facturaConcepto, setFacturaConcepto] = useState(null);
  const [anularOpen, setAnularOpen] = useState(false);
  const [facturaAnular, setFacturaAnular] = useState(null);
  const [descargandoId, setDescargandoId] = useState(null);
  const [notificarOpen, setNotificarOpen] = useState(false);
  const [facturaNotificar, setFacturaNotificar] = useState(null);
  const [historialOpen, setHistorialOpen] = useState(false);

  useEffect(() => {
    const verId = searchParams.get('ver');
    if (verId) {
      setFacturaDetalle(null);
      setFacturaIdDesdeUrl(verId);
      setDetalleOpen(true);
      setSearchParams({}, { replace: true });
    }

    // Llegada desde "Ir a facturar este mes" en Lecturas y consumo: abre
    // directamente el modal de generar facturación con el período ya
    // elegido, en vez de que el usuario tenga que volver a buscar el año y
    // el mes que ya estaba viendo.
    const generarMesId = searchParams.get('generarMes');
    const generarAnioId = searchParams.get('generarAnio');
    if (generarMesId && generarAnioId) {
      setGenerarPreset({ anioId: generarAnioId, mesId: generarMesId });
      setGenerarOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cargar = () => {
    if (!puedeGestionar) return;
    setLoading(true);

    let peticion;
    if (tab === 'estado') {
      // Single call instead of 5 parallel calls — filter on client side
      peticion = FacturasAPI.listarTodas({ sort: 'fechaEmision,desc' });
    } else if (tab === 'todas') {
      peticion = FacturasAPI.listarTodas({ sort: 'fechaEmision,desc' });
    } else if (tab === 'asociado' && asociadoSeleccionado) {
      peticion = FacturasAPI.listarPorAsociado(asociadoSeleccionado.id);
    } else {
      setFacturas([]);
      setLoading(false);
      return;
    }

    peticion
      .then((data) => {
        let result = Array.isArray(data) ? data : data?.content || [];
        // Client-side filter when "Por estado" tab and a specific status is selected
        if (tab === 'estado' && estadoFiltro) {
          result = result.filter((f) => f.estado === estadoFiltro);
        }
        setFacturas(result);
      })
      .catch((err) => error("Error al cargar facturas.", err.message || "Verifica tu conexión o contacta al administrador."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, [tab, estadoFiltro, asociadoSeleccionado]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setMesFiltro('');
  }, [tab]);

  // Meses disponibles a partir de las facturas ya cargadas (no hay un
  // endpoint de "listar por mes" en el backend, así que el filtro se
  // aplica del lado del cliente sobre lo que ya se trajo).
  const mesesDisponibles = useMemo(() => {
    const set = new Map();
    facturas.forEach((f) => {
      if (!f.fechaEmision) return;
      const key = f.fechaEmision.slice(0, 7); // 'YYYY-MM'
      if (!set.has(key)) {
        const [anio, mes] = key.split('-');
        const label = new Date(Number(anio), Number(mes) - 1, 1).toLocaleDateString('es-CO', {
          month: 'long',
          year: 'numeric',
        });
        set.set(key, label.charAt(0).toUpperCase() + label.slice(1));
      }
    });
    return Array.from(set.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => b.value.localeCompare(a.value));
  }, [facturas]);

  const facturasPorMes = useMemo(
    () => (mesFiltro ? facturas.filter((f) => f.fechaEmision?.slice(0, 7) === mesFiltro) : facturas),
    [facturas, mesFiltro]
  );

  useEffect(() => {
    setBusquedaFactura('');
  }, [tab]);

  // Búsqueda de asociados con pequeño debounce
  useEffect(() => {
    if (tab !== 'asociado' || !busquedaAsociado.trim()) {
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
  }, [busquedaAsociado, tab]);

  const facturasOrdenadas = useMemo(
    () => [...facturasPorMes].sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision)),
    [facturasPorMes]
  );

  const facturasFiltradas = useMemo(() => {
    const texto = busquedaFactura.trim().toLowerCase();
    if (!texto) return facturasOrdenadas;
    return facturasOrdenadas.filter((f) => {
      const numero = String(f.numeroFactura || '').toLowerCase();
      const asociado = String(f.asociadoNombre || '').toLowerCase();
      return numero.includes(texto) || asociado.includes(texto);
    });
  }, [facturasOrdenadas, busquedaFactura]);

  const columnasFacturas = [
    {
      key: 'numero',
      label: 'Factura',
      render: (f) => (
        <span className="font-mono text-xs text-gray-800 dark:text-white">{f.numeroFactura}</span>
      ),
    },
    {
      key: 'asociado',
      label: 'Asociado',
      render: (f) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
            {f.asociadoNombre || f.asociado?.nombreCompleto || '—'}
          </p>
          {f.asociado?.documento && (
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{f.asociado.documento}</p>
          )}
        </div>
      ),
    },
    {
      key: 'fechaEmision',
      label: 'Emisión',
      render: (f) => <span className="text-gray-600 dark:text-gray-300">{f.fechaEmision || '—'}</span>,
    },
    {
      key: 'fechaLimitePago',
      label: 'Límite de pago',
      hideOnMobile: true,
      render: (f) => <span className="text-gray-600 dark:text-gray-300">{f.fechaLimitePago || '—'}</span>,
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (f) => <span className="font-mono text-gray-800 dark:text-white">{formatCOP(f.total)}</span>,
    },
    {
      key: 'saldoPendiente',
      label: 'Saldo',
      align: 'right',
      hideOnMobile: true,
      render: (f) => (
        <span
          className={`font-mono ${
            f.saldoPendiente > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {formatCOP(f.saldoPendiente)}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (f) => <EstadoBadge estado={f.estado} />,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (f) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="Ver detalle"
            onClick={() => {
              setFacturaDetalle(f);
              setDetalleOpen(true);
            }}
            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Descargar PDF"
            onClick={() => handleDescargarPdf(f)}
            disabled={descargandoId === f.id}
            className="p-1.5 rounded-md text-brand hover:bg-brand/10 transition-colors disabled:opacity-50"
          >
            {descargandoId === f.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
          <button
            type="button"
            title="Notificar"
            onClick={() => handleNotificar(f)}
            className="p-1.5 rounded-md text-brand hover:bg-brand/10 transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>
          {esAdmin && (
            <>
              <button
                type="button"
                title="Agregar concepto adicional"
                onClick={() => {
                  setFacturaConcepto(f);
                  setConceptoOpen(true);
                }}
                className="p-1.5 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
              >
                <FilePlus className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Anular factura"
                onClick={() => {
                  setFacturaAnular(f);
                  setAnularOpen(true);
                }}
                className="p-1.5 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const facPag = usePagination(facturasFiltradas, 15);

  const tituloLista = useMemo(() => {
    const mesActivo = mesFiltro
      ? mesesDisponibles.find((m) => m.value === mesFiltro)?.label || ''
      : '';
    const estadoActivo = FILTROS_ESTADO.find((f) => f.value === estadoFiltro)?.label || '';

    if (tab === 'todas') return 'Historial completo de facturas';
    if (tab === 'asociado') {
      return asociadoSeleccionado
        ? `Facturas de ${asociadoSeleccionado.nombres} ${asociadoSeleccionado.apellidos}`
        : '';
    }

    if (!estadoActivo || estadoActivo === 'Todos') {
      return mesActivo ? `Facturas del mes ${mesActivo}` : 'Todas las facturas';
    }
    if (mesActivo) {
      return `Facturas ${estadoActivo.toLowerCase()} del mes de ${mesActivo}`;
    }
    return `Facturas ${estadoActivo.toLowerCase()}`;
  }, [tab, estadoFiltro, mesFiltro, mesesDisponibles, asociadoSeleccionado]);

  const handleDescargarPdf = async (factura) => {
    setDescargandoId(factura.id);
    try {
      await FacturasAPI.descargarPdf(factura.id);
      success("Factura abierta.", "Usa 'Guardar como PDF' en el diálogo de impresión.");
    } catch (err) {
      error("Error al descargar PDF.", err.message || "Intenta de nuevo o contacta al administrador.");
    } finally {
      setDescargandoId(null);
    }
  };

  const handleNotificar = (factura) => {
    setFacturaNotificar(factura);
    setNotificarOpen(true);
  };

  if (!puedeGestionar) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores y tesoreros pueden gestionar la facturación. Si eres asociado, consulta tus
            facturas desde tu perfil.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <PageHeader
          icon={FileText}
          title="Facturación"
          subtitle="Consulta, descarga y gestiona las facturas del acueducto"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistorialOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 dark:border-dark-muted text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-muted/40 transition-colors"
              >
                <History className="w-4 h-4" /> Historial
              </button>
              {esAdmin && (
                <>
                  <DownloadCsvButton
                    data={facturas}
                    preparar={prepararFacturasParaExportar}
                    filename="facturas"
                    label="CSV"
                  />
                  <button
                    onClick={() => setGenerarOpen(true)}
                    className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-brand/20 text-sm font-semibold shrink-0"
                  >
                    <FileStack className="w-4 h-4" />
                    Generar facturación del mes
                  </button>
                </>
              )}
            </div>
          }
        />

        {/* KPIs del conjunto cargado */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatPanel
            label="Total facturas"
            icon={FileText}
            value={String(facturas.length)}
            hint="En la vista actual"
            tone="text-gray-800 dark:text-white"
          />
          <StatPanel
            label="Pendientes"
            icon={FileText}
            value={String(facturas.filter((f) => f.estado === 'PENDIENTE').length)}
            hint="Por pagar"
            tone="text-amber-600 dark:text-amber-400"
          />
          <StatPanel
            label="Pagadas"
            icon={FileText}
            value={String(facturas.filter((f) => f.estado === 'PAGADA').length)}
            hint="Completadas"
            tone="text-emerald-600 dark:text-emerald-400"
          />
          <StatPanel
            label="Vencidas"
            icon={FileText}
            value={String(facturas.filter((f) => f.estado === 'VENCIDA').length)}
            hint="Requieren gestión"
            tone="text-red-600 dark:text-red-400"
          />
        </section>

        {/* Filtros avanzados: vista + estado + mes + asociado en un solo desplegable */}
        <div className="mb-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl overflow-hidden">
          <button
            onClick={() => setFiltrosOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-dark-muted/40 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand shrink-0" />
            <span className="text-sm font-bold text-gray-800 dark:text-white">Filtros avanzados</span>
            <span className="flex gap-1.5 ml-1 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-dark-muted text-gray-600 dark:text-gray-300">
                {TABS.find((t) => t.value === tab)?.label}
              </span>
              {tab === 'estado' && estadoFiltro !== '' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                  {FILTROS_ESTADO.find((f) => f.value === estadoFiltro)?.label}
                </span>
              )}
              {mesFiltro !== '' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand capitalize">
                  {mesesDisponibles.find((m) => m.value === mesFiltro)?.label}
                </span>
              )}
              {tab === 'asociado' && asociadoSeleccionado && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                  {asociadoSeleccionado.nombres} {asociadoSeleccionado.apellidos}
                </span>
              )}
            </span>
            {(estadoFiltro !== '' || mesFiltro !== '' || (tab === 'asociado' && asociadoSeleccionado)) && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setEstadoFiltro('');
                  setMesFiltro('');
                  setAsociadoSeleccionado(null);
                  setBusquedaAsociado('');
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click(); }}
                className="ml-auto mr-1 flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-red-500 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" /> Limpiar
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${filtrosOpen ? 'rotate-180' : ''} ${(estadoFiltro !== '' || mesFiltro !== '') ? '' : 'ml-auto'}`} />
          </button>

          {filtrosOpen && (
            <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-100 dark:border-dark-muted">
              <div>
                <h2 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 mt-3 uppercase tracking-wide">
                  Mostrar facturas por
                </h2>
                <div className="grid grid-cols-3 gap-1.5">
                  {TABS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTab(t.value)}
                      className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        tab === t.value
                          ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                          : 'border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-gray-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {tab === 'estado' && (
                <div>
                  <h2 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    Estado
                  </h2>
                  <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
                  >
                    {FILTROS_ESTADO.map((f) => (
                      <option key={f.value} value={f.value}>{f.label === 'Todos' ? 'Todos los estados' : f.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {tab !== 'asociado' && (
                <div>
                  <h2 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    Mes de emisión
                  </h2>
                  <select
                    value={mesFiltro}
                    onChange={(e) => setMesFiltro(e.target.value)}
                    disabled={mesesDisponibles.length === 0}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white capitalize disabled:opacity-50"
                  >
                    <option value="">Todos los meses</option>
                    {mesesDisponibles.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {tab === 'asociado' && (
                <div className="space-y-3">
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
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
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
                          <UserRound className="w-4 h-4 text-brand/70 shrink-0" />
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
                    <div className="max-w-md bg-brand/10 border border-brand/30 rounded-lg px-4 py-2.5 flex items-center justify-between">
                      <span className="text-sm text-brand dark:text-brand-light font-semibold">
                        {asociadoSeleccionado.nombres} {asociadoSeleccionado.apellidos}
                      </span>
                      <button
                        onClick={() => {
                          setAsociadoSeleccionado(null);
                          setBusquedaAsociado('');
                        }}
                        className="text-xs text-brand dark:text-brand-light hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando facturas…</span>
          </div>
        )}

        {!loading && tab === 'asociado' && !asociadoSeleccionado && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-16">
            Busca y selecciona un asociado para ver su historial de facturas.
          </p>
        )}

        {!loading && facturasOrdenadas.length > 0 && (tab !== 'asociado' || asociadoSeleccionado) && (
          <>
            {tituloLista && (
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3 text-center">
                {tituloLista}
              </h2>
            )}
            <div className="relative mb-4 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busquedaFactura}
                onChange={(e) => setBusquedaFactura(e.target.value)}
                placeholder="Buscar por número de factura o nombre de asociado…"
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
              />
            </div>
          </>
        )}

        {!loading && facturasOrdenadas.length === 0 && (tab !== 'asociado' || asociadoSeleccionado) && (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No hay facturas para mostrar con este filtro.</p>
          </div>
        )}

        {!loading && facturasOrdenadas.length > 0 && facturasFiltradas.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Ninguna factura coincide con la búsqueda.</p>
          </div>
        )}

        {!loading && facturasFiltradas.length > 0 && (
          <>
            <DataTable
              columns={columnasFacturas}
              rows={facPag.paginatedItems}
              rowKey={(f) => f.id}
              onRowClick={(f) => {
                setFacturaDetalle(f);
                setDetalleOpen(true);
              }}
              empty={
                <div className="text-center py-16">
                  <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">No hay facturas para mostrar con este filtro.</p>
                </div>
              }
            />
            <Pagination currentPage={facPag.page} totalPages={facPag.totalPages} onPageChange={facPag.goToPage} />
          </>
        )}
      </main>

      <GenerarFacturacionModal
        open={generarOpen}
        onClose={() => setGenerarOpen(false)}
        onGenerado={cargar}
        anioIdInicial={generarPreset.anioId}
        mesIdInicial={generarPreset.mesId}
      />
      <FacturaDetalleModal
        open={detalleOpen}
        factura={facturaDetalle}
        facturaId={facturaIdDesdeUrl}
        onClose={() => {
          setDetalleOpen(false);
          setFacturaIdDesdeUrl(null);
        }}
      />
      <ConceptoAdicionalModal
        open={conceptoOpen}
        factura={facturaConcepto}
        onClose={() => setConceptoOpen(false)}
        onSaved={cargar}
      />
      <AnularFacturaModal open={anularOpen} factura={facturaAnular} onClose={() => setAnularOpen(false)} onSaved={cargar} />
      <NotificarModal
        open={notificarOpen}
        onClose={() => setNotificarOpen(false)}
        tipo="FACTURA"
        documento={facturaNotificar}
        documentoId={facturaNotificar?.id}
        documentoNumero={facturaNotificar?.numeroFactura}
        asociadoId={facturaNotificar?.asociadoId}
        asociadoNombre={facturaNotificar?.asociadoNombre}
      />
      <HistorialNotificacionesModal open={historialOpen} onClose={() => setHistorialOpen(false)} tipoDocumento="FACTURA" />
    </div>
  );
}
