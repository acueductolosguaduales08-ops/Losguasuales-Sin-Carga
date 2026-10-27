import { useEffect, useState } from 'react';
import { Search, Loader2, UserRound, X } from 'lucide-react';
import { AsociadosAPI } from '../../api/asociados';

// Buscador de asociados con debounce, reutilizado en los formularios de tesorería
// (pagos, multas, ingresos/gastos) y en la consulta de recibos por asociado.
export default function AsociadoPicker({ value, onChange, placeholder = 'Buscar por documento, nombre o teléfono…', autoFocus = false }) {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (!texto.trim()) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    const t = setTimeout(() => {
      AsociadosAPI.buscar(texto.trim().toUpperCase())
        .then((data) => setResultados(Array.isArray(data) ? data : data?.content || []))
        .catch(() => setResultados([]))
        .finally(() => setBuscando(false));
    }, 350);
    return () => clearTimeout(t);
  }, [texto]);

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
          onClick={() => {
            onChange(null);
            setTexto('');
          }}
          className="shrink-0 text-brand hover:text-brand-dark dark:text-brand-light"
          aria-label="Cambiar asociado"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          autoFocus={autoFocus}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
        />
      </div>

      {buscando && (
        <div className="flex items-center gap-2 text-gray-400 text-xs px-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando…
        </div>
      )}

      {!buscando && resultados.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-lg divide-y divide-gray-200 dark:divide-dark-muted overflow-hidden max-h-56 overflow-y-auto">
          {resultados.slice(0, 8).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                onChange(a);
                setResultados([]);
                setTexto('');
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors flex items-center gap-2"
            >
              <UserRound className="w-4 h-4 text-brand/70 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-800 dark:text-white truncate">
                  {a.nombres} {a.apellidos}
                </p>
                <p className="text-xs text-gray-400 font-mono">{a.documento}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {!buscando && texto.trim() && resultados.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 px-1">Sin resultados para “{texto}”.</p>
      )}
    </div>
  );
}
