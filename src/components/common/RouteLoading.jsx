import { Loader2 } from 'lucide-react';

// Fallback que se muestra brevemente mientras se descarga el código de una
// página cargada con React.lazy (code-splitting por ruta). Solo se ve la
// primera vez que se visita cada página en la sesión; luego queda en caché.
export default function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <Loader2 className="w-8 h-8 text-brand animate-spin" />
    </div>
  );
}
