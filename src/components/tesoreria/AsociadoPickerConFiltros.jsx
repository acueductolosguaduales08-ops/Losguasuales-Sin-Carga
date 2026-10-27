import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, UserRound, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AsociadosAPI } from '../../api/asociados';
import { FacturasAPI } from '../../api/facturas';

// Estados de factura que cuentan como "pendiente" para este filtro. Un pago
// PARCIAL sigue contando como pendiente (el asociado aún debe algo), no
// como al día — así lo pidió específicamente el usuario.
const ESTADOS_CON_DEUDA = ['PENDIENTE', 'PAGADA_PARCIAL', 'VENCIDA'];

// Picker de asociados especializado para "Registrar pago": a diferencia del
// AsociadoPicker genérico (que solo muestra resultados al escribir), este
// muestra la lista completa de una vez, con dos filtros rápidos de color
// distinto — "Con facturas pendientes" y "Sin facturas pendientes" — para
// no depender de que el tesorero ya sepa a quién buscar.
export default function AsociadoPickerConFiltros({ value, onChange, autoFocus = false }) {
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState('pendientes'); // 'pendientes' | 'sin_pendientes' | null (todos)
  const [asociados, setAsociados] = useState([]);
  const [idsConDeuda, setIdsConDeuda] = useState(new Set());
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (value) return;
    setCargando(true);
    Promise.all([
      AsociadosAPI.buscar('', { size: 1000 }),
      Promise.all(ESTADOS_CON_DEUDA.map((e) => FacturasAPI.listarPorEstado(e).catch(() => ({ content: [] })))),
    ])
      .then(([resAsociados, resFacturasPorEstado]) => {
        const listaAsociados = Array.isArray(resAsociados) ? resAsociados : resAsociados?.content || [];
        setAsociados(listaAsociados);

        const ids = new Set();
        resFacturasPorEstado.forEach((r) => {
          const lista = Array.isArray(r) ? r : r?.content || [];
          lista.forEach((f) => ids.add(f.asociadoId));
        });
        setIdsConDeuda(ids);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [value]);

  const totalConDeuda = idsConDeuda.size;
  const totalSinDeuda = Math.max(asociados.length - totalConDeuda, 0);

  const listaFiltrada = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return asociados.filter((a) => {
      const tieneDeuda = idsConDeuda.has(a.id);
      if (filtro === 'pendientes' && !tieneDeuda) return false;
      if (filtro === 'sin_pendientes' && tieneDeuda) return false;
      if (!t) return true;
      const nombreCompleto = `${a.nombres} ${a.apellidos}`.toLowerCase();
      return nombreCompleto.includes(t) || String(a.documento || '').toLowerCase().includes(t);
    });
  }, [asociados, idsConDeuda, filtro, texto]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 bg-brand/10 border border-brand/30 rounded-lg px-4 py-2.5">
        <div className="min-w-0 flex items-center gap-2">
          <UserRound className="w-4 h-4 text-brand shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand dark:text-brand-light truncate">
              {value.nombres} {value.apellidos}
            </p>
            <p className="text-[11px] text-brand/70 dark:text-brand-light/70 font-mono">{value.documento}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 text-brand hover:text-brand-dark dark:text-brand-light"
          aria-label="Cambiar asociado"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Filtros de color distinto: rojo/ámbar para quien debe, verde para
          quien está al día. Un pago parcial sigue contando como "pendiente". */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setFiltro(filtro === 'pendientes' ? null : 'pendientes')}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
            filtro === 'pendientes'
              ? 'bg-red-500 border-red-500 text-white'
              : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" /> Con pendientes ({totalConDeuda})
        </button>
        <button
          type="button"
          onClick={() => setFiltro(filtro === 'sin_pendientes' ? null : 'sin_pendientes')}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
            filtro === 'sin_pendientes'
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Sin pendientes ({totalSinDeuda})
        </button>
      </div>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-1">
        Un pago parcial cuenta como pendiente. Toca un filtro otra vez para ver a todos.
      </p>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          autoFocus={autoFocus}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Filtrar por nombre o documento…"
          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
        />
      </div>

      {cargando ? (
        <div className="flex items-center gap-2 text-gray-400 text-xs px-1 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando asociados…
        </div>
      ) : listaFiltrada.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-lg divide-y divide-gray-200 dark:divide-dark-muted overflow-hidden max-h-64 overflow-y-auto">
          {listaFiltrada.slice(0, 60).map((a) => {
            const tieneDeuda = idsConDeuda.has(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onChange(a)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors flex items-center gap-2"
              >
                <UserRound className="w-4 h-4 text-brand/70 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 dark:text-white truncate">
                    {a.nombres} {a.apellidos}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">{a.documento}</p>
                </div>
                <span
                  className={`shrink-0 w-2 h-2 rounded-full ${tieneDeuda ? 'bg-red-500' : 'bg-emerald-500'}`}
                  title={tieneDeuda ? 'Tiene facturas pendientes' : 'Sin facturas pendientes'}
                />
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500 px-1 py-2">Ningún asociado coincide.</p>
      )}
    </div>
  );
}
