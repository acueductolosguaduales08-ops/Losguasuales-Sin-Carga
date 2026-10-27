// Estado vacío compartido: invita a la acción en vez de solo avisar
// que no hay datos. Se usa en listas, tablas y paneles sin resultados.
export default function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center border border-dashed border-gray-200 dark:border-dark-muted rounded-xl bg-white dark:bg-gray-900 ${
        compact ? 'py-8 px-4' : 'py-12 px-6'
      }`}
    >
      {Icon && (
        <Icon
          className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} text-gray-300 dark:text-gray-600 mb-3`}
          aria-hidden="true"
        />
      )}
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</p>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
