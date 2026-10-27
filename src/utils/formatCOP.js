/**
 * Formatea un valor numérico como pesos colombianos (COP) sin decimales.
 * Ejemplo: 30400 → "$30.400"
 */
export function formatCOP(valor) {
  const n = Number(valor || 0);
  return n.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Solo formatea el número con separadores de miles (sin símbolo $).
 * Ejemplo: 30400 → "30.400"
 */
export function formatNumero(valor) {
  const n = Number(valor || 0);
  return n.toLocaleString('es-CO');
}

/**
 * Para inputs de dinero: formatea el valor mostrado con puntos de miles.
 * Úsalo con un input controlado donde el state guarda el número crudo.
 *
 * Ejemplo:
 *   const [valor, setValor] = useState('');
 *   <input value={formatCOPInput(valor)} onChange={(e) => setValor(unformatCOP(e.target.value))} />
 */
export function formatCOPInput(valor) {
  if (valor === '' || valor === null || valor === undefined) return '';
  const soloDigitos = String(valor).replace(/\D/g, '');
  if (!soloDigitos) return '';
  return Number(soloDigitos).toLocaleString('es-CO');
}

/**
 * Convierte un valor formateado (con puntos) de vuelta a número crudo.
 * Ejemplo: "30.400" → "30400"
 */
export function unformatCOP(valor) {
  if (!valor) return '';
  return String(valor).replace(/\D/g, '');
}
