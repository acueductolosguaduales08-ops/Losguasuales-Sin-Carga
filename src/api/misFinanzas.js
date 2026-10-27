import { supabase } from '../lib/supabaseClient';
import { RecibosAPI } from './recibos';
import { cargarReciboHtmlPorNumero, abrirDocumentoHtml } from '../utils/documentos';
import { multaToCamel } from './tesoreria';

// Mis finanzas SUPABASE-ONLY: resuelve mi asociado_id desde profiles.
export async function myAsociadoId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sin sesión.');
  const { data } = await supabase.from('profiles').select('asociado_id').eq('id', user.id).single();
  if (!data?.asociado_id) throw new Error('Sin asociado vinculado.');
  return data.asociado_id;
}

export const MisFinanzasAPI = {
  // Resumen de saldo del asociado: facturas + multas pendientes.
  miSaldo: async () => {
    const aid = await myAsociadoId();
    const [f, m] = await Promise.all([
      supabase.from('facturas')
        .select('id, numero_factura, total, total_pagado, estado, fecha_emision, fecha_limite_pago, meses_contables(nombre_mes, anios_contables(anio))')
        .eq('asociado_id', aid)
        .neq('estado', 'ANULADA')
        .order('fecha_emision', { ascending: false }),
      supabase.from('multas')
        .select('id, motivo, valor, estado, fecha')
        .eq('asociado_id', aid)
        .eq('estado', 'PENDIENTE'),
    ]);
    if (f.error) throw new Error(f.error.message);
    if (m.error) throw new Error(m.error.message);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const facturas = (f.data || []).map((fa) => {
      const saldo = Math.max(0, Number(fa.total) - Number(fa.total_pagado || 0));
      const limite = fa.fecha_limite_pago ? new Date(`${fa.fecha_limite_pago}T00:00:00`) : null;
      const vencida = !!limite && saldo > 0 && limite < hoy;
      const dias = vencida && limite ? Math.floor((hoy - limite) / 86400000) : 0;
      return {
        id: fa.id,
        numeroFactura: fa.numero_factura,
        nombreMes: fa.meses_contables?.nombre_mes || '',
        anio: fa.meses_contables?.anios_contables?.anio || '',
        total: Number(fa.total),
        saldo,
        fechaLimite: fa.fecha_limite_pago,
        vencida,
        diasVencido: dias,
        estado: fa.estado,
      };
    });
    const saldoFacturas = facturas.reduce((s, x) => s + x.saldo, 0);
    const multasPendientes = (m.data || []).map((mu) => ({
      id: mu.id, motivo: mu.motivo, valor: Number(mu.valor), fecha: mu.fecha,
    }));
    const saldoMultas = multasPendientes.reduce((s, x) => s + x.valor, 0);
    return {
      saldoFacturas,
      saldoMultas,
      saldoTotal: saldoFacturas + saldoMultas,
      facturas,
      multasPendientes,
      vencidasCount: facturas.filter((x) => x.vencida).length,
    };
  },

  listarMiConsumo: async () => {
    const aid = await myAsociadoId();
    const { data: meds } = await supabase.from('medidores').select('id').eq('asociado_id', aid);
    const ids = (meds || []).map((m) => m.id);
    if (!ids.length) return [];
    const { data, error } = await supabase.from('lecturas')
      .select('*, meses_contables(nombre_mes, anios_contables(anio))')
      .in('medidor_id', ids).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((l) => ({
      id: l.id,
      medidorId: l.medidor_id,
      fechaLectura: (l.created_at || '').slice(0, 10),
      lecturaAnterior: l.lectura_anterior,
      lecturaActual: l.lectura_actual,
      consumoM3: l.consumo_m3,
      facturaGenerada: !!l.factura_generada,
      nombreMes: l.meses_contables?.nombre_mes || '',
      anioContable: l.meses_contables?.anios_contables?.anio || '',
    }));
  },
  listarMisMultas: async () => {
    const aid = await myAsociadoId();
    const { data, error } = await supabase.from('multas').select('*').eq('asociado_id', aid).order('fecha', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(multaToCamel);
  },
  listarMisMovimientos: async () => {
    const aid = await myAsociadoId();
    const { data, error } = await supabase.from('movimientos_tesoreria').select('*').eq('asociado_id', aid).order('fecha', { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return data;
  },
  listarMisRecibos: async () => {
    const aid = await myAsociadoId();
    return RecibosAPI.listarPorAsociado(aid);
  },
  reciboDeMulta: async (multaId) => RecibosAPI.buscarPorMulta(multaId),
  htmlRecibo: async (numeroRecibo) => {
    const html = await cargarReciboHtmlPorNumero(numeroRecibo);
    abrirDocumentoHtml(html);
    return html;
  },
  pdfRecibo: async (numeroRecibo) => {
    await cargarReciboHtmlPorNumero(numeroRecibo, { autoPrint: true });
    return { ok: true };
  },
};
