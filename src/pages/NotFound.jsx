import { Link } from 'react-router-dom';
import { MapPinOff, Home } from 'lucide-react';

// Se muestra cuando la ruta no coincide con ninguna página real de la app
// (por ejemplo, un enlace guardado hace tiempo que apunta a una dirección
// que ya no existe, o un enlace escrito a mano con un error). Antes, sin
// esta ruta comodín, React Router simplemente no renderizaba nada para una
// ruta desconocida — una pantalla completamente en blanco, sin ninguna
// pista de qué pasó ni cómo volver.
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 text-center">
      <div>
        <MapPinOff className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Esta página no existe</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
          El enlace que abriste puede estar roto o ya no está disponible.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-brand hover:bg-brand-dark text-white transition-colors shadow-lg shadow-brand/20"
        >
          <Home className="w-4 h-4" /> Volver al inicio
        </Link>
      </div>
    </div>
  );
}
