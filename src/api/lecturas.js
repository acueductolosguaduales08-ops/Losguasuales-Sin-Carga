import { supabase } from '../lib/supabaseClient';

// Módulo 04 — Lecturas SUPABASE-ONLY. Mapea al camelCase de la UI.
// Las lecturas aceptan hasta 2 decimales (ej. 3.07 m³): se redondean,
// nunca se truncan, para no perder agua facturable.

function mapLectura(l) {
  if (!l) return null;
  const med = l.medidores || {};
  const asoc = med.asociados || l.asociados || {};
  const nombre = asoc.nombres ? `${asoc.nombres} ${asoc.apellidos || ''}`.trim() : null;
  return {
    id: l.id,
    medidorId: l.medidor_id,
    mesContableId: l.mes_contable_id,
    fechaLectura: (l.created_at || '').slice(0, 10),
    lecturaAnterior: l.lectura_anterior,
    lecturaActual: l.lectura_actual,
    consumoM3: l.consumo_m3,
    facturaGenerada: !!l.factura_generada,
    anulada: !!l.anulada,
    numeroMedidor: med.numero || null,
    asociadoId: med.asociado_id || asoc.id || null,
    asociadoNombre: nombre,
  };
}

const SELECT = '*, medidores(numero, asociado_id, asociados(id, nombres, apellidos))';

function toDec(v, campo) {
  const n = Math.round(Number(v) * 100) / 100;
  if (!Number.isFinite(n) || n < 0) throw new Error(`${campo} debe ser un número positivo (hasta 2 decimales).`);
  return n;
}

export const LecturasAPI = {
  crear: async (payload) => {
    const medidorId = payload.medidorId || payload.medidor_id;
    const mesId = payload.mesContableId || payload.mes_contable_id || payload.mesId;
    const actual = toDec(payload.lecturaActual ?? payload.lectura_actual, 'La lectura actual');
    const antRaw = payload.lecturaAnterior ?? payload.lectura_anterior ?? null;
    const anterior = antRaw === null || antRaw === '' ? null : toDec(antRaw, 'La lectura anterior');
    if (!medidorId || !mesId) throw new Error('Faltan medidor o mes.');
    const { data: nuevoId, error } = await supabase.rpc('crear_lectura', {
      p_medidor_id: medidorId,
      p_mes_id: mesId,
      p_actual: actual,
      p_anterior: anterior,
    });
    if (error) throw new Error(error.message);
    return LecturasAPI.obtener(nuevoId);
  },

  editar: async (id, payload) => {
    const { data: actual } = await supabase.from('lecturas').select('factura_generada, lectura_anterior').eq('id', id).single();
    if (actual?.factura_generada) throw new Error('No se puede editar: ya generó factura.');
    const nuevo = toDec(payload.lecturaActual ?? payload.lectura_actual, 'La lectura actual');
    if (nuevo < Number(actual?.lectura_anterior ?? 0)) throw new Error('Lectura actual menor que anterior.');
    const { error } = await supabase.from('lecturas')
      .update({ lectura_actual: nuevo, consumo_m3: nuevo - Number(actual?.lectura_anterior ?? 0) })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return LecturasAPI.obtener(id);
  },

  obtener: async (id) => {
    const { data, error } = await supabase.from('lecturas').select(SELECT).eq('id', id).single();
    if (error) throw new Error('Lectura no encontrada.');
    return mapLectura(data);
  },

  historialAsociado: async (asociadoId) => {
    const { data: meds } = await supabase.from('medidores').select('id').eq('asociado_id', asociadoId);
    const ids = (meds || []).map((m) => m.id);
    if (!ids.length) return [];
    const { data, error } = await supabase
      .from('lecturas')
      .select('*, medidores!inner(numero, asociado_id, asociados!inner(id, nombres, apellidos))')
      .in('medidor_id', ids)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapLectura);
  },

  eliminar: async (id) => {
    const { data } = await supabase.from('lecturas').select('factura_generada').eq('id', id).single();
    if (data?.factura_generada) throw new Error('No se puede eliminar: ya generó factura.');
    const { error } = await supabase.from('lecturas').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  porMes: async (mesContableId) => {
    const { data, error } = await supabase
      .from('lecturas')
      .select(SELECT)
      .eq('mes_contable_id', mesContableId)
      .order('created_at');
    if (error) throw new Error(error.message);
    return (data || []).map(mapLectura);
  },
};
