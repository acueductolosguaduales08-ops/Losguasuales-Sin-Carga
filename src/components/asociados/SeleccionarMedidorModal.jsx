import { useEffect, useState } from 'react';
import { X, Search, Gauge, Loader2, Plus, CheckCircle2 } from 'lucide-react';
import { MedidoresAPI } from '../../api/medidores';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { Z } from '../../utils/zIndex';
import MedidorFormModal from '../medidores/MedidorFormModal';

// Selector de medidor pensado para usarse DESDE OTRO modal ya abierto (por
// ejemplo, "Registrar asociado"): se apila encima sin cerrar el de atrás,
// con buscador, botón para crear uno nuevo sin salir del flujo, y la lista
// de medidores disponibles (sin asociado ya asignado) para elegir con un
// clic + confirmar.
export default function SeleccionarMedidorModal({ open, onClose, onSeleccionar }) {
  const [texto, setTexto] = useState('');
  const [medidores, setMedidores] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [elegido, setElegido] = useState(null);
  const [crearOpen, setCrearOpen] = useState(false);

  useLockBodyScroll(open, onClose);

  const cargar = () => {
    setCargando(true);
    MedidoresAPI.listar()
      .then((data) => setMedidores(Array.isArray(data) ? data : data?.content || []))
      .catch(() => setMedidores([]))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (!open) return;
    setTexto('');
    setElegido(null);
    cargar();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cuando se crea un medidor nuevo desde aquí: si la respuesta trae el
  // medidor completo se usa directo; si no, se recarga la lista y se busca
  // por el número (que sí conocemos con certeza, es el que se acaba de
  // guardar) — así no depende de la forma exacta de la respuesta del POST.
  const handleMedidorCreado = async (medidorCreado) => {
    setCrearOpen(false);
    if (medidorCreado?.numero) {
      onSeleccionar(medidorCreado);
      return;
    }
    setCargando(true);
    try {
      const data = await MedidoresAPI.listar();
      const lista = Array.isArray(data) ? data : data?.content || [];
      const masReciente = lista.slice().sort((a, b) => b.id - a.id)[0];
      if (masReciente) onSeleccionar(masReciente);
      else setMedidores(lista);
    } finally {
      setCargando(false);
    }
  };

  if (!open) return null;

  // Mientras se crea un medidor nuevo, no se renderiza nada de este
  // selector (ni el overlay ni el backdrop): MedidorFormModal usa el mismo
  // nivel de z-index que un modal normal, más bajo que el de este
  // selector, así que en vez de pelear con capas se cede el paso por
  // completo y se retoma solo cuando termina (ver handleMedidorCreado).
  if (crearOpen) {
    return <MedidorFormModal open={crearOpen} onClose={() => setCrearOpen(false)} onSaved={handleMedidorCreado} />;
  }

  const disponibles = medidores.filter((m) => !m.asociadoId);
  const t = texto.trim().toLowerCase();
  const filtrados = disponibles.filter((m) => !t || String(m.numero).toLowerCase().includes(t));

  return (
    <div
      className="modal-shell fixed inset-0 flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain"
      style={{ zIndex: Z.nestedModal }}
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div
        className="modal-shell__card relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[85dvh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="seleccionar-medidor-titulo"
      >
        <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-start shrink-0">
          <div>
            <h3 id="seleccionar-medidor-titulo" className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Gauge className="w-4 h-4 text-brand" /> Elegir medidor
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Solo se listan los que aún no tienen asociado.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Buscar número de medidor…"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => setCrearOpen(true)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-brand/10 hover:bg-brand/15 text-brand dark:text-brand-light text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Crear
            </button>
          </div>

          {cargando ? (
            <div className="flex items-center gap-2 text-gray-400 text-xs py-4">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando medidores…
            </div>
          ) : filtrados.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
              No hay medidores disponibles{t ? ' con ese número' : ''}. Crea uno nuevo con el botón de arriba.
            </p>
          ) : (
            <div className="border border-gray-200 dark:border-dark-muted rounded-lg divide-y divide-gray-100 dark:divide-dark-muted overflow-hidden">
              {filtrados.map((m) => {
                const seleccionado = elegido?.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setElegido(m)}
                    className={`w-full flex items-center gap-2.5 text-left px-3.5 py-2.5 transition-colors ${
                      seleccionado
                        ? 'bg-brand/10'
                        : 'hover:bg-gray-50 dark:hover:bg-dark-bg'
                    }`}
                  >
                    <Gauge className={`w-4 h-4 shrink-0 ${seleccionado ? 'text-brand' : 'text-gray-400'}`} />
                    <span className={`text-sm flex-1 ${seleccionado ? 'font-semibold text-brand dark:text-brand-light' : 'text-gray-700 dark:text-gray-300'}`}>
                      Nº {m.numero}
                    </span>
                    {seleccionado && <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-shell__footer p-5 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950/40 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={() => elegido && onSeleccionar(elegido)}
            disabled={!elegido}
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white transition-colors text-sm font-semibold"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
