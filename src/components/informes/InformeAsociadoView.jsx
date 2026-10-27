import { FileText, Phone, MapPin, Gauge, CalendarCheck, Receipt, Wallet, AlertCircle } from 'lucide-react';
import { formatCOP } from '../../utils/formatCOP';

const fmtFecha = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const fmtFechaHora = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

const ESTADO_SERVICIO_BADGE = {
  ACTIVO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SUSPENDIDO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  INACTIVO: 'bg-gray-100 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400',
};

const ESTADO_FACTURA_BADGE = {
  PENDIENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PAGADA_PARCIAL: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  PAGADA: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  VENCIDA: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ANULADA: 'bg-gray-100 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400',
};

function MiniStat({ value, label, tone = 'text-gray-800 dark:text-white' }) {
  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center text-center">
      <span className={`text-2xl font-black mb-1 ${tone}`}>{value}</span>
      <span className="text-[11px] text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  );
}

export default function InformeAsociadoView({ data }) {
  if (!data) return null;

  const facturas = data.facturas || [];
  const pagos = data.pagos || [];
  const multas = data.multas || [];

  return (
    <div className="space-y-5">
      {/* Encabezado / ficha del asociado */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">{data.nombreCompleto}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {data.codigoInterno} · Documento {data.documento}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_SERVICIO_BADGE[data.estadoServicio] || ESTADO_SERVICIO_BADGE.INACTIVO}`}>
              {data.estadoServicio}
            </span>
            <span className="text-xs text-gray-400">Generado {fmtFecha(data.fechaGeneracion)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Phone className="w-4 h-4 text-gray-400 shrink-0" /> {data.telefonoPrincipal || '—'}
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 truncate">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" /> <span className="truncate">{data.direccion || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Gauge className="w-4 h-4 text-gray-400 shrink-0" /> Medidor {data.numeroMedidor || '—'}
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <CalendarCheck className="w-4 h-4 text-gray-400 shrink-0" /> Afiliado {fmtFecha(data.fechaAfiliacion)}
          </div>
        </div>
      </div>

      {/* Facturación */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-5">
          <FileText className="w-4 h-4 text-brand" /> Facturación
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <MiniStat value={data.totalFacturas ?? 0} label="Total facturas" />
          <MiniStat value={data.facturasPagadas ?? 0} label="Pagadas" tone="text-emerald-600 dark:text-emerald-400" />
          <MiniStat value={data.facturasPendientes ?? 0} label="Pendientes" tone="text-amber-500 dark:text-amber-400" />
          <MiniStat value={data.facturasVencidas ?? 0} label="Vencidas" tone="text-red-500 dark:text-red-400" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950">
            <span className="text-xs text-gray-500 dark:text-gray-400">Facturado</span>
            <span className="text-sm font-bold text-gray-800 dark:text-white">{formatCOP(data.totalFacturado)}</span>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950">
            <span className="text-xs text-gray-500 dark:text-gray-400">Pagado</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCOP(data.totalPagado)}</span>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950">
            <span className="text-xs text-gray-500 dark:text-gray-400">Pendiente</span>
            <span className="text-sm font-bold text-red-500 dark:text-red-400">{formatCOP(data.totalPendiente)}</span>
          </div>
        </div>
      </div>

      {/* Multas */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-brand" /> Multas
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-gray-800 dark:text-white">{data.numeroMultas ?? 0}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">multas registradas</span>
          <span className="text-sm font-semibold text-red-500 dark:text-red-400 ml-auto">{formatCOP(data.totalMultas)}</span>
        </div>
      </div>

      {/* Detalle de facturas */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl overflow-hidden">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 p-5 pb-3">
          <Receipt className="w-4 h-4 text-brand" /> Facturas ({facturas.length})
        </h3>
        {facturas.length === 0 ? (
          <p className="text-sm text-gray-400 px-5 pb-5">No hay facturas para mostrar.</p>
        ) : (
          <div className="overflow-x-auto max-h-72 custom-scroll">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-950 text-[11px] uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left font-semibold px-5 py-2.5">Factura</th>
                  <th className="text-left font-semibold px-5 py-2.5">Emisión</th>
                  <th className="text-right font-semibold px-5 py-2.5">Total</th>
                  <th className="text-right font-semibold px-5 py-2.5">Saldo</th>
                  <th className="text-left font-semibold px-5 py-2.5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-muted">
                {facturas.map((f, i) => (
                  <tr key={f.numeroFactura || i} className="hover:bg-gray-50 dark:hover:bg-dark-muted/40">
                    <td className="px-5 py-2.5 font-semibold text-gray-800 dark:text-white whitespace-nowrap">{f.numeroFactura}</td>
                    <td className="px-5 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtFecha(f.fechaEmision)}</td>
                    <td className="px-5 py-2.5 text-right font-semibold text-gray-800 dark:text-white whitespace-nowrap">{formatCOP(f.total)}</td>
                    <td className="px-5 py-2.5 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatCOP(f.saldoPendiente)}</td>
                    <td className="px-5 py-2.5">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${ESTADO_FACTURA_BADGE[f.estado] || ESTADO_FACTURA_BADGE.PENDIENTE}`}>
                        {f.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagos */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl overflow-hidden">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 p-5 pb-3">
          <Wallet className="w-4 h-4 text-brand" /> Pagos ({pagos.length})
        </h3>
        {pagos.length === 0 ? (
          <p className="text-sm text-gray-400 px-5 pb-5">No hay pagos para mostrar.</p>
        ) : (
          <div className="overflow-x-auto max-h-72 custom-scroll">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-950 text-[11px] uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left font-semibold px-5 py-2.5">Recibo</th>
                  <th className="text-left font-semibold px-5 py-2.5">Factura</th>
                  <th className="text-left font-semibold px-5 py-2.5">Fecha</th>
                  <th className="text-left font-semibold px-5 py-2.5">Método</th>
                  <th className="text-right font-semibold px-5 py-2.5">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-muted">
                {pagos.map((p, i) => (
                  <tr key={p.numeroRecibo || i} className="hover:bg-gray-50 dark:hover:bg-dark-muted/40">
                    <td className="px-5 py-2.5 font-semibold text-gray-800 dark:text-white whitespace-nowrap">{p.numeroRecibo}</td>
                    <td className="px-5 py-2.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">{p.numeroFactura}</td>
                    <td className="px-5 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtFechaHora(p.fecha)}</td>
                    <td className="px-5 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{p.metodoPago}</td>
                    <td className="px-5 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCOP(p.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Multas detalle */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl overflow-hidden">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 p-5 pb-3">
          <AlertCircle className="w-4 h-4 text-brand" /> Detalle de multas ({multas.length})
        </h3>
        {multas.length === 0 ? (
          <p className="text-sm text-gray-400 px-5 pb-5">No hay multas para mostrar.</p>
        ) : (
          <div className="overflow-x-auto max-h-72 custom-scroll">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-950 text-[11px] uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left font-semibold px-5 py-2.5">Motivo</th>
                  <th className="text-left font-semibold px-5 py-2.5">Fecha</th>
                  <th className="text-left font-semibold px-5 py-2.5">Estado</th>
                  <th className="text-right font-semibold px-5 py-2.5">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-muted">
                {multas.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-dark-muted/40">
                    <td className="px-5 py-2.5 text-gray-700 dark:text-gray-200">{m.motivo}</td>
                    <td className="px-5 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtFecha(m.fecha)}</td>
                    <td className="px-5 py-2.5 text-gray-500 dark:text-gray-400">{m.estado}</td>
                    <td className="px-5 py-2.5 text-right font-semibold text-red-500 dark:text-red-400 whitespace-nowrap">
                      {formatCOP(m.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
