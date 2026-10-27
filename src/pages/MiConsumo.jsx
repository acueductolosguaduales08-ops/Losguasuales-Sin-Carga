import { useCallback, useEffect, useState } from 'react';
import {
  Droplet, Loader2, TrendingUp, TrendingDown, Calendar, Gauge, CheckCircle2, AlertTriangle
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MisFinanzasAPI } from '../api/misFinanzas';

function formatM3(valor) {
  return `${Number(valor || 0).toLocaleString('es-CO')} m³`;
}

export default function MiConsumo() {
  const { usuario, rol } = useAuth();
  const { error } = useToast();
  const [lecturas, setLecturas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await MisFinanzasAPI.listarMiConsumo();
      setLecturas(Array.isArray(data) ? data : []);
    } catch (err) {
      error("Error al cargar consumo.", err.message || "Verifica tu conexión e inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }, [error]);

  useEffect(() => { cargar(); }, [cargar]);

  if (rol !== 'ASOCIADO') {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <Droplet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Sección exclusiva de asociados</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Inicia sesión con tu cuenta de asociado para ver tu consumo de agua.
          </p>
        </main>
      </div>
    );
  }

  const totalConsumo = lecturas.reduce((acc, l) => acc + (l.consumoM3 || 0), 0);
  const promedio = lecturas.length > 0 ? Math.round(totalConsumo / lecturas.length) : 0;
  const maxConsumo = lecturas.length > 0 ? Math.max(...lecturas.map(l => l.consumoM3 || 0)) : 0;
  const minConsumo = lecturas.length > 0 ? Math.min(...lecturas.map(l => l.consumoM3 || 0)) : 0;

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <section className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Droplet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Mi consumo</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Historial de lecturas y consumo de agua</p>
          </div>
        </section>

        {cargando ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando tu consumo…</span>
          </div>
        ) : lecturas.length === 0 ? (
          <div className="text-center py-16">
            <Droplet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Aún no tienes lecturas registradas.</p>
          </div>
        ) : (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <Droplet className="w-4 h-4 text-sky-500" />
                  <span className="text-xs">Consumo total</span>
                </div>
                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{formatM3(totalConsumo)}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <Gauge className="w-4 h-4 text-brand" />
                  <span className="text-xs">Promedio mensual</span>
                </div>
                <p className="text-2xl font-bold text-brand">{formatM3(promedio)}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  <span className="text-xs">Máximo</span>
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatM3(maxConsumo)}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs">Mínimo</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatM3(minConsumo)}</p>
              </div>
            </div>

            {/* Historial */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-500" /> Historial de lecturas
                </h3>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Período</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Fecha</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">Lectura anterior</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">Lectura actual</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">Consumo</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {lecturas.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium">{l.nombreMes} {l.anioContable}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                          {new Date(l.fechaLectura).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">{l.lecturaAnterior?.toLocaleString('es-CO')}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs">{l.lecturaActual?.toLocaleString('es-CO')}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          <span className={l.consumoM3 > 20 ? 'text-red-600 dark:text-red-400' : 'text-sky-600 dark:text-sky-400'}>
                            {formatM3(l.consumoM3)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {l.facturaGenerada ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" /> Facturado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="w-3 h-3" /> Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
                {lecturas.map((l) => (
                  <div key={l.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{l.nombreMes} {l.anioContable}</p>
                        <p className="text-xs text-gray-400">{new Date(l.fechaLectura).toLocaleDateString('es-CO')}</p>
                      </div>
                      {l.facturaGenerada ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Facturado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shrink-0">
                          <AlertTriangle className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs">Anterior</span>
                        <p className="font-mono text-xs">{l.lecturaAnterior?.toLocaleString('es-CO')}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Actual</span>
                        <p className="font-mono text-xs">{l.lecturaActual?.toLocaleString('es-CO')}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Consumo</span>
                        <p className={`font-semibold ${l.consumoM3 > 20 ? 'text-red-600 dark:text-red-400' : 'text-sky-600 dark:text-sky-400'}`}>
                          {formatM3(l.consumoM3)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
