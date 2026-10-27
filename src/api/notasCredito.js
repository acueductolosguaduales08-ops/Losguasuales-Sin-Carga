import { supabase } from '../lib/supabaseClient';

export const NotasCreditoAPI = {
  crear: async (payload) => {
    const { data: numero } = await supabase.rpc('reservar_numero', { p_tipo: 'NOTA_CREDITO' });
    const { data, error } = await supabase.from('notas_credito').insert({
      numero,
      asociado_id: payload.asociadoId || payload.asociado_id,
      factura_id: payload.facturaId || payload.factura_id || null,
      valor: Number(payload.valor),
      motivo: payload.motivo,
    }).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  listar: async () => {
    const { data, error } = await supabase.from('notas_credito').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data;
  },
  obtenerPorId: async (id) => {
    const { data, error } = await supabase.from('notas_credito').select('*').eq('id', id).single();
    if (error) throw new Error('Nota no encontrada.');
    return data;
  },
  listarPorAsociado: async (asociadoId) => {
    const { data, error } = await supabase.from('notas_credito').select('*').eq('asociado_id', asociadoId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },
  aplicar: async (id) => {
    const { data: nc } = await supabase.from('notas_credito').select('*').eq('id', id).single();
    if (!nc || nc.estado !== 'PENDIENTE') throw new Error('Solo PENDIENTE se puede aplicar.');
    if (nc.factura_id) {
      const { data: fac } = await supabase.from('facturas').select('total_pagado, total').eq('id', nc.factura_id).single();
      const pagado = Number(fac.total_pagado) + Number(nc.valor);
      await supabase.from('facturas').update({
        total_pagado: pagado, estado: pagado >= Number(fac.total) ? 'PAGADA' : 'PAGADA_PARCIAL',
      }).eq('id', nc.factura_id);
    }
    await supabase.from('notas_credito').update({ estado: 'APLICADA' }).eq('id', id);
    return true;
  },
  anular: async (id, motivo) => {
    const { error } = await supabase.from('notas_credito').update({ estado: 'ANULADA' }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
};

export const ESTADOS_NOTA_CREDITO = ['PENDIENTE', 'APLICADA', 'ANULADA'];
