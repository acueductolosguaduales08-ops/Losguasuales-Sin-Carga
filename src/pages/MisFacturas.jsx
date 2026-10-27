import { useEffect, useState } from 'react';
import { FileText, Loader2, AlertTriangle, Droplet } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FacturasAPI } from '../api/facturas';
import { MisFinanzasAPI } from '../api/misFinanzas';
import FacturaCard from '../components/facturas/FacturaCard';
import FacturaDetalleModal from '../components/facturas/FacturaDetalleModal';
import { formatCOP } from '../utils/formatCOP';

// Historial de facturas del propio asociado autenticado
// (GET /api/v1/facturas/asociado/{asociadoId}, restringido a @asociadoSecurity.esPropio).
export default function MisFacturas() {
  const { usuario, rol } = useAuth();
  const { success, error } = useToast();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [facturaDetalle, setFacturaDetalle] = useState(null);
  const [descargandoId, setDescargandoId] = useState(null);
  const [saldo, setSaldo] = useState(null);

  const asociadoId = usuario?.asociadoId;

  useEffect(() => {
    if (rol !== 'ASOCIADO' || !asociadoId) return;
    MisFinanzasAPI.miSaldo()
      .then(setSaldo)
      .catch(() => setSaldo(null));
  }, [rol, asociadoId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (rol !== 'ASOCIADO' || !asociadoId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    FacturasAPI.listarPorAsociado(asociadoId)
      .then((data) => setFacturas(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => error("Error al cargar facturas.", err.message || "Verifica tu conexión o inicia sesión de nuevo."))
      .finally(() => setLoading(false));
  }, [rol, asociadoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDescargarPdf = async (factura) => {
    setDescargandoId(factura.id);
    try {
      await FacturasAPI.descargarPdf(factura.id);
      success('Factura abierta', 'Usa "Guardar como PDF" en el diálogo de impresión.');
    } catch (err) {
      error("Error al descargar PDF.", err.message || "Intenta de nuevo o contacta al administrador.");
    } finally {
      setDescargandoId(null);
    }
  };

  if (rol !== 'ASOCIADO') {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Sección exclusiva de asociados</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Inicia sesión con tu cuenta de asociado para ver tu historial de facturas.
          </p>
        </main>
      </div>
    );
  }

  const facturasOrdenadas = [...facturas].sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision));
  const saldoTotal = facturas.reduce((acc, f) => acc + (f.estado !== 'ANULADA' ? f.saldoPendiente || 0 : 0), 0);

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mis facturas</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Historial completo de tu servicio de acueducto</p>
            </div>
          </div>
          {!loading && facturas.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl px-4 py-2.5 text-right shrink-0">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Saldo total pendiente</p>
              <p className="text-lg font-black text-red-600 dark:text-red-400">
                {formatCOP(saldoTotal)}
              </p>
            </div>
          )}
        </section>

        {saldo && saldo.saldoTotal > 0 && (
          <section className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {saldo.vencidasCount > 0 && (
              <div className="col-span-2 md:col-span-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300 font-semibold">
                  Tienes {saldo.vencidasCount} factura{saldo.vencidasCount > 1 ? 's' : ''} vencida{saldo.vencidasCount > 1 ? 's' : ''}. Paga lo antes posible para evitar la suspensión del servicio.
                </p>
              </div>
            )}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-4">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Saldo total</p>
              <p className="text-xl font-black text-gray-800 dark:text-white">{formatCOP(saldo.saldoTotal)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-4">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Droplet className="w-3 h-3 text-sky-500" /> Facturas
              </p>
              <p className="text-xl font-black text-sky-600 dark:text-sky-400">{formatCOP(saldo.saldoFacturas)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-4">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Multas pendientes</p>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400">{formatCOP(saldo.saldoMultas)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-4">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vencidas</p>
              <p className={`text-xl font-black ${saldo.vencidasCount > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-gray-300'}`}>
                {saldo.vencidasCount}
              </p>
            </div>
          </section>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando tus facturas…</span>
          </div>
        )}

        {!loading && facturasOrdenadas.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Aún no tienes facturas registradas.</p>
          </div>
        )}

        {!loading && facturasOrdenadas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facturasOrdenadas.map((f) => (
              <FacturaCard
                key={f.id}
                factura={f}
                mostrarAsociado={false}
                onVerDetalle={(fac) => {
                  setFacturaDetalle(fac);
                  setDetalleOpen(true);
                }}
                onDescargarPdf={handleDescargarPdf}
                descargandoPdf={descargandoId === f.id}
              />
            ))}
          </div>
        )}
      </main>

      <FacturaDetalleModal open={detalleOpen} factura={facturaDetalle} onClose={() => setDetalleOpen(false)} />
    </div>
  );
}
