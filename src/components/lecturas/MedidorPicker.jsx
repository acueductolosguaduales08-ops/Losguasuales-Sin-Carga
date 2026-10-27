import { useState } from 'react';
import { Search, Loader2, Gauge, X, CheckCircle2 } from 'lucide-react';

// Selector de medidor con tarjetas, en el mismo estilo que AsociadoPicker
// (usado en tesorería). Reemplaza el <select> nativo de LecturaFormModal,
// que en móvil se veía como el picker feo del sistema operativo.
//
// A diferencia de AsociadoPicker, la lista de medidores ya viene cargada
// completa desde el componente padre (LecturaFormModal la trae una sola vez
// al abrir el modal), así que el filtro es local, sin debounce ni llamadas
// a la API por cada tecla.
export default function MedidorPicker({
  medidores,
  value,
  onChange,
  loading = false,
  disabled = false,
  placeholder = 'Buscar por nombre de asociado o número de medidor…',
  // IDs (string) de medidores que ya tienen una lectura registrada en el
  // período activo. Es solo informativo: no impide seleccionarlos (el
  // usuario puede querer revisar el detalle), pero los marca en la lista
  // para que se puedan reconocer de un vistazo antes de elegir uno por
  // error y encontrarse la advertencia recién después.
  medidoresConLecturaIds = null,
}) {
  const [texto, setTexto] = useState('');

  const medidorSeleccionado = medidores.find((m) => String(m.id) === String(value)) || null;

  if (disabled && medidorSeleccionado) {
    // Caso de edición: el medidor no se puede cambiar, solo se muestra.
    return (
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-muted/40 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2.5 opacity-80">
        <Gauge className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
            Nº {medidorSeleccionado.numero}
          </p>
          <p className="text-[11px] text-gray-400">{medidorSeleccionado.asociadoNombre || 'Sin asociado'}</p>
        </div>
      </div>
    );
  }

  if (medidorSeleccionado) {
    return (
      <div className="flex items-center justify-between gap-2 bg-brand/10 border border-brand/30 rounded-lg px-4 py-2.5">
        <div className="min-w-0 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-brand shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand dark:text-brand-light truncate">
              Nº {medidorSeleccionado.numero}
            </p>
            <p className="text-[11px] text-brand/70 dark:text-brand-light/70">
              {medidorSeleccionado.asociadoNombre || 'Sin asociado'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange('');
            setTexto('');
          }}
          className="shrink-0 text-brand hover:text-brand-dark dark:text-brand-light"
          aria-label="Cambiar medidor"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const texto_norm = texto.trim().toLowerCase();
  const medidoresFiltrados = medidores.filter((m) => {
    if (!texto_norm) return true;
    const numero = String(m.numero || '').toLowerCase();
    const asociado = String(m.asociadoNombre || '').toLowerCase();
    return numero.includes(texto_norm) || asociado.includes(texto_norm);
  });

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white disabled:opacity-60"
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-xs px-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando medidores…
        </div>
      )}

      {!loading && medidoresFiltrados.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-lg divide-y divide-gray-200 dark:divide-dark-muted overflow-hidden max-h-56 overflow-y-auto">
          {medidoresFiltrados.slice(0, 30).map((m) => {
            const yaRegistrado = medidoresConLecturaIds?.has(String(m.id));
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onChange(String(m.id));
                  setTexto('');
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors flex items-center gap-2"
              >
                <Gauge className="w-4 h-4 text-brand/70 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 dark:text-white truncate">Nº {m.numero}</p>
                  <p className="text-xs text-gray-400 truncate">{m.asociadoNombre || 'Sin asociado'}</p>
                </div>
                {yaRegistrado && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-full px-2 py-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Ya registrado
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!loading && texto_norm && medidoresFiltrados.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 px-1">Ningún medidor coincide con la búsqueda.</p>
      )}

      {!loading && !texto_norm && medidores.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 px-1">No hay medidores registrados.</p>
      )}
    </div>
  );
}
