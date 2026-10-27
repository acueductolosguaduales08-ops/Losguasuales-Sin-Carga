import { Loader2 } from 'lucide-react';

// Tabla de datos compartida.
//
// columns: [{ key, label, align?: 'right', className?, hideOnMobile?, render?(row) }]
//   - hideOnMobile oculta la columna en pantallas pequeñas (el dato
//     principal nunca se pierde: lo importante va primero).
//   - data-label automático en celular para que cada celda muestre su
//     etiqueta (patrón tarjeta, sin scroll horizontal).
// rows: array de filas; rowKey: función para la key; onRowClick: fila
// clicable (agrega estilo y accesibilidad por teclado vía role=button).
export default function DataTable({
  columns,
  rows,
  rowKey = (r, i) => r.id ?? i,
  onRowClick,
  loading = false,
  empty = null,
  className = '',
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-14 text-gray-400 gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        <span className="text-sm">Cargando…</span>
      </div>
    );
  }

  if (!rows?.length && empty) {
    return empty;
  }

  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-xl overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="tabla-datos">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`${c.align === 'right' ? 'col-num' : ''} ${c.hideOnMobile ? 'ocultar-movil' : ''} ${c.headerClassName || ''}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                className={onRowClick ? 'fila-clic' : ''}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    data-label={c.hideOnMobile ? '' : c.label}
                    className={`${c.align === 'right' ? 'col-num' : ''} ${c.hideOnMobile ? 'ocultar-movil' : ''} ${c.className || ''}`}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
