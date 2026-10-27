import { supabase } from '../lib/supabaseClient';

// Módulo 03 — Medidores SUPABASE-ONLY con shape de UI
// ({id, numero, asociadoId, estado, asociadoNombre, ultimaLectura}).

function mapMedidor(m, ultima = null) {
  if (!m) return null;
  const a = m.asociados || {};
  return {
    id: m.id,
    numero: m.numero,
    asociadoId: m.asociado_id || null,
    estado: m.estado,
    asociadoNombre: a.nombres ? `${a.nombres} ${a.apellidos || ''}`.trim() : null,
    ultimaLectura: ultima,
  };
}

async function ultimasLecturas(medidorIds) {
  if (!medidorIds.length) return {};
  const { data } = await supabase
    .from('lecturas')
    .select('medidor_id, lectura_actual, created_at')
    .in('medidor_id', medidorIds)
    .eq('anulada', false)
    .order('created_at', { ascending: false });
  const map = {};
  for (const l of data || []) {
    if (!(l.medidor_id in map)) map[l.medidor_id] = l.lectura_actual;
  }
  return map;
}

const SELECT = '*, asociados(nombres, apellidos)';

export const MedidoresAPI = {
  crear: async (payload) => {
    const body = {
      numero: (payload.numero || payload.number || '').trim(),
      asociado_id: payload.asociadoId || payload.asociado_id || null,
      estado: payload.estado || 'ACTIVO',
    };
    if (!body.numero) throw new Error('Número de medidor obligatorio.');
    const { data, error } = await supabase.from('medidores').insert(body).select(SELECT).single();
    if (error) throw new Error(error.message);
    return mapMedidor(data, null);
  },

  editar: async (id, payload) => {
    const body = {};
    if (payload.numero) body.numero = payload.numero.trim();
    if (payload.asociadoId !== undefined || payload.asociado_id !== undefined)
      body.asociado_id = payload.asociadoId ?? payload.asociado_id ?? null;
    if (payload.estado) body.estado = payload.estado;
    const { data, error } = await supabase.from('medidores').update(body).eq('id', id).select(SELECT).single();
    if (error) throw new Error(error.message);
    return mapMedidor(data);
  },

  cambiarEstado: async (id, estado) => {
    const { data, error } = await supabase.from('medidores').update({ estado }).eq('id', id).select(SELECT).single();
    if (error) throw new Error(error.message);
    return mapMedidor(data);
  },

  listar: async () => {
    const { data, error } = await supabase.from('medidores').select(SELECT).order('numero');
    if (error) throw new Error(error.message);
    const ult = await ultimasLecturas((data || []).map((m) => m.id));
    return (data || []).map((m) => mapMedidor(m, ult[m.id] ?? null));
  },

  obtener: async (id) => {
    const { data, error } = await supabase.from('medidores').select(SELECT).eq('id', id).single();
    if (error) throw new Error('Medidor no encontrado.');
    const ult = await ultimasLecturas([id]);
    return mapMedidor(data, ult[id] ?? null);
  },
};

export const ESTADOS_MEDIDOR = ['ACTIVO', 'EN_MANTENIMIENTO', 'DANADO', 'RETIRADO'];
