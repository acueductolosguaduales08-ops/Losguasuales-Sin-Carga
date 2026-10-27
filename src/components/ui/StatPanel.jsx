// Indicador de resumen (KPI) compartido. Jerarquía simple:
// etiqueta pequeña, valor grande con tabular-nums y una ayuda corta.
// El color se reserva para el valor cuando comunica algo (balance
// positivo/negativo), nunca como fondo llamativo.
export default function StatPanel({ label, value, hint, icon: Icon, tone = 'text-gray-800 dark:text-white', children }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" aria-hidden="true" />}
      </div>
      <p className={`text-xl font-bold tabular-nums ${tone}`}>{value}</p>
      {hint && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{hint}</p>}
      {children}
    </div>
  );
}
