import { supabase } from '../lib/supabaseClient';

export const EncuestasAPI = {
  listarAdmin: async () => {
    const { data, error } = await supabase.from('encuestas').select('*, preguntas_encuesta(*)').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },
  crear: async (payload) => {
    const { data: { user } } = await supabase.auth.getUser();
    let codigo = null;
    try {
      const { data: c } = await supabase.rpc('reservar_numero', { p_tipo: 'FORMULARIO' });
      codigo = c;
    } catch { /* sigue sin código */ }
    const { data: enc, error } = await supabase.from('encuestas').insert({
      codigo, titulo: payload.titulo, descripcion: payload.descripcion || null,
      estado: payload.publico ? 'ACTIVA' : 'BORRADOR',
      publico: !!payload.publico, requiere_auth: payload.requiereAuth ?? true,
      respuesta_unica: !!payload.respuestaUnica, respuestas_anonimas: !!payload.respuestasAnonimas,
      fecha_inicio: payload.fechaInicio || null, fecha_fin: payload.fechaFin || null,
      creado_por: user?.id || null,
    }).select().single();
    if (error) throw new Error(error.message);
    if (payload.preguntas?.length) {
      const rows = payload.preguntas.map((p, i) => ({
        encuesta_id: enc.id, texto: p.texto, tipo: p.tipo || 'TEXTO_CORTO',
        opciones: p.opciones || [], obligatoria: p.obligatoria ?? true, orden: i,
      }));
      await supabase.from('preguntas_encuesta').insert(rows);
    }
    return enc;
  },
  activar: async (id) => {
    const { error } = await supabase.from('encuestas').update({ estado: 'ACTIVA' }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
  desactivar: async (id) => {
    const { error } = await supabase.from('encuestas').update({ estado: 'FINALIZADA' }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
  archivar: async (id) => {
    const { error } = await supabase.from('encuestas').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
  estadisticas: async (id) => {
    const { data: preguntas } = await supabase.from('preguntas_encuesta').select('*').eq('encuesta_id', id).order('orden');
    const { data: respuestas } = await supabase.from('respuestas_encuesta').select('id').eq('encuesta_id', id);
    const total = (respuestas || []).length;
    const { data: detalle } = await supabase.from('respuestas_pregunta').select('pregunta_id, valor_texto').in('respuesta_id', (respuestas || []).map((r) => r.id));
    return { totalRespuestas: total, preguntas, detalle: detalle || [] };
  },
  listarPublicas: async () => {
    const { data, error } = await supabase.from('encuestas').select('*, preguntas_encuesta(*)').eq('estado', 'ACTIVA').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },
  detalle: async (id) => {
    const { data, error } = await supabase.from('encuestas').select('*, preguntas_encuesta(*)').eq('id', id).single();
    if (error) throw new Error('Encuesta no encontrada.');
    return data;
  },
  porCodigo: async (codigo) => {
    const { data, error } = await supabase.from('encuestas').select('*, preguntas_encuesta(*)').eq('codigo', codigo).single();
    if (error) throw new Error('Encuesta no encontrada.');
    return data;
  },
  responder: async (id, payload) => {
    const { data: { user } } = await supabase.auth.getUser();
    const respuestas = payload.respuestas || payload;
    const { data: enc } = await supabase.from('encuestas').select('respuesta_unica').eq('id', id).single();
    if (enc?.respuesta_unica && user) {
      const { count } = await supabase.from('respuestas_encuesta').select('id', { count: 'exact', head: true }).eq('encuesta_id', id).eq('usuario_id', user.id);
      if ((count || 0) > 0) throw new Error('Ya respondiste esta encuesta.');
    }
    const { data: resp, error } = await supabase.from('respuestas_encuesta').insert({
      encuesta_id: id, usuario_id: user?.id || null, anonimo_nombre: payload.nombre || null,
    }).select().single();
    if (error) throw new Error(error.message);
    const rows = Object.entries(respuestas)
      .filter(([k]) => k !== 'nombre')
      .map(([pregunta_id, valor]) => ({
        respuesta_id: resp.id, pregunta_id,
        valor_texto: typeof valor === 'string' ? valor : null,
        valores: Array.isArray(valor) ? valor : [],
      }));
    if (rows.length) await supabase.from('respuestas_pregunta').insert(rows);
    return true;
  },
  listarRespuestas: async (id) => {
    const { data, error } = await supabase.from('respuestas_encuesta').select('*, respuestas_pregunta(*, preguntas_encuesta(texto))').eq('encuesta_id', id).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },
};

export const TIPOS_PREGUNTA = [
  { value: 'TEXTO_CORTO', label: 'Texto corto' },
  { value: 'TEXTO_LARGO', label: 'Texto largo' },
  { value: 'SI_NO', label: 'Sí / No' },
  { value: 'ESCALA', label: '5 estrellas' },
  { value: 'OPCION_UNICA', label: 'Opciones personalizadas' },
];

export function normalizarTipoPregunta(tipo) {
  switch (tipo) {
    case 'ESTRELLAS':
    case 'ESCALA': return 'ESCALA';
    case 'OPCIONES':
    case 'OPCION_UNICA': return 'OPCION_UNICA';
    case 'OPCION_MULTIPLE': return 'OPCION_MULTIPLE';
    default: return tipo;
  }
}
