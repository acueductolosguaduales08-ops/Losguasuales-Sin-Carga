import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Phone, MapPin, Settings2, Wallet, Archive } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AsociadosAPI } from '../api/asociados';
import AsociadoFormModal from '../components/asociados/AsociadoFormModal';
import AsociadoEstadoModal from '../components/asociados/AsociadoEstadoModal';
import AsociadoFinanzasModal from '../components/asociados/AsociadoFinanzasModal';
import AsociadoArchivarModal from '../components/asociados/AsociadoArchivarModal';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import EstadoBadge from '../components/ui/EstadoBadge';
import Pagination from '../components/common/Pagination';
import DownloadCsvButton from '../components/common/DownloadCsvButton';
import { prepararAsociadosParaExportar } from '../utils/exportarExcel';
import usePagination from '../hooks/usePagination';

const FILTROS_ESTADO = [
  { value: '', label: 'Todos los estados' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'SUSPENDIDO', label: 'Suspendidos' },
  { value: 'INACTIVO', label: 'Inactivos' },
];

export default function Asociados() {
  const { rol } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();
  const puedeGestionar = rol === 'ADMINISTRADOR' || rol === 'TESORERO';

  const [asociados, setAsociados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [asociadoEditando, setAsociadoEditando] = useState(null);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [asociadoEstado, setAsociadoEstado] = useState(null);
  const [finanzasOpen, setFinanzasOpen] = useState(false);
  const [asociadoFinanzas, setAsociadoFinanzas] = useState(null);
  const [archivarOpen, setArchivarOpen] = useState(false);
  const [asociadoArchivar, setAsociadoArchivar] = useState(null);

  const cargar = () => {
    setLoading(true);
    const peticion = filtroEstado
      ? AsociadosAPI.filtrarPorEstado(filtroEstado)
      : AsociadosAPI.buscar(busqueda.trim() || undefined);

    peticion
      .then((data) => setAsociados(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => error("Error al cargar asociados.", err.message || "Verifica tu conexión o contacta al administrador."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (puedeGestionar) cargar();
  }, [puedeGestionar, filtroEstado]); // eslint-disable-line react-hooks/exhaustive-deps

  // Búsqueda con pequeño debounce, solo cuando no hay filtro de estado activo.
  useEffect(() => {
    if (!puedeGestionar || filtroEstado) return;
    const t = setTimeout(cargar, 350);
    return () => clearTimeout(t);
  }, [busqueda]); // eslint-disable-line react-hooks/exhaustive-deps

  const asociadosOrdenados = useMemo(() => {
    return [...asociados].sort((a, b) => (a.archivado === b.archivado ? 0 : a.archivado ? 1 : -1));
  }, [asociados]);

  const asocPag = usePagination(asociadosOrdenados, 15);

  const irAlPerfil = (a) => navigate(`/asociados/${a.id}`);

  const columnas = [
    {
      key: 'nombre',
      label: 'Asociado',
      render: (a) => (
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              a.estadoServicio === 'ACTIVO'
                ? 'bg-brand/15 text-brand'
                : a.estadoServicio === 'SUSPENDIDO'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'bg-gray-400/15 text-gray-500'
            }`}
          >
            {(a.nombres || '?').trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <span className="block font-semibold text-gray-800 dark:text-white truncate">
              {a.nombres} {a.apellidos}
            </span>
            <span className="block text-xs font-mono text-gray-500 dark:text-gray-400">{a.codigoInterno || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'documento',
      label: 'Documento',
      hideOnMobile: true,
      render: (a) => (
        <span className="font-mono text-xs text-gray-600 dark:text-gray-300">
          {a.tipoDocumento} {a.documento}
        </span>
      ),
    },
    {
      key: 'contacto',
      label: 'Contacto',
      render: (a) => (
        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
          {a.telefonoPrincipal && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-brand/60" /> {a.telefonoPrincipal}
            </span>
          )}
          {a.direccion && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-brand/60" /> {a.direccion}
            </span>
          )}
          {!a.telefonoPrincipal && !a.direccion && <span className="text-gray-400">—</span>}
        </div>
      ),
    },
    {
      key: 'estadoServicio',
      label: 'Estado',
      render: (a) => (
        <div className="flex flex-col items-start gap-1">
          <EstadoBadge estado={a.estadoServicio} />
          {a.archivado && <EstadoBadge estado="ANULADO" label="Archivado" />}
        </div>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (a) => (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()} // no navega al perfil al usar los iconos
        >
          <button
            type="button"
            title="Cambiar estado del servicio"
            onClick={() => {
              setAsociadoEstado(a);
              setEstadoOpen(true);
            }}
            className="p-1.5 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Resumen financiero"
            onClick={() => {
              setAsociadoFinanzas(a);
              setFinanzasOpen(true);
            }}
            className="p-1.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            <Wallet className="w-4 h-4" />
          </button>
          {!a.archivado && (
            <button
              type="button"
              title="Archivar asociado"
              onClick={() => {
                setAsociadoArchivar(a);
                setArchivarOpen(true);
              }}
              className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (!puedeGestionar) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores y tesoreros pueden gestionar el directorio de asociados. Inicia sesión con una
            cuenta autorizada.
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
          icon={Users}
          title="Directorio de asociados"
          subtitle="Selecciona un asociado para abrir su perfil completo"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-grow sm:w-56">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por documento, nombre o teléfono…"
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
                />
              </div>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer shrink-0"
              >
                {FILTROS_ESTADO.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <DownloadCsvButton
                data={asociados}
                preparar={prepararAsociadosParaExportar}
                filename="asociados"
                label="CSV"
              />
              <button
                onClick={() => {
                  setAsociadoEditando(null);
                  setFormOpen(true);
                }}
                className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-brand/20 text-sm font-semibold shrink-0"
              >
                <Plus className="w-4 h-4" />
                Nuevo asociado
              </button>
            </div>
          }
        />

        <DataTable
          columns={columnas}
          rows={asocPag.paginatedItems}
          rowKey={(a) => a.id}
          loading={loading}
          onRowClick={irAlPerfil}
          empty={
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-12 text-center">
              <Users className="w-9 h-9 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {busqueda || filtroEstado
                  ? 'Ningún asociado coincide con la búsqueda.'
                  : 'Aún no hay asociados registrados.'}
              </p>
              {busqueda || filtroEstado ? (
                <button
                  onClick={() => {
                    setBusqueda('');
                    setFiltroEstado('');
                  }}
                  className="text-brand hover:underline text-sm font-semibold mt-2"
                >
                  Limpiar filtros
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAsociadoEditando(null);
                    setFormOpen(true);
                  }}
                  className="text-brand hover:underline text-sm font-semibold mt-2"
                >
                  Crear el primer asociado
                </button>
              )}
            </div>
          }
        />

        {!loading && asociadosOrdenados.length > 0 && (
          <Pagination currentPage={asocPag.page} totalPages={asocPag.totalPages} onPageChange={asocPag.goToPage} />
        )}
      </main>

      <AsociadoFormModal
        open={formOpen}
        asociado={asociadoEditando}
        onClose={() => setFormOpen(false)}
        onSaved={cargar}
      />
      <AsociadoEstadoModal
        open={estadoOpen}
        asociado={asociadoEstado}
        onClose={() => setEstadoOpen(false)}
        onSaved={cargar}
      />
      <AsociadoFinanzasModal
        open={finanzasOpen}
        asociado={asociadoFinanzas}
        onClose={() => setFinanzasOpen(false)}
      />
      <AsociadoArchivarModal
        open={archivarOpen}
        asociado={asociadoArchivar}
        onClose={() => setArchivarOpen(false)}
        onSaved={cargar}
      />
    </div>
  );
}
