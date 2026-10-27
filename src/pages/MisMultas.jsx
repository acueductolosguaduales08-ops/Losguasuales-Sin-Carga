import { useEffect, useMemo, useState } from 'react';
import { ShieldAlert, Loader2, Search, Receipt, ExternalLink, Download, FileText } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MisFinanzasAPI } from '../api/misFinanzas';
import { RecibosAPI } from '../api/recibos';
import { TesoreriaAPI } from '../api/tesoreria';
import Pagination from '../components/common/Pagination';
import usePagination from '../hooks/usePagination';
import MultaDetalleModal from '../components/multas/MultaDetalleModal';
import { formatCOP } from '../utils/formatCOP';

const ESTADO_BADGE = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  PAGADA: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  ANULADA: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600',
};

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  PAGADA: 'Pagada',
  ANULADA: 'Anulada',
};

function formatFecha(iso) {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const FILTROS = [
  { value: 'todos', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'PAGADA', label: 'Pagadas' },
  { value: 'ANULADA', label: 'Anuladas' },
];

export default function MisMultas() {
  const { usuario } = useAuth();
  const { success, error, warning, info } = useToast();

  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [reciboModal, setReciboModal] = useState(null);
  const [cargandoRecibo, setCargandoRecibo] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [descargandoMultaPdf, setDescargandoMultaPdf] = useState(null);
  const [selectedMulta, setSelectedMulta] = useState(null);

  useEffect(() => {
    if (!usuario?.asociadoId) return;
    setLoading(true);
    MisFinanzasAPI.listarMisMultas()
      .then((data) => setMultas(Array.isArray(data) ? data : []))
      .catch((err) => error("Error al cargar multas.", err.message || "Verifica tu conexión o inicia sesión de nuevo."))
      .finally(() => setLoading(false));
  }, [usuario, error]);

  const multasFiltradas = useMemo(() => {
    let resultado = multas;
    if (filtroEstado !== 'todos') {
      resultado = resultado.filter((m) => m.estado === filtroEstado);
    }
    const texto = busqueda.trim().toLowerCase();
    if (texto) {
      resultado = resultado.filter((m) => {
        const motivo = String(m.motivo || '').toLowerCase();
        const valor = String(m.valor || '').toLowerCase();
        return motivo.includes(texto) || valor.includes(texto);
      });
    }
    return resultado;
  }, [multas, filtroEstado, busqueda]);

  const multPag = usePagination(multasFiltradas || [], 10);

  const handleVerRecibo = async (multa) => {
    setCargandoRecibo(true);
    try {
      const recibo = await MisFinanzasAPI.reciboDeMulta(multa.id);
      if (recibo) {
        setReciboModal(recibo);
      } else {
        warning("Recibo no encontrado.", "Puede que no se haya generado aún. Contacta a tesorería.");
      }
    } catch {
      warning("Recibo no encontrado.", "Puede que no se haya generado aún. Contacta a tesorería.");
    } finally {
      setCargandoRecibo(false);
    }
  };

  const handleVerHtml = async () => {
    if (!reciboModal) return;
    info("Abriendo vista previa.", "Se abrirá en una nueva pestaña del navegador.");
    try {
      const html = await RecibosAPI.html(reciboModal.numeroRecibo);
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      } else {
        warning("Recibo no encontrado.", "Verifica que el navegador permita ventanas emergentes.");
      }
    } catch (err) {
      error("Error al abrir recibo.", err.message || "Intenta descargar el PDF como alternativa.");
    }
  };

  const handleDescargarPdf = async () => {
    if (!reciboModal) return;
    setDescargandoPdf(true);
    try {
      const res = await RecibosAPI.abrirPdf(reciboModal.numeroRecibo);
      if (res?.ok) success("Recibo abierto.", "Usa 'Guardar como PDF' en el diálogo de impresión.");
    } catch (err) {
      error("Error al descargar recibo.", err.message || "Verifica tu conexión e inténtalo de nuevo.");
    } finally {
      setDescargandoPdf(false);
    }
  };

  const handleDescargarMultaPdf = async (multa) => {
    setDescargandoMultaPdf(multa.id);
    try {
      await TesoreriaAPI.descargarMultaPdf(multa.id);
      success("PDF listo.", "Usa 'Guardar como PDF' en el diálogo de impresión.");
    } catch (err) {
      console.error('[MisMultas] Error al descargar PDF de multa:', err);
      error("Error al descargar multa.", err.message || "Verifica tu conexión e inténtalo de nuevo.");
    } finally {
      setDescargandoMultaPdf(null);
    }
  };

  const handleVerMultaHtml = async (multa) => {
    info("Abriendo vista previa.", "Se abrirá en una nueva pestaña del navegador.");
    try {
      const html = await TesoreriaAPI.verMultaHtml(multa.id);
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      } else {
        warning("Ventana bloqueada.", "Verifica que el navegador permita ventanas emergentes.");
      }
    } catch (err) {
      console.error('[MisMultas] Error al abrir vista previa de multa:', err);
      error("Error al abrir vista previa.", err.message || "Intenta descargar el PDF como alternativa.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header titulo="Mis Multas" />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-2 flex-wrap">
            {FILTROS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltroEstado(f.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  filtroEstado === f.value
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-muted hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-dark-muted rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
          </div>
        ) : multasFiltradas.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No tienes multas {filtroEstado !== 'todos' ? `con estado "${ESTADO_LABEL[filtroEstado].toLowerCase()}"` : ''}.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {(multPag.paginatedItems || []).map((multa) => (
                <div
                  key={multa.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-dark-muted p-4 cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                  onClick={() => setSelectedMulta(multa)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${ESTADO_BADGE[multa.estado] || ESTADO_BADGE.PENDIENTE}`}>
                          {ESTADO_LABEL[multa.estado] || multa.estado}
                        </span>
                        {multa.independiente && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                            Independiente
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{multa.motivo}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatFecha(multa.fecha)}</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{formatCOP(multa.valor)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleVerMultaHtml(multa); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Ver comprobante en línea"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDescargarMultaPdf(multa); }}
                        disabled={descargandoMultaPdf === multa.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Descargar comprobante de multa"
                      >
                        {descargandoMultaPdf === multa.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Multa
                      </button>
                      {multa.estado === 'PAGADA' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVerRecibo(multa); }}
                          disabled={cargandoRecibo}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {cargandoRecibo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                          Ver recibo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination currentPage={multPag.page} totalPages={multPag.totalPages} onPageChange={multPag.goToPage} />
          </>
        )}
      </main>

      {/* Modal de recibo */}
      {reciboModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReciboModal(null)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                {reciboModal.numeroRecibo}
              </h3>
              <button onClick={() => setReciboModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Fecha:</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">{formatFecha(reciboModal.fechaEmision)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Valor:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCOP(reciboModal.valor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Metodo:</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">{reciboModal.metodoPago || '\u2014'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                <span className={`font-semibold ${reciboModal.estado === 'ANULADO' ? 'text-red-500' : 'text-emerald-600'}`}>
                  {reciboModal.estado}
                </span>
              </div>
              {reciboModal.numeroFactura && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Factura:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{reciboModal.numeroFactura}</span>
                </div>
              )}
              {!reciboModal.numeroFactura && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300">
                    Multa independiente
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleVerHtml}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-950 hover:bg-gray-200 dark:hover:bg-dark-muted rounded-lg text-sm font-semibold text-gray-700 dark:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Ver en linea
              </button>
              <button
                onClick={handleDescargarPdf}
                disabled={descargandoPdf}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
              >
                {descargandoPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de multa detalle */}
      <MultaDetalleModal
        open={!!selectedMulta}
        multa={selectedMulta}
        esAsociado={true}
        onClose={() => setSelectedMulta(null)}
      />
    </div>
  );
}
