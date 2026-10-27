import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

/**
 * Componente que protege rutas segun el rol del usuario.
 * Si no esta autenticado, redirige al inicio.
 * Si el rol no esta permitido, muestra mensaje de acceso restringido.
 *
 * @param {Object} props
 * @param {string[]} props.roles - Roles permitidos (ej: ['ADMINISTRADOR', 'TESORERO'])
 * @param {React.ReactNode} props.children - Componente a renderizar
 */
export default function ProtectedRoute({ roles, children }) {
  const { isAuthenticated, rol } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(rol)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Acceso restringido
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          No tienes permisos para acceder a esta seccion. Tu rol actual (
          <span className="font-semibold">{rol}</span>) no tiene acceso a{' '}
          <span className="font-semibold">{location.pathname}</span>.
        </p>
      </div>
    );
  }

  return children;
}
