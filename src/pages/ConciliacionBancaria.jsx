import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Building2, Loader2, Upload, CheckCircle2, XCircle, AlertTriangle, Search, RefreshCw
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ConciliacionAPI } from '../api/conciliacion';
import DownloadCsvButton from '../components/common/DownloadCsvButton';
import { prepararConciliacionParaExportar } from '../utils/exportarExcel';
import { formatCOP } from '../utils/formatCOP';

export default function ConciliacionBancaria() {
  const { rol } = useAuth();
  const puedeGestionar = rol === 'ADMINISTRADOR' || rol === 'TESORERO';
  const { success, error, warning, info } = useToast();
  const fileRef = useRef();
  const [resumen, setResumen] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [filtro, setFiltro] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [r, m] = await Promise.all([
        ConciliacionAPI.resumen(),
        ConciliacionAPI.listarTodos(),
      ]);
      setResumen(r);
      setMovimientos(m);
    } catch (err) {
      error(err.message || 'Error al cargar conciliación.', 'Comprueba tu conexión e inténtalo de nuevo.');
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
          <Building2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores y tesoreros pueden conciliar la cuenta bancaria.
          </p>
        </main>
      </div>
    );
  }

  const handleUpload = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append('archivo', archivo);
      const res = await ConciliacionAPI.importarExtracto(fd);
      if (res.errores > 0) {
        warning(`Importación parcial.`, `${res.importados} registros importados, ${res.errores} con errores.`);
      } else {
        success(`Extracto importado.`, `${res.importados} registros cargados correctamente.`);
      }
      cargar();
    } catch (err) {
      info(err.message || 'Error al importar extracto.', 'Verifica el formato del archivo CSV.');
    } finally {
      setSubiendo(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleConciliar = async (bancarioId) => {
    const tesoreriaId = prompt('ID del movimiento de tesoreria con el que desea conciliar:');
    if (!tesoreriaId) return;
    try {
      await ConciliacionAPI.conciliar(bancarioId, tesoreriaId);
      success("Movimiento conciliado.", "Vinculado con el registro de tesorería correctamente.");
      cargar();
    } catch (err) {
      error(err.message || 'Error al conciliar.', 'Selecciona otro movimiento de tesorería.');
    }
  };

  const handleSinCoincidencia = async (bancarioId) => {
    try {
      await ConciliacionAPI.marcarSinCoincidencia(bancarioId);
      success("Movimiento marcado.", "Sin coincidencia con tesorería registrada.");
      cargar();
    } catch (err) {
      error(err.message || 'Error al actualizar movimiento.', 'No se pudo marcar el movimiento sin coincidencia.');
    }
  };

  const estadoBadge = (estado) => {
    const s = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      CONCILIADO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      SIN_COINCIDENCIA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s[estado] || ''}`}>{estado}</span>;
  };

  const filtrados = movimientos.filter(m => {
    if (!filtro) return true;
    const q = filtro.toLowerCase();
    return (m.descripcion || '').toLowerCase().includes(q) ||
           (m.numeroReferencia || '').toLowerCase().includes(q) ||
           (m.archivoOrigen || '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-7 h-7 text-emerald-600 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Conciliacion Bancaria</h1>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleUpload}
              className="hidden"
              id="upload-extracto"
            />
            <DownloadCsvButton
              data={filtrados}
              preparar={prepararConciliacionParaExportar}
              filename="conciliacion-bancaria"
              label="Descargar CSV"
            />
            <label
              htmlFor="upload-extracto"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer text-sm shrink-0"
            >
              {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span className="hidden sm:inline">{subiendo ? 'Importando...' : 'Importar extracto CSV'}</span>
              <span className="sm:hidden">{subiendo ? 'Importando...' : 'Importar'}</span>
            </label>
            <button onClick={cargar} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : (
          <>
            {resumen && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">Total registros</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{resumen.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-yellow-500 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Pendientes</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{resumen.pendientes}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-green-500 mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Conciliados</p>
                  <p className="text-2xl font-bold text-green-600">{resumen.conciliados}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-red-500 mb-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> Sin coincidencia</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{resumen.sinCoincidencia}</p>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por descripcion, referencia o archivo..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-white/10 dark:text-white"
                  />
                </div>
              </div>

              {filtrados.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  No hay movimientos bancarios.
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Fecha</th>
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Descripcion</th>
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">Valor</th>
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Referencia</th>
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Estado</th>
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Archivo</th>
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {filtrados.map(m => (
                          <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 text-sm">{m.fechaTransaccion}</td>
                            <td className="px-4 py-3 max-w-[250px] truncate">{m.descripcion}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatCOP(m.valor)}</td>
                            <td className="px-4 py-3 font-mono text-xs">{m.numeroReferencia || '—'}</td>
                            <td className="px-4 py-3">{estadoBadge(m.estado)}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">{m.archivoOrigen}</td>
                            <td className="px-4 py-3">
                              {m.estado === 'PENDIENTE' && (
                                <div className="flex gap-1">
                                  <button onClick={() => handleConciliar(m.id)} className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400" title="Conciliar">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleSinCoincidencia(m.id)} className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" title="Sin coincidencia">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile cards */}
                  <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
                    {filtrados.map(m => (
                      <div key={m.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">{m.fechaTransaccion}</p>
                            <p className="font-medium truncate">{m.descripcion}</p>
                          </div>
                          <span className="font-semibold shrink-0">{formatCOP(m.valor)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {estadoBadge(m.estado)}
                            {m.numeroReferencia && <span className="font-mono text-xs text-gray-400">{m.numeroReferencia}</span>}
                          </div>
                          {m.estado === 'PENDIENTE' && (
                            <div className="flex gap-1">
                              <button onClick={() => handleConciliar(m.id)} className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400" title="Conciliar">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleSinCoincidencia(m.id)} className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" title="Sin coincidencia">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        {m.archivoOrigen && <p className="text-xs text-gray-400">Archivo: {m.archivoOrigen}</p>}
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
