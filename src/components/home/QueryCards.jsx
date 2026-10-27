import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Loader2, CheckCircle2, XCircle, QrCode, ScanLine, Receipt, FileText, ExternalLink, Wallet, Download } from 'lucide-react';
import { HomeAPI } from '../../api/home';
import { useAuth } from '../../context/AuthContext';
import { formatCOP } from '../../utils/formatCOP';

const ESTADO_STYLE = {
  ACTIVO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  SUSPENDIDO: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  INACTIVO: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  PENDIENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  PAGADA: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  PAGADA_PARCIAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  VENCIDA: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  ANULADA: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  EMITIDO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export default function QueryCards() {
  const navigate = useNavigate();
  const { isAuthenticated, rol } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [documento, setDocumento] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const [numeroDoc, setNumeroDoc] = useState('');
  const [tipoDoc, setTipoDoc] = useState('factura'); // 'factura' | 'recibo'
  const [qrLoading, setQrLoading] = useState(false);
  const [qrResultado, setQrResultado] = useState(null);
  const [qrError, setQrError] = useState(null);

  // Cuando se viene del escáner QR (navigate(`/?factura=...` o `/?recibo=...`)),
  // precargamos el número detectado en el input para no perderlo al salir de la cámara.
  useEffect(() => {
    const factura = searchParams.get('factura');
    const recibo = searchParams.get('recibo');
    if (!factura && !recibo) return;

    setTipoDoc(factura ? 'factura' : 'recibo');
    setNumeroDoc(factura || recibo);
    setSearchParams({}, { replace: true });

    requestAnimationFrame(() => {
      document.getElementById('consulta')?.scrollIntoView({ behavior: 'smooth' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documento.trim()) return;
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const data = await HomeAPI.estadoServicio(documento.trim());
      setResultado(data);
    } catch (err) {
      setError(err?.message || 'No se encontró un asociado con ese número de documento.');
    } finally {
      setLoading(false);
    }
  };

  const handleQrSubmit = async (e) => {
    e.preventDefault();
    if (!numeroDoc.trim()) return;
    setQrLoading(true);
    setQrError(null);
    setQrResultado(null);
    try {
      const data =
        tipoDoc === 'factura'
          ? await HomeAPI.consultarFactura(numeroDoc.trim())
          : await HomeAPI.consultarRecibo(numeroDoc.trim());
      setQrResultado({ ...data, _tipo: tipoDoc });
    } catch (err) {
      setQrError(err?.message || 'No se pudo completar la consulta. Intenta de nuevo.');
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <section id="consulta" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Consulta de estado del servicio */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 transition-shadow duration-300 hover:shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-4 h-4 text-brand" />
          <h3 className="font-bold text-gray-800 dark:text-white text-sm">Consultar estado del servicio</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Ingresa tu número de documento para ver el estado de tu servicio.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            placeholder="Número de documento"
            className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white rounded-xl transition-colors flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </form>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-500">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resultado && (
          <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">Estado del servicio</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Documento verificado</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_STYLE[resultado.estadoServicio] || ESTADO_STYLE.INACTIVO}`}>
              <CheckCircle2 className="w-3 h-3 inline -mt-0.5 mr-1" />
              {resultado.estadoServicio}
            </span>
          </div>
        )}
      </div>

      {/* Consulta de factura/recibo (equivalente a escanear el QR) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 transition-shadow duration-300 hover:shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <ScanLine className="w-4 h-4 text-brand" />
          <h3 className="font-bold text-gray-800 dark:text-white text-sm">Consultar factura o recibo</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Escribe el número que aparece en tu documento o en el QR impreso.
        </p>

        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setTipoDoc('factura')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              tipoDoc === 'factura' ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Factura
          </button>
          <button
            type="button"
            onClick={() => setTipoDoc('recibo')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              tipoDoc === 'recibo' ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> Recibo
          </button>
        </div>

        <form onSubmit={handleQrSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={numeroDoc}
              onChange={(e) => setNumeroDoc(e.target.value)}
              placeholder={tipoDoc === 'factura' ? 'FAC-000001' : 'REC-000001'}
              className="w-full pl-3 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={qrLoading || !numeroDoc.trim()}
              title="Confirmar / buscar"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 dark:text-gray-500 hover:text-brand disabled:opacity-40 disabled:hover:text-gray-400 transition-colors rounded-lg"
            >
              {qrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigate('/escanear-qr')}
            title="Escanear con la cámara"
            className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl transition-colors flex items-center justify-center shrink-0"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </form>

        {qrError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-500">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{qrError}</span>
          </div>
        )}

        {qrResultado && (
          <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800 dark:text-white">
                {qrResultado._tipo === 'factura' ? qrResultado.numeroFactura : qrResultado.numeroRecibo}
              </p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_STYLE[qrResultado.estado] || ESTADO_STYLE.PENDIENTE}`}>
                {qrResultado.estado}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-1 border-t border-gray-200 dark:border-white/10">
              <span className="text-gray-500 dark:text-gray-400">
                {qrResultado._tipo === 'factura' ? 'Saldo pendiente' : 'Valor pagado'}
              </span>
              <span className="font-bold text-gray-800 dark:text-white">
                {formatCOP(qrResultado._tipo === 'factura' ? qrResultado.saldoPendiente : qrResultado.valor)}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
