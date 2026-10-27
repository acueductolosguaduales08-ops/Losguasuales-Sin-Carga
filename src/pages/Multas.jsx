import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldAlert, Loader2, Search, Wallet, Pencil, MessageCircle, ExternalLink, FileText, RefreshCw } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TesoreriaAPI } from '../api/tesoreria';
import { RecibosAPI } from '../api/recibos';
import { ConfiguracionAPI } from '../api/configuracion';
import PageHeader from '../components/ui/PageHeader';
import StatPanel from '../components/ui/StatPanel';
import EstadoBadge from '../components/ui/EstadoBadge';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/common/Pagination';
import NotificarModal from '../components/notificarDocumento/NotificarModal';
import MultaDetalleModal from '../components/multas/MultaDetalleModal';
import usePagination from '../hooks/usePagination';
import { formatCOP, formatCOPInput, unformatCOP } from '../utils/formatCOP';

function formatFecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const FILTROS_ESTADO = [
  { value: 'todos', label: 'Todas' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'PAGADA', label: 'Pagadas' },
  { value: 'ANULADA', label: 'Anuladas' },
];

export default function Multas() {
  const { rol } = useAuth();
  const { success, error, warning, info } = useToast();
  const esAdmin = rol === 'ADMINISTRADOR';
  const puedeGestionar = esAdmin || rol === 'TESORERO';
  const [searchParams, setSearchParams] = useSearchParams();

  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Multa seleccionada para detalle / pago / edición / notificación
  const [selectedMulta, setSelectedMulta] = useState(null);
  const [notificarOpen, setNotificarOpen] = useState(false);
  const [multaNotificar, setMultaNotificar] = useState(null);

  const [metodosPago, setMetodosPago] = useState([]);
  const [pagarOpen, setPagarOpen] = useState(false);
  const [multaPagar, setMultaPagar] = useState(null);
  const [metodoPagoId, setMetodoPagoId] = useState('');
  const [pagando, setPagando] = useState(false);

  const [editarOpen, setEditarOpen] = useState(false);
  const [multaEditar, setMultaEditar] = useState(null);
  const [nuevoValor, setNuevoValor] = useState('');
  const [editando, setEditando] = useState(false);

  const [cargandoRecibo, setCargandoRecibo] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [descargandoMultaPdf, setDescargandoMultaPdf] = useState(null);

  const cargar = useCallback(
    ({ silent = false } = {}) => {
      if (silent) setRefrescando(true);
      else setLoading(true);
      return TesoreriaAPI.listarMultas()
        .then((data) => setMultas(Array.isArray(data) ? data : data?.content || []))
        .catch((err) => error('Error al cargar multas.', err.message || 'Verifica tu conexión o inténtalo de nuevo.'))
        .finally(() => {
          setLoading(false);
          setRefrescando(false);
        });
    },
    [error]
  );

  useEffect(() => {
    if (!puedeGestionar) return;
    cargar();
  }, [puedeGestionar]); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep-link ?ver=<id> abre el detalle de la multa (búsqueda global)
  useEffect(() => {
    const verId = searchParams.get('ver');
    if (!verId) return;
    const multa = multas.find((m) => m.id === verId);
    if (multa) {
      setSelectedMulta(multa);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, multas]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarMetodosPago = () => {
    if (metodosPago.length === 0) {
      ConfiguracionAPI.listarMetodosPago()
        .then((data) => setMetodosPago(Array.isArray(data) ? data : data?.content || []))
        .catch(() => {});
    }
  };

  const multasFiltradas = useMemo(() => {
    let resultado = multas;
    if (filtroEstado !== 'todos') resultado = resultado.filter((m) => m.estado === filtroEstado);
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return resultado;
    return resultado.filter((m) => {
      const motivo = String(m.motivo || '').toLowerCase();
      const asociado = String(m.asociado?.nombreCompleto || '').toLowerCase();
      const documento = String(m.asociado?.documento || '').toLowerCase();
      const factura = String(m.facturaNumero || '').toLowerCase();
      const numero = String(m.numero || '').toLowerCase();
      return motivo.includes(texto) || asociado.includes(texto) || documento.includes(texto) || factura.includes(texto) || numero.includes(texto);
    });
  }, [multas, filtroEstado, busqueda]);

  const multPag = usePagination(multasFiltradas, 15);

  // Estadísticas globales
  const stats = useMemo(() => {
    const agg = { total: 0, pendientes: 0, pagadas: 0, anuladas: 0, valorPendiente: 0, valorPagado: 0 };
    for (const m of multas) {
      agg.total++;
      if (m.estado === 'PENDIENTE') {
        agg.pendientes++;
        agg.valorPendiente += Number(m.valor || 0);
      } else if (m.estado === 'PAGADA') {
        agg.pagadas++;
        agg.valorPagado += Number(m.valor || 0);
      } else if (m.estado === 'ANULADA') {
        agg.anuladas++;
      }
    }
    return agg;
  }, [multas]);

  // Acciones sobre multas
  const abrirPagar = (m) => {
    setMultaPagar(m);
    setMetodoPagoId('');
    setPagarOpen(true);
    cargarMetodosPago();
  };

  const confirmarPago = async () => {
    if (!metodoPagoId) {
      warning('Método de pago requerido.', 'Selecciona un método de pago para confirmar.');
      return;
    }
    setPagando(true);
    try {
      await TesoreriaAPI.pagarMulta(multaPagar.id, { metodoPagoId });
      success('Pago registrado.', 'La multa fue pagada y su estado se actualizó.');
      setPagarOpen(false);
      setMultaPagar(null);
      cargar({ silent: true });
    } catch (err) {
      error('Error al pagar multa.', err.message || 'No se pudo procesar el pago de la multa.');
    } finally {
      setPagando(false);
    }
  };

  const abrirEditar = (m) => {
    setMultaEditar(m);
    setNuevoValor(String(m.valor || ''));
    setEditarOpen(true);
  };

  const confirmarEdicion = async () => {
    if (!nuevoValor || Number(nuevoValor) <= 0) {
      warning('Valor inválido.', 'El nuevo valor debe ser mayor a cero.');
      return;
    }
    setEditando(true);
    try {
      await TesoreriaAPI.editarValorMulta(multaEditar.id, { valor: Number(nuevoValor) });
      success('Valor actualizado.', 'El valor de la multa se guardó correctamente.');
      setEditarOpen(false);
      setMultaEditar(null);
      cargar({ silent: true });
    } catch (err) {
      error('Error al editar valor.', err.message || 'No se pudo actualizar el valor de la multa.');
    } finally {
      setEditando(false);
    }
  };

  const handleVerRecibo = async (m) => {
    setCargandoRecibo(true);
    try {
      const recibo = await RecibosAPI.buscarPorMulta(m.id);
      if (recibo) {
        info('Vista previa del recibo.', 'Abriendo nueva ventana con el recibo en HTML.');
        const html = await RecibosAPI.html(recibo.numeroRecibo);
        const ventana = window.open('', '_blank');
        if (ventana) {
          ventana.document.write(html);
          ventana.document.close();
        } else {
          warning('Ventana bloqueada.', 'El navegador bloqueó la ventana emergente. Permite ventanas emergentes para este sitio.');
        }
      } else {
        warning('Recibo no encontrado.', 'La multa no tiene un recibo asociado.');
      }
    } catch {
      warning('Error al cargar recibo.', 'No se pudo obtener el recibo. Intenta de nuevo.');
    } finally {
      setCargandoRecibo(false);
    }
  };

  const handleDescargarRecibo = async (m) => {
    setDescargandoPdf(true);
    try {
      const recibo = await RecibosAPI.buscarPorMulta(m.id);
      if (recibo) {
        await RecibosAPI.abrirPdf(recibo.numeroRecibo);
        success('Recibo abierto.', "Usa 'Guardar como PDF' en el diálogo de impresión.");
      } else {
        warning('Recibo no encontrado.', 'La multa no tiene un recibo asociado.');
      }
    } catch {
      error('Error al descargar recibo.', 'No se pudo obtener el archivo PDF.');
    } finally {
      setDescargandoPdf(false);
    }
  };

  const handleDescargarMultaPdf = async (m) => {
    setDescargandoMultaPdf(m.id);
    try {
      await TesoreriaAPI.descargarMultaPdf(m.id);
      success('PDF listo.', "Usa 'Guardar como PDF' en el diálogo de impresión.");
    } catch (err) {
      error('Error al descargar multa.', err.message || 'No se pudo obtener el archivo PDF.');
    } finally {
      setDescargandoMultaPdf(null);
    }
  };

  const handleVerMultaHtml = async (m) => {
    info('Abriendo vista previa.', 'Se abrirá en una nueva pestaña del navegador.');
    try {
      const html = await TesoreriaAPI.verMultaHtml(m.id);
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      } else {
        warning('Ventana bloqueada.', 'El navegador bloqueó la ventana emergente.');
      }
    } catch (err) {
      error('Error al abrir vista previa.', err.message || 'Intenta descargar el PDF.');
    }
  };

  if (!puedeGestionar) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <ShieldAlert className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores y tesoreros pueden gestionar las multas del acueducto.
          </p>
        </main>
      </div>
    );
  }

  const columnasMultas = [
    {
      key: 'numero',
      label: 'Multa',
      render: (m) => <span className="font-mono text-xs text-gray-800 dark:text-white">{m.numero}</span>,
    },
    {
      key: 'asociado',
      label: 'Asociado',
      render: (m) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{m.asociado?.nombreCompleto || '—'}</p>
          {m.asociado?.documento && (
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{m.asociado.documento}</p>
          )}
        </div>
      ),
    },
    {
      key: 'motivo',
      label: 'Motivo',
      hideOnMobile: true,
      render: (m) => (
        <div className="min-w-0">
          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{m.motivo}</p>
          {m.facturaNumero && <p className="text-[11px] text-gray-500 dark:text-gray-400">Factura {m.facturaNumero}</p>}
        </div>
      ),
    },
    {
      key: 'fecha',
      label: 'Fecha',
      render: (m) => <span className="text-gray-600 dark:text-gray-300">{formatFecha(m.fecha)}</span>,
    },
    {
      key: 'valor',
      label: 'Valor',
      align: 'right',
      render: (m) => <span className="font-mono text-gray-800 dark:text-white">{formatCOP(m.valor)}</span>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (m) => (
        <span className="inline-flex items-center gap-1">
          <EstadoBadge estado={m.estado} />
          {m.independiente && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
              Indep.
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (m) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="Ver comprobante"
            onClick={() => handleVerMultaHtml(m)}
            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Descargar PDF"
            onClick={() => handleDescargarMultaPdf(m)}
            disabled={descargandoMultaPdf === m.id}
            className="p-1.5 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
          >
            {descargandoMultaPdf === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          </button>
          {m.independiente && m.estado === 'PENDIENTE' && (
            <button
              type="button"
              title="Pagar multa"
              onClick={() => abrirPagar(m)}
              className="p-1.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              <Wallet className="w-4 h-4" />
            </button>
          )}
          {m.independiente && m.estado === 'PENDIENTE' && esAdmin && (
            <button
              type="button"
              title="Editar valor"
              onClick={() => abrirEditar(m)}
              className="p-1.5 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {m.estado === 'PENDIENTE' && (
            <button
              type="button"
              title="Notificar"
              onClick={() => {
                setMultaNotificar(m);
                setNotificarOpen(true);
              }}
              className="p-1.5 rounded-md text-brand hover:bg-brand/10 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
          {m.estado === 'PAGADA' && m.independiente && (
            <>
              <button
                type="button"
                title="Ver recibo"
                onClick={() => handleVerRecibo(m)}
                disabled={cargandoRecibo}
                className="p-1.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
              >
                {cargandoRecibo ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              </button>
              <button
                type="button"
                title="Descargar recibo PDF"
                onClick={() => handleDescargarRecibo(m)}
                disabled={descargandoPdf}
                className="p-1.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
              >
                {descargandoPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <PageHeader
          icon={ShieldAlert}
          title="Multas"
          subtitle="Consulta, cobra y gestiona las multas del acueducto"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => cargar({ silent: true })}
                disabled={loading || refrescando}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-200 dark:border-dark-muted text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-muted/40 transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${refrescando ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          }
        />

        {/* KPIs del conjunto cargado */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatPanel label="Total multas" icon={ShieldAlert} value={String(stats.total)} hint="En la vista actual" tone="text-gray-800 dark:text-white" />
          <StatPanel
            label="Pendientes"
            icon={ShieldAlert}
            value={String(stats.pendientes)}
            hint={formatCOP(stats.valorPendiente)}
            tone="text-amber-600 dark:text-amber-400"
          />
          <StatPanel
            label="Pagadas"
            icon={Wallet}
            value={String(stats.pagadas)}
            hint={formatCOP(stats.valorPagado)}
            tone="text-emerald-600 dark:text-emerald-400"
          />
          <StatPanel label="Anuladas" icon={ShieldAlert} value={String(stats.anuladas)} hint="No cobradas" tone="text-gray-500 dark:text-gray-400" />
        </section>

        {/* Filtros */}
        <section className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex gap-1.5 flex-wrap">
            {FILTROS_ESTADO.map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltroEstado(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  filtroEstado === f.value
                    ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                    : 'border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-gray-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {multas.length > 0 && (
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por motivo, asociado o factura…"
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
              />
            </div>
          )}
        </section>

        {/* Tabla de multas */}
        {!loading && multas.length === 0 && (
          <div className="text-center py-16">
            <ShieldAlert className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No hay multas registradas en el sistema.</p>
          </div>
        )}

        {!loading && multas.length > 0 && multasFiltradas.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Ninguna multa coincide con el filtro.</p>
          </div>
        )}

        {!loading && multasFiltradas.length > 0 && (
          <>
            <DataTable
              columns={columnasMultas}
              rows={multPag.paginatedItems}
              rowKey={(m) => m.id}
              onRowClick={(m) => setSelectedMulta(m)}
              empty={
                <div className="text-center py-16">
                  <ShieldAlert className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">No hay multas para mostrar con este filtro.</p>
                </div>
              }
            />
            <Pagination currentPage={multPag.page} totalPages={multPag.totalPages} onPageChange={multPag.goToPage} />
          </>
        )}
      </main>

      {/* Modal de detalle de multa */}
      <MultaDetalleModal open={!!selectedMulta} multa={selectedMulta} esAsociado={false} onClose={() => setSelectedMulta(null)} />

      <NotificarModal
        open={notificarOpen}
        onClose={() => setNotificarOpen(false)}
        tipo="MULTA"
        documento={multaNotificar}
        documentoId={multaNotificar?.id}
        asociadoId={multaNotificar?.asociadoId}
        asociadoNombre={multaNotificar?.asociado ? `${multaNotificar.asociado.nombres} ${multaNotificar.asociado.apellidos}` : undefined}
      />

      {/* Modal de pago de multa independiente */}
      {pagarOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPagarOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" /> Pagar multa
              </h4>
              <button onClick={() => setPagarOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
                <span className="sr-only">Cerrar</span>
                ✕
              </button>
            </div>
            {multaPagar && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Motivo:</strong> {multaPagar.motivo}
                </p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 text-center">{formatCOP(multaPagar.valor)}</p>
              </>
            )}
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                Método de pago <span className="text-red-500">*</span>
              </label>
              <select
                value={metodoPagoId}
                onChange={(e) => setMetodoPagoId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
              >
                <option value="">Seleccione…</option>
                {metodosPago.map((mp) => (
                  <option key={mp.id} value={mp.id}>
                    {mp.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPagarOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPago}
                disabled={pagando || !metodoPagoId}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                {pagando && <Loader2 className="w-4 h-4 animate-spin" />}
                <Wallet className="w-4 h-4" /> Confirmar pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de valor de multa */}
      {editarOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditarOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-500" /> Editar valor
              </h4>
              <button onClick={() => setEditarOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
                <span className="sr-only">Cerrar</span>
                ✕
              </button>
            </div>
            {multaEditar && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Motivo:</strong> {multaEditar.motivo}
              </p>
            )}
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                Nuevo valor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatCOPInput(nuevoValor)}
                onChange={(e) => setNuevoValor(unformatCOP(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditarOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEdicion}
                disabled={editando || !nuevoValor || Number(nuevoValor) <= 0}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                {editando && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
