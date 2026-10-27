import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle, Loader2, Search, TrendingDown, DollarSign, Clock, MessageCircle
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { DeudasAPI } from '../api/deudas';
import { TesoreriaAPI } from '../api/tesoreria';
import DownloadCsvButton from '../components/common/DownloadCsvButton';
import { prepararDeudasParaExportar } from '../utils/exportarExcel';
import { formatCOP } from '../utils/formatCOP';

const AGING_COLORS = {
  'Vigente': 'bg-blue-500',
  '1-30 días': 'bg-yellow-500',
  '31-60 días': 'bg-orange-500',
  '61-90 días': 'bg-red-500',
  '90+ días': 'bg-red-700',
};

// Recordatorio de cobro por WhatsApp: mensaje listo con número de
// factura, saldo y días vencidos; el número se normaliza a +57.
function waCobro(d) {
  const t = String(d.telefono || '').replace(/\D/g, '');
  if (!t) return null;
  const num = t.startsWith('57') ? t : `57${t}`;
  const texto = `Buenos días ${d.asociadoNombre.split(' ')[0] || ''}, le recordamos la factura ${d.numeroFactura} con saldo pendiente de ${formatCOP(d.saldoPendiente)}${d.diasVencimiento > 0 ? ` (vencida hace ${d.diasVencimiento} días)` : ''}. ¡Gracias!`;
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
}

export default function DeudasCartera() {
  const { rol } = useAuth();
  const puedeGestionar = rol === 'ADMINISTRADOR' || rol === 'TESORERO';
  const { error } = useToast();
  const [datos, setDatos] = useState(null);
  const [multasEstadisticas, setMultasEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [filtroAging, setFiltroAging] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [carteraData, multasData] = await Promise.all([
        DeudasAPI.obtenerCartera(),
        TesoreriaAPI.estadisticasMultas(),
      ]);
      setDatos(carteraData);
      setMultasEstadisticas(multasData);
    } catch (err) {
      error("Error al cargar cartera.", err.message || "Verifica tu conexión e inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }, [error]);

  useEffect(() => {
    if (puedeGestionar) cargar();
  }, [puedeGestionar]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!puedeGestionar) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <AlertTriangle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores y tesoreros pueden ver la cartera de deudas.
          </p>
        </main>
      </div>
    );
  }

  const detalle = (datos?.detalle || []).filter(d => {
    if (filtroAging && d.rangoAging !== filtroAging) return false;
    if (filtro) {
      const q = filtro.toLowerCase();
      return (d.asociadoNombre || '').toLowerCase().includes(q) ||
             (d.numeroFactura || '').toLowerCase().includes(q) ||
             (d.numeroMedidor || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-red-600 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Deudas y Cartera</h1>
          </div>
          <DownloadCsvButton
            data={detalle}
            preparar={prepararDeudasParaExportar}
            filename="deudas-cartera"
            label="Descargar CSV"
          />
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : !datos ? null : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs">Facturas vencidas</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{datos.totalFacturasVencidas}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs">Monto total vencido</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{formatCOP(datos.montoTotalVencido)}</p>
              </div>
              {multasEstadisticas && (
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs">Multas pendientes</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-600">{multasEstadisticas.pendientes}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatCOP(multasEstadisticas.totalValorPendiente)}</p>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-800 mb-6">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" /> Aging de la cartera
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(datos.aging || []).map(g => (
                  <button
                    key={g.rango}
                    onClick={() => setFiltroAging(filtroAging === g.rango ? '' : g.rango)}
                    className={`rounded-lg p-2 sm:p-3 text-center border-2 transition-all ${
                      filtroAging === g.rango
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${AGING_COLORS[g.rango]}`} />
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{g.rango}</p>
                    <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">{g.cantidad}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{formatCOP(g.monto)}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por asociado, factura o medidor..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-white/10 dark:text-white"
                  />
                </div>
              </div>

              {detalle.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  No hay facturas vencidas.
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Factura</th>
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Asociado</th>
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Medidor</th>
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">Total</th>
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">Pagado</th>
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">Saldo</th>
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">Días venc.</th>
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Aging</th>
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">WhatsApp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {detalle.map(d => (
                          <tr key={d.facturaId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 font-mono text-xs">{d.numeroFactura}</td>
                            <td className="px-4 py-3">{d.asociadoNombre}</td>
                            <td className="px-4 py-3 font-mono text-xs">{d.numeroMedidor}</td>
                            <td className="px-4 py-3 text-right">{formatCOP(d.total)}</td>
                            <td className="px-4 py-3 text-right text-green-600">{formatCOP(d.totalPagado)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCOP(d.saldoPendiente)}</td>
                            <td className="px-4 py-3 text-right">{d.diasVencimiento}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${AGING_COLORS[d.rangoAging]}`}>{d.rangoAging}</span>
                            </td>
                            <td className="px-4 py-3">
                              {(() => {
                                const wa = waCobro(d);
                                if (!wa) return <span className="text-xs text-gray-400">Sin teléfono</span>;
                                return (
                                  <a
                                    href={wa}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`Recordar pago por WhatsApp a ${d.asociadoNombre}`}
                                    title={`Recordar pago a ${d.asociadoNombre}`}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" /> Recordar
                                  </a>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile cards */}
                  <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
                    {detalle.map(d => (
                      <div key={d.facturaId} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-mono text-xs text-gray-500">{d.numeroFactura}</p>
                            <p className="font-medium truncate">{d.asociadoNombre}</p>
                            <p className="font-mono text-xs text-gray-400">Medidor: {d.numeroMedidor}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white shrink-0 ${AGING_COLORS[d.rangoAging]}`}>{d.rangoAging}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div><span className="text-gray-500 text-xs">Total</span><p>{formatCOP(d.total)}</p></div>
                          <div><span className="text-gray-500 text-xs">Pagado</span><p className="text-green-600">{formatCOP(d.totalPagado)}</p></div>
                          <div><span className="text-gray-500 text-xs">Saldo</span><p className="font-semibold text-red-600">{formatCOP(d.saldoPendiente)}</p></div>
                        </div>
                        <p className="text-xs text-gray-400">Vencido: {d.diasVencimiento} días</p>
                        {(() => {
                          const wa = waCobro(d);
                          if (!wa) return null;
                          return (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Recordar pago por WhatsApp a ${d.asociadoNombre}`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> Recordar por WhatsApp
                            </a>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
