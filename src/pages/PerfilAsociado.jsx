import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Phone,
  MapPin,
  Mail,
  Gauge,
  Calendar,
  Loader2,
  FileText,
  AlertTriangle,
  Wallet,
  FileBarChart,
  Pencil,
  Settings2,
  Archive,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AsociadosAPI } from '../api/asociados';
import { FacturasAPI } from '../api/facturas';
import { TesoreriaAPI } from '../api/tesoreria';
import AsociadoFormModal from '../components/asociados/AsociadoFormModal';
import AsociadoEstadoModal from '../components/asociados/AsociadoEstadoModal';
import AsociadoArchivarModal from '../components/asociados/AsociadoArchivarModal';
import PageHeader from '../components/ui/PageHeader';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import DataTable from '../components/ui/DataTable';
import StatPanel from '../components/ui/StatPanel';
import EstadoBadge from '../components/ui/EstadoBadge';
import { formatCOP } from '../utils/formatCOP';

const PESTANAS = [
  { key: 'resumen', label: 'Resumen', icon: Wallet },
  { key: 'facturas', label: 'Facturas', icon: FileText },
  { key: 'multas', label: 'Multas', icon: AlertTriangle },
  { key: 'movimientos', label: 'Movimientos', icon: FileBarChart },
];

function fecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// Perfil completo de un asociado (/asociados/:id). Nivel de detalle del
// directorio: datos de contacto + finanzas (facturas, multas, movimientos)
// reutilizando los modales de gestión ya existentes. Solo lectura aquí.
export default function PerfilAsociado() {
  const { asociadoId } = useParams();
  const navigate = useNavigate();
  const { rol } = useAuth();
  const { error } = useToast();
  const esAdmin = rol === 'ADMINISTRADOR';
  const puedeGestionar = esAdmin || rol === 'TESORERO';

  const [asociado, setAsociado] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [multas, setMultas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoTab, setCargandoTab] = useState(false);
  const [tab, setTab] = useState('resumen');

  const [formOpen, setFormOpen] = useState(false);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [archivarOpen, setArchivarOpen] = useState(false);

  useEffect(() => {
    if (!asociadoId) return;
    setCargando(true);
    Promise.all([
      AsociadosAPI.obtener(asociadoId),
      AsociadosAPI.resumenFinanciero(asociadoId).catch(() => null),
    ])
      .then(([a, r]) => {
        setAsociado(a);
        setResumen(r);
      })
      .catch((err) => {
        error('Error al cargar asociado.', err.message || 'No se pudo cargar el perfil.');
        navigate('/asociados');
      })
      .finally(() => setCargando(false));
  }, [asociadoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Carga perezosa de la pestaña activa (facturas/multas/movimientos).
  const cargarTab = useCallback(
    (k) => {
      if (!asociadoId) return;
      if (k === 'resumen') return;
      setCargandoTab(true);
      const p =
        k === 'facturas'
          ? FacturasAPI.listarPorAsociado(asociadoId)
          : k === 'multas'
          ? TesoreriaAPI.listarMultasAsociado(asociadoId)
          : TesoreriaAPI.listarMovimientosPorAsociado(asociadoId);
      p.then((data) => {
        if (k === 'facturas') setFacturas(data);
        else if (k === 'multas') setMultas(data);
        else setMovimientos(data);
      }).catch((err) => error('Error al cargar datos.', err.message || 'Intenta de nuevo.'))
        .finally(() => setCargandoTab(false));
    },
    [asociadoId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    cargarTab(tab);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const refrescar = () => {
    AsociadosAPI.obtener(asociadoId).then(setAsociado).catch(() => {});
    AsociadosAPI.resumenFinanciero(asociadoId).then(setResumen).catch(() => {});
    if (tab !== 'resumen') cargarTab(tab);
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="flex items-center justify-center pt-40 text-gray-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Cargando perfil…</span>
        </div>
      </div>
    );
  }

  if (!asociado) return null;

  const columnasFacturas = [
    { key: 'numero', label: 'Factura', render: (f) => <span className="font-mono text-gray-800 dark:text-white">{f.numero}</span> },
    { key: 'fechaEmision', label: 'Emisión', render: (f) => <span className="text-gray-600 dark:text-gray-300">{fecha(f.fechaEmision)}</span> },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (f) => <span className="font-mono text-gray-800 dark:text-white">{formatCOP(f.total)}</span>,
    },
    {
      key: 'saldo',
      label: 'Saldo',
      align: 'right',
      render: (f) => {
        const saldo = Number(f.total ?? 0) - Number(f.totalPagado ?? 0);
        return (
          <span className={`font-mono ${saldo > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {formatCOP(saldo)}
          </span>
        );
      },
    },
    { key: 'estado', label: 'Estado', render: (f) => <EstadoBadge estado={f.estado} /> },
  ];

  const columnasMultas = [
    { key: 'numero', label: 'Multa', render: (m) => <span className="font-mono text-gray-800 dark:text-white">{m.numero}</span> },
    { key: 'fecha', label: 'Fecha', hideOnMobile: true, render: (m) => <span className="text-gray-600 dark:text-gray-300">{fecha(m.fecha)}</span> },
    { key: 'motivo', label: 'Motivo', render: (m) => <span className="text-gray-700 dark:text-gray-300 truncate">{m.motivo}</span> },
    {
      key: 'valor',
      label: 'Valor',
      align: 'right',
      render: (m) => <span className="font-mono text-gray-800 dark:text-white">{formatCOP(m.valor)}</span>,
    },
    { key: 'estado', label: 'Estado', render: (m) => <EstadoBadge estado={m.estado} /> },
  ];

  const columnasMovimientos = [
    { key: 'fecha', label: 'Fecha', render: (m) => <span className="text-gray-600 dark:text-gray-300">{fecha(m.fecha)}</span> },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (m) => (
        <span className={`font-semibold ${m.tipo === 'ENTRADA' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {m.tipo === 'ENTRADA' ? 'Ingreso' : 'Salida'}
        </span>
      ),
    },
    { key: 'concepto', label: 'Concepto', hideOnMobile: true, render: (m) => <span className="text-gray-700 dark:text-gray-300 truncate">{m.concepto}</span> },
    { key: 'metodoPago', label: 'Método', hideOnMobile: true, render: (m) => <span className="text-gray-600 dark:text-gray-300">{m.metodoPago}</span> },
    {
      key: 'valor',
      label: 'Valor',
      align: 'right',
      render: (m) => (
        <span className={`font-mono ${m.tipo === 'ENTRADA' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {formatCOP(m.valor)}
        </span>
      ),
    },
  ];

  const saldo = Number(resumen?.saldo_total ?? 0);

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-5xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <Breadcrumbs
          items={[
            { label: 'Asociados', onClick: () => navigate('/asociados') },
            { label: `${asociado.nombres} ${asociado.apellidos}` },
          ]}
        />

        <PageHeader
          icon={Users}
          title={`${asociado.nombres} ${asociado.apellidos}`}
          subtitle={`${asociado.tipoDocumento} ${asociado.documento} · ${asociado.codigoInterno || '—'}`}
          actions={
            puedeGestionar && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate(`/informes?tab=asociado&asociadoId=${asociado.id}&asociadoNombre=${encodeURIComponent(asociado.nombres + ' ' + asociado.apellidos)}`)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand/30 bg-brand/10 hover:bg-brand/15 text-brand dark:text-brand-light text-sm font-semibold transition-colors"
                  title="Generar seguimiento del asociado"
                >
                  <FileBarChart className="w-4 h-4" />
                  Informe
                </button>
                <button
                  onClick={() => setFormOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-dark-muted text-gray-700 dark:text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => setEstadoOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Settings2 className="w-4 h-4" />
                  Estado
                </button>
                {esAdmin && !asociado.archivado && (
                  <button
                    onClick={() => setArchivarOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                    Archivar
                  </button>
                )}
              </div>
            )
          }
        />

        {/* Estado + badge */}
        <div className="flex items-center gap-2 mb-5 -mt-2 flex-wrap">
          <EstadoBadge estado={asociado.estadoServicio} />
          {asociado.archivado && <EstadoBadge estado="ANULADO" label="Archivado" />}
          <button
            onClick={() => navigate('/asociados')}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al directorio
          </button>
        </div>

        {/* Ficha de contacto */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-5 mb-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Phone className="w-4 h-4 text-brand/70 shrink-0" />
            {asociado.telefonoPrincipal || '—'}
          </div>
          {asociado.correo && (
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 min-w-0">
              <Mail className="w-4 h-4 text-brand/70 shrink-0" />
              <span className="truncate">{asociado.correo}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 min-w-0 col-span-2">
            <MapPin className="w-4 h-4 text-brand/70 shrink-0" />
            <span className="truncate">
              {asociado.direccion || '—'}
              {asociado.barrioVereda ? ` · ${asociado.barrioVereda}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Gauge className="w-4 h-4 text-brand/70 shrink-0" />
            {asociado.numeroMedidor || 'Sin medidor'}
          </div>
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Calendar className="w-4 h-4 text-brand/70 shrink-0" />
            {fecha(asociado.fechaAfiliacion)}
          </div>
        </section>

        {/* Pestañas */}
        <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-lg p-1 mb-4 overflow-x-auto">
          {PESTANAS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === key
                  ? 'bg-brand text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Contenido de la pestaña */}
        {tab === 'resumen' && (
          <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatPanel
              label="Saldo pendiente"
              icon={Wallet}
              value={formatCOP(saldo)}
              hint="Deuda actual con el acueducto"
              tone={saldo > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}
            />
            <StatPanel
              label="Facturas pendientes"
              icon={FileText}
              value={String(resumen?.facturas_pendientes ?? 0)}
              hint="Por pagar o parciales"
              tone={Number(resumen?.facturas_pendientes ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-800 dark:text-white'}
            />
            <StatPanel
              label="Multas pendientes"
              icon={AlertTriangle}
              value={`${formatCOP(resumen?.total_multas ?? 0)}`}
              hint={`${resumen?.multas_pendientes ?? 0} en curso`}
              tone={Number(resumen?.multas_pendientes ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-800 dark:text-white'}
            />
          </section>
        )}

        {tab !== 'resumen' && (
          <>
            {cargandoTab ? (
              <div className="flex items-center justify-center py-14 text-gray-400 gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando…</span>
              </div>
            ) : (
              <>
                {tab === 'facturas' && (
                  <DataTable
                    columns={columnasFacturas}
                    rows={facturas}
                    rowKey={(f) => f.id}
                    empty={
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-12 text-center">
                        <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Este asociado aún no tiene facturas.</p>
                      </div>
                    }
                  />
                )}
                {tab === 'multas' && (
                  <DataTable
                    columns={columnasMultas}
                    rows={multas}
                    rowKey={(m) => m.id}
                    empty={
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-12 text-center">
                        <AlertTriangle className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Este asociado no tiene multas registradas.</p>
                      </div>
                    }
                  />
                )}
                {tab === 'movimientos' && (
                  <DataTable
                    columns={columnasMovimientos}
                    rows={movimientos}
                    rowKey={(m) => m.id}
                    empty={
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-12 text-center">
                        <FileBarChart className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sin movimientos de caja registrados.</p>
                      </div>
                    }
                  />
                )}
              </>
            )}
          </>
        )}

        {/* Acciones adicionales según pestaña (facturación de deuda) */}
        {tab === 'facturas' && puedeGestionar && !cargandoTab && facturas.length > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-4 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Para cobrar una factura, ábrela desde el módulo de Tesorería.
            </span>
            <button
              onClick={() => navigate('/tesoreria?pago=1')}
              className="shrink-0 bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Ir a cobros
            </button>
          </div>
        )}
      </main>

      <AsociadoFormModal
        open={formOpen}
        asociado={asociado}
        onClose={() => setFormOpen(false)}
        onSaved={refrescar}
      />
      <AsociadoEstadoModal
        open={estadoOpen}
        asociado={asociado}
        onClose={() => setEstadoOpen(false)}
        onSaved={refrescar}
      />
      <AsociadoArchivarModal
        open={archivarOpen}
        asociado={asociado}
        onClose={() => setArchivarOpen(false)}
        onSaved={() => navigate('/asociados')}
      />
    </div>
  );
}
