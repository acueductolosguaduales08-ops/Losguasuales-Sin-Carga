import { Phone, MapPin, Gauge, Eye, Wallet, Settings2, Pencil, Archive, UserCheck, UserX } from 'lucide-react';

const ESTADO_BADGE = {
  ACTIVO: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  SUSPENDIDO: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  INACTIVO: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600',
};

const AVATAR_BG = {
  ACTIVO: 'bg-brand/20 text-brand',
  SUSPENDIDO: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  INACTIVO: 'bg-gray-400/20 text-gray-500 dark:text-gray-400',
};

function inicial(nombre) {
  return (nombre || '?').trim().charAt(0).toUpperCase() || '?';
}

export default function AsociadoCard({ asociado, onVerDetalle, onFinanzas, onCambiarEstado, onEditar, onArchivar }) {
  const inactivoVisual = asociado.archivado || asociado.estadoServicio === 'INACTIVO';

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border p-5 flex flex-col transition-all shadow-sm ${
        inactivoVisual
          ? 'border-gray-200 dark:border-dark-muted opacity-75 hover:opacity-100'
          : 'border-gray-200 dark:border-dark-muted hover:border-brand/50'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${
              AVATAR_BG[asociado.estadoServicio] || AVATAR_BG.INACTIVO
            }`}
          >
            {inicial(asociado.nombres)}
          </div>
          <div className="min-w-0">
            <h3
              className="font-bold text-lg leading-tight text-gray-800 dark:text-white truncate"
              title={`${asociado.nombres} ${asociado.apellidos}`}
            >
              {asociado.nombres} {asociado.apellidos}
            </h3>
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              {asociado.tipoDocumento}: {asociado.documento}
            </span>
            {asociado.tieneCuenta != null && (
              <span
                className={`mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  asociado.tieneCuenta
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400'
                }`}
              >
                {asociado.tieneCuenta ? (
                  <>
                    <UserCheck className="w-3 h-3" /> Con cuenta
                  </>
                ) : (
                  <>
                    <UserX className="w-3 h-3" /> Sin cuenta
                  </>
                )}
              </span>
            )}
          </div>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
            ESTADO_BADGE[asociado.estadoServicio] || ESTADO_BADGE.INACTIVO
          }`}
        >
          {asociado.estadoServicio}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4 flex-grow">
        {asociado.telefonoPrincipal && (
          <p className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-brand/70 shrink-0" />
            {asociado.telefonoPrincipal}
          </p>
        )}
        {asociado.direccion && (
          <p className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-brand/70 shrink-0" />
            <span className="truncate">
              {asociado.direccion}
              {asociado.barrioVereda ? ` · ${asociado.barrioVereda}` : ''}
            </span>
          </p>
        )}
        {asociado.numeroMedidor && (
          <p className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-brand/70 shrink-0" />
            Medidor: {asociado.numeroMedidor}
          </p>
        )}
      </div>

      {asociado.archivado && (
        <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-2 mb-4 border border-dashed border-gray-200 dark:border-dark-muted flex items-center gap-2">
          <Archive className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <p className="text-xs text-gray-500 dark:text-gray-400">Archivado (baja lógica)</p>
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-dark-muted pt-4 grid grid-cols-5 gap-2">
        <button
          onClick={() => onVerDetalle(asociado)}
          title="Ver detalles"
          className="col-span-2 flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted py-2 rounded-lg text-sm text-gray-700 dark:text-white transition-colors"
        >
          <Eye className="w-4 h-4" /> Detalles
        </button>
        <button
          onClick={() => onFinanzas(asociado)}
          title="Resumen financiero"
          className="col-span-1 flex justify-center items-center bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted py-2 rounded-lg text-emerald-600 dark:text-emerald-400 transition-colors"
        >
          <Wallet className="w-5 h-5" />
        </button>
        <button
          onClick={() => onCambiarEstado(asociado)}
          title="Cambiar estado del servicio"
          className="col-span-1 flex justify-center items-center bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted py-2 rounded-lg text-amber-600 dark:text-amber-400 transition-colors"
        >
          <Settings2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => onEditar(asociado)}
          title="Editar"
          className="col-span-1 flex justify-center items-center bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-dark-muted py-2 rounded-lg text-brand transition-colors"
        >
          <Pencil className="w-5 h-5" />
        </button>
      </div>

      {!asociado.archivado && (
        <button
          onClick={() => onArchivar(asociado)}
          className="mt-2 w-full text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors py-1 flex items-center justify-center gap-1"
        >
          <Archive className="w-3.5 h-3.5" /> Archivar asociado
        </button>
      )}
    </div>
  );
}
