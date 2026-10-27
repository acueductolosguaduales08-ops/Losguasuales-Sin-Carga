import { useEffect, useState } from 'react';
import { ConfiguracionAPI } from '../../api/configuracion';

// Select de método de pago activo, alimentado desde Configuración (Módulo 06).
export default function MetodoPagoSelect({ value, onChange, required = true, className = '' }) {
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ConfiguracionAPI.listarMetodosPago()
      .then((data) => {
        const lista = (Array.isArray(data) ? data : data?.content || []).filter((m) => m.activo);
        setMetodos(lista);
        if (!value && lista.length === 1) onChange(lista[0].id);
      })
      .catch(() => setMetodos([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      required={required}
      disabled={loading}
      className={`w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors disabled:opacity-60 ${className}`}
    >
      <option value="">{loading ? 'Cargando métodos de pago…' : 'Selecciona un método de pago'}</option>
      {metodos.map((m) => (
        <option key={m.id} value={m.id}>
          {m.nombre}
        </option>
      ))}
      {!loading && metodos.length === 0 && <option disabled>No hay métodos de pago activos</option>}
    </select>
  );
}
