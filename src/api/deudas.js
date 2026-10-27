import { supabase } from '../lib/supabaseClient';

// Cartera de deudas: detalle por factura con aging, y deudores agregados
// (facturas + multas) con teléfono para WhatsApp. Devuelve el shape que
// esperan DeudasCartera.jsx y el Panel:
// { detalle, aging, deudores, totalFacturasVencidas, montoTotalVencido }
const RANGOS = ['Vigente', '1-30 días', '31-60 días', '61-90 días', '90+ días'];

function rangoDeDias(dias) {
  if (dias <= 0) return 'Vigente';
  if (dias <= 30) return '1-30 días';
  if (dias <= 60) return '31-60 días';
  if (dias <= 90) return '61-90 días';
  return '90+ días';
}

export const DeudasAPI = {
  obtenerCartera: async () => {
    const [{ data: facs }, { data: multas }, { data: asocs }, { data: meds }] = await Promise.all([
      supabase.from('facturas')
        .select('id, numero_factura, asociado_id, total, total_pagado, estado, fecha_emision, fecha_limite_pago')
        .in('estado', ['PENDIENTE', 'PAGADA_PARCIAL', 'VENCIDA'])
        .order('fecha_emision', { ascending: true }),
      supabase.from('multas').select('asociado_id, valor').eq('estado', 'PENDIENTE'),
      supabase.from('asociados')
        .select('id, nombres, apellidos, documento, telefono_principal')
        .eq('archivado', false),
      // facturas no tiene FK a medidores: se resuelve por asociado.
      supabase.from('medidores').select('asociado_id, numero'),
    ]);
    const asocMap = new Map((asocs || []).map((a) => [a.id, a]));
    const medPorAsoc = new Map((meds || []).map((m) => [m.asociado_id, m.numero]));
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const detalle = [];
    for (const f of facs || []) {
      const saldo = Math.max(0, Number(f.total) - Number(f.total_pagado || 0));
      if (saldo <= 0) continue;
      const a = asocMap.get(f.asociado_id);
      const limite = f.fecha_limite_pago ? new Date(`${f.fecha_limite_pago}T00:00:00`) : null;
      const dias = limite ? Math.floor((hoy - limite) / 86400000) : 0;
      detalle.push({
        facturaId: f.id,
        numeroFactura: f.numero_factura,
        asociadoId: f.asociado_id,
        asociadoNombre: a ? `${a.nombres} ${a.apellidos}`.trim() : '(sin nombre)',
        documento: a?.documento || '',
        telefono: a?.telefono_principal || '',
        numeroMedidor: medPorAsoc.get(f.asociado_id) || '',
        total: Number(f.total),
        totalPagado: Number(f.total_pagado || 0),
        saldoPendiente: saldo,
        diasVencimiento: dias > 0 ? dias : 0,
        rangoAging: rangoDeDias(dias),
      });
    }

    const aging = RANGOS.map((r) => ({ rango: r, cantidad: 0, monto: 0 }));
    for (const d of detalle) {
      const g = aging.find((x) => x.rango === d.rangoAging);
      if (g) {
        g.cantidad += 1;
        g.monto += d.saldoPendiente;
      }
    }

    // Deudores agregados por asociado (facturas + multas pendientes).
    const porAsoc = new Map();
    const datosAsoc = (id) => {
      const a = asocMap.get(id);
      return {
        asociadoId: id,
        nombres: a?.nombres || '',
        apellidos: a?.apellidos || '',
        documento: a?.documento || '',
        telefono: a?.telefono_principal || '',
        saldoFacturas: 0,
        multas: 0,
      };
    };
    for (const d of detalle) {
      if (!porAsoc.has(d.asociadoId)) porAsoc.set(d.asociadoId, datosAsoc(d.asociadoId));
      porAsoc.get(d.asociadoId).saldoFacturas += d.saldoPendiente;
    }
    for (const m of multas || []) {
      if (!porAsoc.has(m.asociado_id)) porAsoc.set(m.asociado_id, datosAsoc(m.asociado_id));
      porAsoc.get(m.asociado_id).multas += Number(m.valor);
    }
    const deudores = [...porAsoc.values()]
      .map((e) => ({ ...e, total: e.saldoFacturas + e.multas }))
      .filter((e) => e.total > 0)
      .sort((a, b) => b.total - a.total);

    const vencidas = detalle.filter((d) => d.diasVencimiento > 0);
    return {
      detalle,
      aging,
      deudores,
      totalFacturasVencidas: vencidas.length,
      montoTotalVencido: vencidas.reduce((s, d) => s + d.saldoPendiente, 0),
    };
  },
};
