import { useEffect, useState } from 'react';
import { Loader2, Plus, Wallet, Power } from 'lucide-react';
import { ConfiguracionAPI } from '../../api/configuracion';
import { useToast } from '../../context/ToastContext';

// Panel de métodos de pago — POST /metodos-pago, GET /metodos-pago, PATCH /metodos-pago/{id}.
export default function MetodosPagoPanel() {
  const { success, error, warning, info } = useToast();
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [creando, setCreando] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const cargar = () => {
    setLoading(true);
    ConfiguracionAPI.listarMetodosPago()
      .then((data) => setMetodos(Array.isArray(data) ? data : data?.content || []))
      .catch((err) => error("Error al cargar", err.message || 'No se pudieron cargar los métodos de pago.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nombreNuevo.trim()) {
      warning("Campo requerido", "Debes ingresar el nombre del método de pago.");
      return;
    }
    setCreando(true);
    try {
      await ConfiguracionAPI.crearMetodoPago(nombreNuevo.trim());
      success("Método creado", "El método de pago se agregó exitosamente.");
      setNombreNuevo('');
      cargar();
    } catch (err) {
      error("Error al crear", err.message || 'No se pudo crear el método de pago.');
    } finally {
      setCreando(false);
    }
  };

  const handleToggle = async (metodo) => {
    setTogglingId(metodo.id);
    try {
      await ConfiguracionAPI.activarMetodoPago(metodo.id, !metodo.activo);
      setMetodos((prev) => prev.map((m) => (m.id === metodo.id ? { ...m, activo: !m.activo } : m)));
      success(`Método ${!metodo.activo ? 'activado' : 'desactivado'}`, `El método ahora está ${!metodo.activo ? 'disponible' : 'deshabilitado'} para pagos.`);
    } catch (err) {
      info("Error al actualizar", err.message || 'No se pudo actualizar el método de pago.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5 space-y-5">
      <div>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 text-brand" /> Métodos de pago
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Los métodos activos son los que estarán disponibles para registrar pagos de facturas.
        </p>
      </div>

      <form onSubmit={handleCrear} className="flex gap-2">
        <input
          type="text"
          value={nombreNuevo}
          onChange={(e) => setNombreNuevo(e.target.value)}
          placeholder="Ingrese el nombre del método"
          className="flex-grow bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors"
        />
        <button
          type="submit"
          disabled={creando}
          className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center gap-1.5 shrink-0"
        >
          {creando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Agregar
        </button>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando métodos…</span>
        </div>
      )}

      {!loading && metodos.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
          Aún no hay métodos de pago registrados.
        </p>
      )}

      {!loading && metodos.length > 0 && (
        <div className="divide-y divide-gray-200 dark:divide-dark-muted border border-gray-200 dark:border-dark-muted rounded-lg overflow-hidden">
          {metodos.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-950">
              <span className="text-sm text-gray-800 dark:text-white font-medium">{m.nombre}</span>
              <button
                onClick={() => handleToggle(m)}
                disabled={togglingId === m.id}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors disabled:opacity-60 ${
                  m.activo
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                    : 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                {togglingId === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
                {m.activo ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
