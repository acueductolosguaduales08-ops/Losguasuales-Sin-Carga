import { supabase } from '../lib/supabaseClient';

export const EstadisticasAPI = {
  dashboard: async () => {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    const isoMes = inicioMes.toISOString().slice(0, 10);
    const [asocs, facs, movs, encs] = await Promise.all([
      supabase.from('asociados').select('estado_servicio').eq('archivado', false),
      supabase.from('facturas').select('estado, total, total_pagado'),
      supabase.from('movimientos_tesoreria').select('tipo, valor, fecha').eq('anulado', false).gte('fecha', isoMes),
      supabase.from('encuestas').select('id', { count: 'exact', head: true }).eq('estado', 'ACTIVA'),
    ]);
    const asociados = asocs.data || [];
    const facturas = facs.data || [];
    const pend = facturas.filter((f) => f.estado === 'PENDIENTE' || f.estado === 'PAGADA_PARCIAL');
    const venc = facturas.filter((f) => f.estado === 'VENCIDA');
    const pag = facturas.filter((f) => f.estado === 'PAGADA');
    const ingresos = (movs.data || []).filter((m) => m.tipo === 'ENTRADA').reduce((s, m) => s + Number(m.valor), 0);
    const gastos = (movs.data || []).filter((m) => m.tipo === 'SALIDA').reduce((s, m) => s + Number(m.valor), 0);
    return {
      asociadosActivos: asociados.filter((a) => a.estado_servicio === 'ACTIVO').length,
      asociadosSuspendidos: asociados.filter((a) => a.estado_servicio !== 'ACTIVO').length,
      facturasPendientes: pend.length,
      facturasVencidas: venc.length,
      facturasPagadas: pag.length,
      totalCarteraPendiente: [...pend, ...venc].reduce((s, f) => s + (Number(f.total) - Number(f.total_pagado)), 0),
      ingresosMesActual: ingresos,
      gastosMesActual: gastos,
      balanceMesActual: ingresos - gastos,
      encuestasActivas: encs.count || 0,
      // Extras (tesorería, multas)
      totalFacturado: facturas.reduce((s, f) => s + Number(f.total), 0),
      totalRecaudado: facturas.reduce((s, f) => s + Number(f.total_pagado), 0),
    };
  },
  tendenciaRecaudo: async (meses = 12) => {
    const { data, error } = await supabase.from('movimientos_tesoreria').select('fecha, valor, tipo').eq('anulado', false).eq('tipo', 'ENTRADA').order('fecha', { ascending: false }).limit(meses * 31);
    if (error) throw new Error(error.message);
    const agg = {};
    for (const m of data || []) {
      const k = (m.fecha || '').slice(0, 7);
      agg[k] = (agg[k] || 0) + Number(m.valor);
    }
    return Object.entries(agg).sort().map(([mes, total]) => ({ mes, total }));
  },
  // Alerta: facturas que vencen en ≤3 días (cron 8am del backend, ahora bajo demanda)
  porVencer: async () => {
    const { data, error } = await supabase.rpc('facturas_por_vencer');
    if (error) throw new Error(error.message);
    return data || [];
  },
};
