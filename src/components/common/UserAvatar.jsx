import { User } from 'lucide-react';

// Colores por rol: mismos tonos que ya usa el resto de la app en otros
// contextos (brand para lo principal/administrativo, emerald para
// tesorería/dinero, sky para asociados) — ningún color nuevo, solo
// reutilizados para que el avatar distinga el rol de un vistazo.
const ROL_STYLE = {
  ADMINISTRADOR: 'bg-brand/15 text-brand dark:bg-brand/25 dark:text-brand-light',
  TESORERO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ASOCIADO: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
};

// Punto de estado (solo para asociados, como en una red social): verde
// activo, rojo suspendido, amarillo inactivo. Administrador y tesorero no
// tienen estado de servicio, así que no llevan punto.
const ESTADO_DOT = {
  ACTIVO: 'bg-emerald-500',
  SUSPENDIDO: 'bg-red-500',
  INACTIVO: 'bg-amber-500',
};

export default function UserAvatar({ username, rol, estadoServicio, size = 'w-9 h-9' }) {
  const inicial = username ? username.charAt(0).toUpperCase() : null;
  const estilo = ROL_STYLE[rol] || 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
  const dotColor = rol === 'ASOCIADO' ? ESTADO_DOT[estadoServicio] : null;

  return (
    <div className={`relative ${size} shrink-0`}>
      <div className={`w-full h-full rounded-full flex items-center justify-center font-black text-sm ${estilo}`}>
        {inicial || <User className="w-1/2 h-1/2" />}
      </div>
      {dotColor && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-dark-bg ${dotColor}`}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
