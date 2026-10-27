import Breadcrumbs from './Breadcrumbs';

// Encabezado estándar de página interno: migas opcionales, ícono,
// título, subtítulo y acciones a la derecha. Todos los módulos usan
// este componente para que la cabecera sea idéntica en todas las
// pantallas y el usuario reconozca siempre el mismo patrón.
export default function PageHeader({ icon: Icon, title, subtitle, breadcrumbs, actions, onNavigate }) {
  return (
    <header className="mb-5">
      {breadcrumbs?.length > 0 && (
        <Breadcrumbs items={breadcrumbs.map((b) => ({ ...b, onNavigate }))} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <span className="w-10 h-10 shrink-0 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <Icon className="w-5 h-5 text-brand" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
