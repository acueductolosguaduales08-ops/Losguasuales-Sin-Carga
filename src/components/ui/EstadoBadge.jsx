// Etiqueta de estado normalizada y compartida por todos los módulos.
// Un solo punto de verdad: el mismo estado se pinta igual en el
// directorio de asociados, facturas, recibos, multas, períodos y
// movimientos. Nunca depende solo del color: siempre muestra el texto
// del estado y un punto que refuerza la diferencia.

const MAPA = {
  // Servicio del asociado
  ACTIVO: { label: 'Activo', cls: 'badge-verde' },
  SUSPENDIDO: { label: 'Suspendido', cls: 'badge-rojo' },
  INACTIVO: { label: 'Inactivo', cls: 'badge-gris' },

  // Facturas y multas
  PENDIENTE: { label: 'Pendiente', cls: 'badge-ambar' },
  PAGADA_PARCIAL: { label: 'Pago parcial', cls: 'badge-celeste' },
  PAGADA: { label: 'Pagada', cls: 'badge-verde' },
  PAGADO: { label: 'Pagado', cls: 'badge-verde' },
  VENCIDA: { label: 'Vencida', cls: 'badge-rojo' },
  VENCIDO: { label: 'Vencido', cls: 'badge-rojo' },
  ANULADA: { label: 'Anulada', cls: 'badge-gris' },
  ANULADO: { label: 'Anulado', cls: 'badge-gris' },

  // Recibos
  EMITIDO: { label: 'Emitido', cls: 'badge-verde' },

  // Períodos contables
  ABIERTO: { label: 'Abierto', cls: 'badge-petroleo' },
  ABIERTA: { label: 'Abierta', cls: 'badge-petroleo' },
  CERRADO: { label: 'Cerrado', cls: 'badge-gris' },
  CERRADA: { label: 'Cerrada', cls: 'badge-gris' },
  REABIERTO: { label: 'Reabierto', cls: 'badge-celeste' },
  REABIERTA: { label: 'Reabierta', cls: 'badge-celeste' },

  // Estados genéricos de formularios/procesos
  EN_REVISION: { label: 'En revisión', cls: 'badge-celeste' },
  ERROR: { label: 'Error', cls: 'badge-rojo' },

  // Meses aún no aperturados en un ejercicio (nivel 2 de períodos)
  NO_INICIADO: { label: 'No iniciado', cls: 'badge-gris' },
};

export function estadoInfo(estado) {
  if (!estado) return null;
  const key = String(estado).toUpperCase().replace(/\s+/g, '_');
  return MAPA[key] || { label: String(estado), cls: 'badge-gris' };
}

export default function EstadoBadge({ estado, label, className = '' }) {
  const info = estadoInfo(estado);
  if (!info) return null;
  return (
    <span className={`badge-estado ${info.cls} ${className}`}>
      {label || info.label}
    </span>
  );
}
