import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Loader2,
  FileText,
  DollarSign,
  Droplet,
  Lock,
  Unlock,
  Printer,
  FileBarChart,
  Inbox,
  Receipt,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PeriodosAPI } from '../api/periodos';
import { TesoreriaAPI } from '../api/tesoreria';
import { FacturasAPI } from '../api/facturas';
import ReabrirMesModal from '../components/periodos/ReabrirMesModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import InformeMesModal from '../components/informes/InformeMesModal';
import { imprimirLoteFacturas } from '../utils/documentos';
import { formatNumero } from '../utils/formatCOP';
import PageHeader from '../components/ui/PageHeader';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import DataTable from '../components/ui/DataTable';
import StatPanel from '../components/ui/StatPanel';
import EstadoBadge from '../components/ui/EstadoBadge';

// Nivel 3 de la jerarquía de períodos: detalle de UN mes contable.
// Muestra los KPIs del período, sus movimientos de caja (incl. anulados,
// para trazabilidad) y las facturas generadas, con las acciones de
// cierre/reapertura bajo control de permisos (solo admin).
export default function DetallePeriodo() {
  const { periodoId } = useParams();
  const navigate = useNavigate();
  const { rol } = useAuth();
  const { success, error } = useToast();
  const esAdmin = rol === 'ADMINISTRADOR';

  const [mes, setMes] = useState(null);
  const [anioContable, setAnioContable] = useState(null); // año contenedor del mes, para el breadcrumb
  const [resumen, setResumen] = useState(null);
  const [loadingMes, setLoadingMes] = useState(true);
  const [loadingResumen, setLoadingResumen] = useState(true);

  // Pestaña: movimientos de caja vs facturas del mes.
  const [tab, setTab] = useState('movimientos');
  const [movimientos, setMovimientos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [tipoFilter, setTipoFilter] = useState('TODOS'); // TODOS | ENTRADA | SALIDA

  // Acciones de cierre / reapertura.
  const [imprimiendoLote, setImprimiendoLote] = useState(false);
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [showReabrirModal, setShowReabrirModal] = useState(false);
  const [showInformeModal, setShowInformeModal] = useState(false);

  const handleImprimirLote = async () => {
    if (!mes) return;
    setImprimiendoLote(true);
    try {
      const n = await imprimirLoteFacturas(null, { mesContableId: mes.id });
      success(`Lote de ${n} facturas listo.`, 'Se abrió una pestaña con el documento; usa imprimir en el navegador.');
    } catch (err) {
      error('Error al imprimir el lote.', err.message || 'Intenta de nuevo.');
    } finally {
      setImprimiendoLote(false);
    }
  };

  useEffect(() => {
    if (!periodoId) return;
    setLoadingMes(true);
    PeriodosAPI.obtenerMes(periodoId)
      .then((m) => {
        setMes(m);
        // Guardar el año contenedor para que el breadcrumb lleve al nivel 2.
        if (m?.anioId) setAnioContable({ id: m.anioId, anio: m.anio });
      })
      .catch((err) => {
        error('Error al cargar período.', err.message || 'Período no encontrado.');
        navigate('/periodos-contables');
      })
      .finally(() => setLoadingMes(false));
  }, [periodoId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!periodoId) return;
    setLoadingResumen(true);
    PeriodosAPI.resumenMes(periodoId)
      .then(setResumen)
      .catch(() => setResumen(null))
      .finally(() => setLoadingResumen(false));
  }, [periodoId]);

  // Movimientos y facturas del mes se cargan juntos al abrir la pestaña
  // correspondiente (lazy) para no penalizar la carga inicial.
  useEffect(() => {
    if (!periodoId) return;
    let cancelado = false;
    if (tab === 'movimientos') {
      setLoadingDetalle(true);
      TesoreriaAPI.listarMovimientosPorMes(periodoId)
        .then((data) => !cancelado && setMovimientos(data))
        .catch((err) => !cancelado && error('Error al cargar movimientos.', err.message || 'Intenta de nuevo.'))
        .finally(() => !cancelado && setLoadingDetalle(false));
    } else {
      setLoadingDetalle(true);
      FacturasAPI.listarPorMes(periodoId)
        .then((data) => !cancelado && setFacturas(data))
        .catch((err) => !cancelado && error('Error al cargar facturas.', err.message || 'Intenta de nuevo.'))
        .finally(() => !cancelado && setLoadingDetalle(false));
    }
    return () => {
      cancelado = true;
    };
  }, [tab, periodoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCerrarMes = async () => {
    if (!mes) return;
    setCerrando(true);
    try {
      const actualizado = await PeriodosAPI.cerrarMes(mes.id);
      setMes(actualizado);
      success(`Período cerrado.`, `Ya no se pueden registrar movimientos en ${mes.nombreMes} ${mes.anio}.`);
    } catch (err) {
      error('Error al cerrar período.', err.message || 'Verifica que no haya movimientos pendientes.');
    } finally {
      setCerrando(false);
      setConfirmandoCierre(false);
    }
  };

  const handleReabrir = (actualizado) => {
    setMes((prev) => (prev ? { ...prev, ...actualizado } : actualizado));
  };

  const resumenCobro = useCallback(
    () =>
      resumen && resumen.facturasGeneradas
        ? Math.round((resumen.facturasPagadas / resumen.facturasGeneradas) * 100)
        : 0,
    [resumen]
  );

  const movimientosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return movimientos.filter((m) => {
      if (tipoFilter !== 'TODOS' && m.tipo !== tipoFilter) return false;
      if (!q) return true;
      return [m.numero, m.concepto, m.asociadoNombre, m.facturaNumero, m.reciboNumero, m.metodoPago]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [movimientos, busqueda, tipoFilter]);

  const cobro = resumenCobro();

  if (loadingMes) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="flex items-center justify-center pt-40 text-gray-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Cargando período…</span>
        </div>
      </div>
    );
  }

  if (!mes) return null;

  const movColumns = [
    { key: 'numero', label: 'Número', render: (m) => <span className="font-semibold text-gray-800 dark:text-white">{m.numero}</span> },
    { key: 'fecha', label: 'Fecha' },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (m) => <EstadoBadge estado={m.tipo === 'ENTRADA' ? 'EMITIDO' : 'ANULADO'} label={m.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} />,
    },
    { key: 'concepto', label: 'Concepto', render: (m) => <span className="text-gray-700 dark:text-gray-300">{m.concepto}</span> },
    {
      key: 'asociado',
      label: 'Asociado',
      hideOnMobile: true,
      render: (m) => <span className="text-gray-600 dark:text-gray-400">{m.asociadoNombre || '—'}</span>,
    },
    {
      key: 'referencia',
      label: 'Factura / Recibo',
      hideOnMobile: true,
      render: (m) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {[m.facturaNumero, m.reciboNumero].filter(Boolean).join(' · ') || '—'}
        </span>
      ),
    },
    {
      key: 'valor',
      label: 'Valor',
      align: 'right',
      render: (m) => (
        <span className={`font-bold tabular-nums ${m.tipo === 'ENTRADA' ? 'text-brand' : 'text-red-500 dark:text-red-400'}`}>
          {m.tipo === 'ENTRADA' ? '+' : '−'}${formatNumero(m.valor)}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (m) => (m.anulado ? <EstadoBadge estado="ANULADO" /> : <EstadoBadge estado="EMITIDO" />),
    },
  ];

  const facColumns = [
    { key: 'numeroFactura', label: 'Factura', render: (f) => <span className="font-semibold text-gray-800 dark:text-white">{f.numeroFactura}</span> },
    { key: 'asociado', label: 'Asociado', render: (f) => <span className="text-gray-700 dark:text-gray-300">{f.asociado?.nombreCompleto || '—'}</span> },
    { key: 'fechaEmision', label: 'Emisión', hideOnMobile: true },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (f) => <span className="font-semibold text-gray-800 dark:text-white tabular-nums">${formatNumero(f.total)}</span>,
    },
    {
      key: 'saldoPendiente',
      label: 'Saldo',
      align: 'right',
      render: (f) => (
        <span className={`font-semibold tabular-nums ${f.saldoPendiente > 0 ? 'text-red-500 dark:text-red-400' : 'text-brand'}`}>
          ${formatNumero(f.saldoPendiente)}
        </span>
      ),
    },
    { key: 'estado', label: 'Estado', render: (f) => <EstadoBadge estado={f.estado} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="w-full max-w-5xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <Breadcrumbs
          items={[
            { label: 'Períodos contables', onClick: () => navigate('/periodos-contables') },
            { label: String(mes.anio), onClick: () => navigate(`/periodos-contables?anio=${anioContable?.id || ''}`) },
            { label: mes.nombreMes },
          ]}
        />

        <PageHeader
          icon={Calendar}
          title={`${mes.nombreMes} ${mes.anio}`}
          subtitle={`Apertura: ${mes.fechaApertura || '—'}${mes.fechaCierre ? ` · Cierre: ${mes.fechaCierre}` : ''}${
            mes.estado !== 'CERRADO' && mes.motivoReapertura ? ` · Motivo reapertura: ${mes.motivoReapertura}` : ''
          }`}
          actions={
            <>
              <button
                onClick={() => setShowInformeModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-dark-muted text-gray-700 dark:text-white rounded-lg text-sm font-semibold transition-colors"
                title="Informe mensual del período"
              >
                <FileBarChart className="w-4 h-4" />
                Informe
              </button>
              <button
                onClick={handleImprimirLote}
                disabled={imprimiendoLote}
                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-dark-muted text-gray-700 dark:text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                title="Imprime todas las facturas no anuladas del período en una sola pestaña"
              >
                {imprimiendoLote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                Imprimir lote
              </button>
              {esAdmin && mes.estado !== 'CERRADO' && (
                <button
                  onClick={() => setConfirmandoCierre(true)}
                  disabled={cerrando}
                  className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {cerrando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Cerrar período
                </button>
              )}
              {esAdmin && mes.estado === 'CERRADO' && (
                <button
                  onClick={() => setShowReabrirModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Unlock className="w-4 h-4" /> Reabrir período
                </button>
              )}
            </>
          }
        />

        {/* Estado del período junto al título */}
        <div className="flex items-center gap-2 mb-5 -mt-2">
          <EstadoBadge estado={mes.estado} />
          <button
            onClick={() => navigate('/periodos-contables')}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a períodos
          </button>
        </div>

        {/* KPIs */}
        {loadingResumen ? (
          <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando métricas del período…</span>
          </div>
        ) : resumen ? (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <StatPanel
                label="Ingresos"
                icon={DollarSign}
                value={`$${formatNumero(resumen.totalIngresos)}`}
                hint={`${movimientos.filter((m) => !m.anulado && m.tipo === 'ENTRADA').length} entradas`}
                tone="text-brand"
              />
              <StatPanel
                label="Salidas"
                icon={DollarSign}
                value={`$${formatNumero(resumen.totalGastos)}`}
                hint="Gastos del período"
                tone="text-red-500 dark:text-red-400"
              />
              <StatPanel
                label="Balance"
                icon={Droplet}
                value={`$${formatNumero(resumen.balance)}`}
                hint="Ingresos menos salidas"
                tone={resumen.balance >= 0 ? 'text-brand' : 'text-red-500 dark:text-red-400'}
              />
              <StatPanel
                label="Eficiencia de cobro"
                icon={FileText}
                value={`${cobro}%`}
                hint={`${resumen.facturasPagadas} de ${resumen.facturasGeneradas} facturas pagadas`}
                tone={cobro >= 80 ? 'text-brand' : cobro >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}
              />
            </section>

            {/* Barra de progreso de cobro */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-4 flex items-center gap-4 mb-4">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 shrink-0">Progreso de cobro</p>
              <div className="w-full bg-gray-100 dark:bg-dark-muted h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    cobro >= 80 ? 'bg-brand' : cobro >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${cobro}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200 shrink-0 tabular-nums">{cobro}%</span>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-8 text-center text-sm text-gray-400 dark:text-gray-500 mb-4">
            No se pudo cargar el resumen de este período.
          </div>
        )}

        {/* Pestañas Movimientos / Facturas */}
        <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-lg p-1 mb-3 w-full sm:w-auto sm:inline-flex">
          {[
            ['movimientos', 'Movimientos', Receipt],
            ['facturas', 'Facturas', FileText],
          ].map(([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                tab === value ? 'bg-brand text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'movimientos' && (
          <>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                placeholder="Buscar por número, concepto, asociado, factura o recibo…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
              />
              <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-lg p-1">
                {[
                  ['TODOS', 'Todos'],
                  ['ENTRADA', 'Entradas'],
                  ['SALIDA', 'Salidas'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setTipoFilter(value)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      tipoFilter === value
                        ? 'bg-brand text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <DataTable
              columns={movColumns}
              rows={movimientosFiltrados}
              rowKey={(m) => m.id}
              loading={loadingDetalle}
              empty={
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-10 text-center">
                  <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {movimientos.length === 0 ? 'No hay movimientos registrados en este período.' : 'Sin resultados para la búsqueda.'}
                  </p>
                  {movimientos.length > 0 && (
                    <button
                      onClick={() => {
                        setBusqueda('');
                        setTipoFilter('TODOS');
                      }}
                      className="text-brand hover:underline text-sm font-semibold mt-2"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              }
            />
          </>
        )}

        {tab === 'facturas' && (
          <DataTable
            columns={facColumns}
            rows={facturas}
            rowKey={(f) => f.id}
            loading={loadingDetalle}
            empty={
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-10 text-center">
                <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Aún no se generaron facturas para este mes.</p>
              </div>
            }
          />
        )}
      </main>

      {/* Confirmar cierre con resumen */}
      <ConfirmDialog
        open={confirmandoCierre}
        title={`¿Cerrar ${mes.nombreMes} ${mes.anio}?`}
        message={`Se cerrará el período y no se podrán registrar más movimientos ni generar facturas en él. ${
          resumen ? `Resumen: ${resumen.facturasGeneradas} facturas, balance $${formatNumero(resumen.balance)}.` : ''
        }`}
        confirmLabel={cerrando ? 'Cerrando…' : 'Sí, cerrar período'}
        cancelLabel="Cancelar"
        onConfirm={handleCerrarMes}
        onCancel={() => setConfirmandoCierre(false)}
      />

      <ReabrirMesModal
        open={showReabrirModal}
        mes={mes}
        onClose={() => setShowReabrirModal(false)}
        onReopened={handleReabrir}
      />

      <InformeMesModal open={showInformeModal} mes={mes} onClose={() => setShowInformeModal(false)} />
    </div>
  );
}
