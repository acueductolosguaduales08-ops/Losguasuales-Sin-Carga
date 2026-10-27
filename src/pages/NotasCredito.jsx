import { useCallback, useEffect, useState } from 'react';
import {
  Plus, Filter, ChevronLeft, ChevronRight, Loader2, CreditCard,
  CheckCircle2, XCircle, Search
} from 'lucide-react';
import Header from '../components/layout/Header';
import SimpleModal from '../components/encuestas/SimpleModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { NotasCreditoAPI, ESTADOS_NOTA_CREDITO } from '../api/notasCredito';
import { AsociadosAPI } from '../api/asociados';
import DownloadCsvButton from '../components/common/DownloadCsvButton';
import { prepararNotasCreditoParaExportar } from '../utils/exportarExcel';
import { formatCOP, formatCOPInput, unformatCOP } from '../utils/formatCOP';

export default function NotasCredito() {
  const { usuario } = useAuth();
  const { success, error, warning } = useToast();
  const esAdmin = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'TESORERO';

  const [notas, setNotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarCrear, setMostrarCrear] = useState(false);

  const cargarNotas = useCallback(async () => {
    setCargando(true);
    try {
      const params = { page: pagina, size: 10, sort: 'fechaEmision,desc' };
      const res = await NotasCreditoAPI.listar(params);
      setNotas(res.content || []);
      setTotalPaginas(res.totalPages || 0);
    } catch (err) {
      error(err.message || 'Error al cargar notas de crédito.', 'No se pudieron obtener las notas del servidor.');
    } finally {
      setCargando(false);
    }
  }, [pagina, error]);

  useEffect(() => { cargarNotas(); }, [cargarNotas]);

  const handleAplicar = async (nc) => {
    if (!window.confirm(`Aplicar nota de credito ${nc.numeroNota} por ${formatCOP(nc.valor)} a la factura ${nc.numeroFactura}?`)) return;
    try {
      await NotasCreditoAPI.aplicar(nc.id);
      success("Nota de crédito aplicada.", "El saldo de la factura ha sido ajustado.");
      cargarNotas();
    } catch (err) {
      error(err.message || 'Error al aplicar nota de crédito.', 'No se pudo ajustar el saldo de la factura.');
    }
  };

  const handleAnular = async (nc) => {
    const motivo = prompt('Motivo de anulacion:');
    if (motivo === null) return;
    try {
      await NotasCreditoAPI.anular(nc.id, motivo || 'Sin motivo');
      success("Nota de crédito anulada.", "Ya no se encuentra vigente.");
      cargarNotas();
    } catch (err) {
      error(err.message || 'Error al anular nota de crédito.', 'La nota sigue con su estado actual.');
    }
  };

  const estadoBadge = (estado) => {
    const styles = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      APLICADA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      ANULADA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[estado] || ''}`}>
        {estado}
      </span>
    );
  };

  const notasFiltradas = notas.filter(nc => {
    if (filtroEstado && nc.estado !== filtroEstado) return false;
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (nc.numeroNota || '').toLowerCase().includes(q) ||
           (nc.asociadoNombre || '').toLowerCase().includes(q) ||
           (nc.motivo || '').toLowerCase().includes(q);
  });

  if (!esAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <CreditCard className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores y tesoreros pueden gestionar notas de crédito.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-emerald-600 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Notas de Credito</h1>
          </div>
          {esAdmin && (
            <div className="flex items-center gap-2">
              <DownloadCsvButton
                data={notasFiltradas}
                preparar={prepararNotasCreditoParaExportar}
                filename="notas-credito"
                label="Descargar CSV"
              />
              <button
                onClick={() => setMostrarCrear(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm shrink-0"
              >
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva Nota de Credito</span><span className="sm:hidden">Nueva</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por numero, asociado o motivo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-white/10 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filtroEstado}
                onChange={(e) => { setFiltroEstado(e.target.value); setPagina(0); }}
                className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-white/10 dark:text-white"
              >
                <option value="">Todos</option>
                {ESTADOS_NOTA_CREDITO.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {cargando ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          ) : notasFiltradas.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron notas de credito.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Numero</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Asociado</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Motivo</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Valor</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Factura</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Estado</th>
                      <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Fecha</th>
                      {esAdmin && <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {notasFiltradas.map(nc => (
                      <tr key={nc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-mono text-xs">{nc.numeroNota}</td>
                        <td className="px-4 py-3">{nc.asociadoNombre}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate">{nc.motivo}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400">{formatCOP(nc.valor)}</td>
                        <td className="px-4 py-3 font-mono text-xs">{nc.numeroFactura || '—'}</td>
                        <td className="px-4 py-3">{estadoBadge(nc.estado)}</td>
                        <td className="px-4 py-3 text-gray-500">{nc.fechaEmision}</td>
                        {esAdmin && (
                          <td className="px-4 py-3">
                            {nc.estado === 'PENDIENTE' && (
                              <div className="flex gap-1">
                                <button onClick={() => handleAplicar(nc)} className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400" title="Aplicar">
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleAnular(nc)} className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" title="Anular">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
                {notasFiltradas.map(nc => (
                  <div key={nc.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-gray-500">{nc.numeroNota}</p>
                        <p className="font-medium truncate">{nc.asociadoNombre}</p>
                      </div>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">{formatCOP(nc.valor)}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{nc.motivo}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {estadoBadge(nc.estado)}
                        <span className="text-xs text-gray-400">{nc.fechaEmision}</span>
                      </div>
                      {esAdmin && nc.estado === 'PENDIENTE' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleAplicar(nc)} className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400" title="Aplicar">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleAnular(nc)} className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" title="Anular">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setPagina(p => Math.max(0, p - 1))}
                disabled={pagina === 0}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500">Pagina {pagina + 1} de {totalPaginas}</span>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
                disabled={pagina >= totalPaginas - 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      {mostrarCrear && (
        <CrearNotaCreditoModal onClose={() => setMostrarCrear(false)} onCreada={() => { setMostrarCrear(false); cargarNotas(); }} warning={warning} error={error} />
      )}
    </div>
  );
}

function CrearNotaCreditoModal({ onClose, onCreada, warning, error }) {
  const [asociados, setAsociados] = useState([]);
  const [form, setForm] = useState({ asociadoId: '', facturaId: '', motivo: '', valor: '', observaciones: '' });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    AsociadosAPI.buscar(undefined, { page: 0, size: 500 }).then(res => setAsociados(res.content || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.asociadoId || !form.motivo || !form.valor) {
      warning("Campos obligatorios.", "Ingresa el asociado, motivo y valor.");
      return;
    }
    setEnviando(true);
    try {
      await NotasCreditoAPI.crear({
        asociadoId: form.asociadoId,
        facturaId: form.facturaId || null,
        motivo: form.motivo,
        valor: Number(form.valor),
        observaciones: form.observaciones || null,
      });
      onCreada();
    } catch (err) {
      error(err.message || 'Error al crear nota de crédito.', 'No se pudo registrar la nota de crédito.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SimpleModal open={true} title="Nueva Nota de Credito" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Asociado *</label>
          <select
            value={form.asociadoId}
            onChange={(e) => setForm({ ...form, asociadoId: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-white/10 dark:text-white"
            required
          >
            <option value="">Seleccionar asociado</option>
            {asociados.map(a => (
              <option key={a.id} value={a.id}>{a.nombreCompleto} ({a.numeroDocumento})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Factura (opcional)</label>
          <input
            type="text"
            placeholder="ID de factura si aplica"
            value={form.facturaId}
            onChange={(e) => setForm({ ...form, facturaId: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-white/10 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Motivo *</label>
          <input
            type="text"
            placeholder="Motivo de la nota de credito"
            value={form.motivo}
            onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-white/10 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Valor *</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={formatCOPInput(form.valor)}
            onChange={(e) => setForm({ ...form, valor: unformatCOP(e.target.value) })}
            className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-white/10 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Observaciones</label>
          <textarea
            placeholder="Observaciones adicionales..."
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-white/10 dark:text-white"
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            Cancelar
          </button>
          <button type="submit" disabled={enviando} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {enviando ? 'Creando...' : 'Crear Nota de Credito'}
          </button>
        </div>
      </form>
    </SimpleModal>
  );
}
