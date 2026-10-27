import {
  DollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Droplets,
  Users,
  UserX,
} from 'lucide-react';
import { formatCOP } from '../../utils/formatCOP';

const fmtFecha = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const ESTADO_BADGE = {
  PENDIENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PAGADA_PARCIAL: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  PAGADA: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  VENCIDA: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ANULADA: 'bg-gray-100 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400',
};

function KpiCard({ icon: Icon, label, value, tone = 'text-brand', sub }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
      <div className="flex justify-between items-start mb-2">
        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="p-2 rounded-xl bg-gray-100 dark:bg-dark-muted shrink-0">
          <Icon className={`w-4 h-4 ${tone}`} />
        </div>
      </div>
      <h3 className={`text-xl font-black truncate ${tone}`}>{value}</h3>
      {sub && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function MiniStat({ value, label, tone = 'text-gray-800 dark:text-white' }) {
  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center text-center">
      <span className={`text-2xl font-black mb-1 ${tone}`}>{value}</span>
      <span className="text-[11px] text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  );
}

// Vista de datos para InformePeriodoResponse (compartida entre informe mensual y anual).
export default function InformePeriodoView({ data }) {
  if (!data) return null;

  const balancePositivo = Number(data.balance || 0) >= 0;
  const facturas = data.facturas || [];
  const movimientos = data.movimientos || [];
  const totalAsociados = (data.asociadosActivos || 0) + (data.asociadosSuspendidos || 0);

  return (
    <div className="space-y-5">
      {/* Encabezado del informe */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg bg-brand/10 text-brand mb-2">
            {data.tipoInforme || 'Informe'}
          </span>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">{data.tituloPeriodo}</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
          Generado el {fmtFecha(data.fechaGeneracion)}
        </p>
      </div>

      {/* KPIs financieros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={TrendingUp} label="Ingresos" value={formatCOP(data.totalIngresos)} tone="text-emerald-600 dark:text-emerald-400" />
        <KpiCard icon={TrendingDown} label="Gastos" value={formatCOP(data.totalGastos)} tone="text-red-500 dark:text-red-400" />
        <KpiCard
          icon={Wallet}
          label="Balance"
          value={formatCOP(data.balance)}
          tone={balancePositivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}
        />
      </div>

      {/* Facturación */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-5">
          <FileText className="w-4 h-4 text-brand" /> Facturación del período
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          <MiniStat value={data.facturasGeneradas ?? 0} label="Generadas" />
          <MiniStat value={data.facturasPagadas ?? 0} label="Pagadas" tone="text-emerald-600 dark:text-emerald-400" />
          <MiniStat value={data.facturasPendientes ?? 0} label="Pendientes" tone="text-amber-500 dark:text-amber-400" />
          <MiniStat value={data.facturasVencidas ?? 0} label="Vencidas" tone="text-red-500 dark:text-red-400" />
          <MiniStat value={data.facturasAnuladas ?? 0} label="Anuladas" tone="text-gray-400" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950">
            <span className="text-xs text-gray-500 dark:text-gray-400">Total facturado</span>
            <span className="text-sm font-bold text-gray-800 dark:text-white">{formatCOP(data.totalFacturado)}</span>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950">
            <span className="text-xs text-gray-500 dark:text-gray-400">Total recaudado</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatCOP(data.totalRecaudadoFacturas)}
            </span>
          </div>
        </div>
      </div>

      {/* Multas, consumo y asociados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-brand" /> Multas
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-gray-800 dark:text-white">{data.numeroMultas ?? 0}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">multas registradas</span>
          </div>
          <p className="text-sm font-semibold text-red-500 dark:text-red-400 mt-2">{formatCOP(data.totalMultas)}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-4">
            <Droplets className="w-4 h-4 text-brand" /> Consumo de agua
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-gray-800 dark:text-white">
              {Number(data.totalM3Consumidos ?? 0).toLocaleString('es-CO')}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">m³ totales</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Promedio: <span className="font-semibold text-gray-700 dark:text-gray-200">{Number(data.promedioConsumoM3 ?? 0).toFixed(1)} m³</span> por asociado
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-brand" /> Asociados
          </h3>
          <div className="flex items-center gap-2 text-sm mb-2">
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center font-semibold">
              <CheckCircle2 className="w-4 h-4 mr-1" /> {data.asociadosActivos ?? 0} activos
            </span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span className="text-red-500 dark:text-red-400 flex items-center font-semibold">
              <UserX className="w-4 h-4 mr-1" /> {data.asociadosSuspendidos ?? 0} susp.
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-dark-muted h-1.5 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full"
              style={{ width: `${totalAsociados > 0 ? (data.asociadosActivos / totalAsociados) * 100 : 0}%` }}
            />
            <div
              className="bg-red-400 h-full"
              style={{ width: `${totalAsociados > 0 ? (data.asociadosSuspendidos / totalAsociados) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Detalle de facturas */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl overflow-hidden">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 p-5 pb-3">
          <Receipt className="w-4 h-4 text-brand" /> Facturas del período ({facturas.length})
        </h3>
        {facturas.length === 0 ? (
          <p className="text-sm text-gray-400 px-5 pb-5">No hay facturas para mostrar.</p>
        ) : (
          <div className="overflow-x-auto max-h-80 custom-scroll">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-950 text-[11px] uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left font-semibold px-5 py-2.5">Factura</th>
                  <th className="text-left font-semibold px-5 py-2.5">Asociado</th>
                  <th className="text-left font-semibold px-5 py-2.5">Emisión</th>
                  <th className="text-right font-semibold px-5 py-2.5">Total</th>
                  <th className="text-left font-semibold px-5 py-2.5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-muted">
                {facturas.map((f, i) => (
                  <tr key={f.numeroFactura || i} className="hover:bg-gray-50 dark:hover:bg-dark-muted/40">
                    <td className="px-5 py-2.5 font-semibold text-gray-800 dark:text-white whitespace-nowrap">
                      {f.numeroFactura}
                    </td>
                    <td className="px-5 py-2.5 text-gray-600 dark:text-gray-300">{f.asociadoNombre}</td>
                    <td className="px-5 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {fmtFecha(f.fechaEmision)}
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold text-gray-800 dark:text-white whitespace-nowrap">
                      {formatCOP(f.total)}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${ESTADO_BADGE[f.estado] || ESTADO_BADGE.PENDIENTE}`}>
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

      {/* Movimientos de tesorería */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl overflow-hidden">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 p-5 pb-3">
          <DollarSign className="w-4 h-4 text-brand" /> Movimientos de tesorería ({movimientos.length})
        </h3>
        {movimientos.length === 0 ? (
          <p className="text-sm text-gray-400 px-5 pb-5">No hay movimientos para mostrar.</p>
        ) : (
          <div className="overflow-x-auto max-h-80 custom-scroll">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-950 text-[11px] uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left font-semibold px-5 py-2.5">Número</th>
                  <th className="text-left font-semibold px-5 py-2.5">Tipo</th>
                  <th className="text-left font-semibold px-5 py-2.5">Concepto</th>
                  <th className="text-left font-semibold px-5 py-2.5">Fecha</th>
                  <th className="text-right font-semibold px-5 py-2.5">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-muted">
                {movimientos.map((m, i) => (
                  <tr key={m.numero || i} className="hover:bg-gray-50 dark:hover:bg-dark-muted/40">
                    <td className="px-5 py-2.5 font-semibold text-gray-800 dark:text-white whitespace-nowrap">
                      {m.numero}
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                          m.tipo === 'INGRESO'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {m.tipo}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-gray-600 dark:text-gray-300">{m.concepto}</td>
                    <td className="px-5 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtFecha(m.fecha)}</td>
                    <td
                      className={`px-5 py-2.5 text-right font-semibold whitespace-nowrap ${
                        m.tipo === 'INGRESO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                      }`}
                    >
                      {m.tipo === 'INGRESO' ? '+' : '-'}
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
