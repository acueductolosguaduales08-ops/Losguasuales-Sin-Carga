import { ChevronRight } from 'lucide-react';

// Ruta de navegación jerárquica: Períodos → 2026 → Octubre.
// Cada ítem puede tener `to` (navega) o `onClick` (acción propia) y el
// último ítem se renderiza como página actual (sin acción).
export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-3 min-w-0">
      {items.map((item, i) => {
        const esUltimo = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight className="w-3 h-3 shrink-0 text-gray-300 dark:text-gray-600" />}
            {esUltimo ? (
              <span className="font-semibold text-gray-800 dark:text-gray-200 truncate" aria-current="page">
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={item.onClick || (item.to ? () => item.onNavigate?.(item.to) : undefined)}
                className="hover:text-brand hover:underline underline-offset-2 transition-colors truncate cursor-pointer"
              >
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
