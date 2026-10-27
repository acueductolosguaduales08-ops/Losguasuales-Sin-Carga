import { MapPin, CalendarDays, UserRound, Settings2, Pencil, Eye } from 'lucide-react';

function formatFecha(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const ESTADO_BADGE = {
  ACTIVO: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  EN_MANTENIMIENTO:
    'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  DANADO: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  RETIRADO: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600',
};

const ESTADO_LABEL = {
  ACTIVO: 'ACTIVO',
  EN_MANTENIMIENTO: 'EN MANTENIMIENTO',
  DANADO: 'DAÑADO',
  RETIRADO: 'RETIRADO',
};

export default function MedidorCard({ medidor, onVerDetalle, onCambiarEstado, onEditar }) {
  const retirado = medidor.estado === 'RETIRADO';
  const asociado = !!medidor.asociadoId;

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border p-5 flex flex-col transition-all ${
        asociado
          ? 'border-brand/40 shadow-[0_0_15px_rgba(37,99,235,0.08)]'
          : 'border-gray-200 dark:border-dark-muted hover:border-gray-300 dark:hover:border-gray-500'
      } ${retirado ? 'opacity-70 hover:opacity-100' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 px-2 py-1 rounded w-max mb-2">
            {medidor.codigoInterno || `MED-${medidor.id}`}
          </span>
          <h3 className={`font-bold text-lg leading-tight text-gray-800 dark:text-white ${retirado ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
            Nº {medidor.numero}
          </h3>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${ESTADO_BADGE[medidor.estado] || ESTADO_BADGE.RETIRADO}`}>
          {ESTADO_LABEL[medidor.estado] || medidor.estado}
        </span>
      </div>

      <div className="space-y-2 mb-4 flex-grow">
        {medidor.ubicacion && (
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <MapPin className="w-4 h-4 shrink-0" />
            {medidor.ubicacion}
          </p>
        )}
        {formatFecha(medidor.fechaInstalacion) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 shrink-0" />
            Instalado: {formatFecha(medidor.fechaInstalacion)}
          </p>
        )}
      </div>

      {asociado ? (
        <div className="bg-brand/10 rounded-lg p-2 mb-4 border border-brand/30 flex items-center gap-2">
          <div className="bg-brand p-1.5 rounded-full text-white shrink-0">
            <UserRound className="w-3 h-3" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-brand dark:text-brand-light font-semibold">Asignado a:</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
              {medidor.asociadoNombre || 'Asociado'} (ID: {medidor.asociadoId})
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-2 mb-4 border border-dashed border-gray-200 dark:border-dark-muted">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Disponible (sin asociado)</p>
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-dark-muted pt-4 flex gap-2">
        <button
          onClick={() => onVerDetalle(medidor)}
          className="flex-1 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted py-2 rounded-lg text-sm text-gray-700 dark:text-white transition-colors flex items-center justify-center gap-1.5"
        >
          <Eye className="w-4 h-4" /> Ver detalles
        </button>
        <button
          onClick={() => onCambiarEstado(medidor)}
          title="Cambiar estado"
          className="px-3 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          <Settings2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => onEditar(medidor)}
          title="Editar"
          className="px-3 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted rounded-lg text-gray-500 dark:text-gray-400 hover:text-brand transition-colors"
        >
          <Pencil className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
