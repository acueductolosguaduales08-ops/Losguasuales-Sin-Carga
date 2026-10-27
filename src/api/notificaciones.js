import { supabase } from '../lib/supabaseClient';

// Mapea fila snake -> shape viejo que espera la UI.
function toCamel(n) {
  if (!n) return null;
  return {
    id: n.id,
    titulo: n.titulo,
    mensaje: n.mensaje,
    descripcionCorta: n.descripcion_corta || n.mensaje || '',
    contenidoCompleto: n.contenido_completo || n.mensaje || '',
    tipo: n.tipo,
    prioridad: n.prioridad,
    estado: n.estado,
    asociadoId: n.asociado_id || null,
    destinatarioId: n.asociado_id || null,
    enlaceUrl: n.enlace_url || null,
    fechaPublicacion: n.created_at,
    fechaVencimiento: n.fecha_vencimiento || null,
    created_at: n.created_at,
  };
}

async function resolverAsociadoId(destinatarioId) {
  if (!destinatarioId) return null;
  // Acepta uuid de asociado directo; si es otra cosa, queda como aviso general.
  const { data } = await supabase.from('asociados').select('id').eq('id', destinatarioId).single();
  if (data) return data.id;
  const { data: prof } = await supabase.from('profiles').select('asociado_id').eq('id', destinatarioId).single();
  return prof?.asociado_id || null;
}

export const NotificacionesAPI = {
  publicas: async () => {
    const { data, error } = await supabase.from('notificaciones').select('*').eq('tipo', 'PUBLICA').eq('estado', 'ACTIVA').order('created_at', { ascending: false }).limit(10);
    if (error) throw new Error(error.message);
    const items = (data || []).map(toCamel);
    return { content: items, totalElements: items.length };
  },
  misNotificaciones: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('notificaciones').select('*').eq('estado', 'ACTIVA').order('created_at', { ascending: false }).limit(20);
    if (error) throw new Error(error.message);
    let items = (data || []).map(toCamel);
    if (!user) return { content: items.filter((n) => n.tipo === 'PUBLICA'), totalElements: 0 };
    const { data: prof } = await supabase.from('profiles').select('asociado_id').eq('id', user.id).single();
    items = items.filter((n) => n.tipo === 'PUBLICA' || (prof?.asociado_id && n.asociadoId === prof.asociado_id));
    return { content: items, totalElements: items.length };
  },
  crear: async (payload) => {
    if (!payload.titulo?.trim()) throw new Error('El título es obligatorio.');
    const mensaje = payload.contenidoCompleto || payload.contenido_completo || payload.mensaje || payload.descripcionCorta || payload.titulo;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('notificaciones').insert({
      titulo: payload.titulo.trim(),
      mensaje,
      descripcion_corta: (payload.descripcionCorta || '').slice(0, 500) || null,
      contenido_completo: payload.contenidoCompleto || null,
      tipo: payload.tipo || 'PUBLICA',
      prioridad: payload.prioridad || 'NORMAL',
      asociado_id: await resolverAsociadoId(payload.destinatarioId || payload.asociadoId),
      enlace_url: payload.enlaceUrl || null,
      fecha_vencimiento: payload.fechaVencimiento || null,
      creado_por: user?.id || null,
    }).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  },
  avisoTesorero: async (payload) => NotificacionesAPI.crear({ ...payload, tipo: 'PUBLICA' }),
  marcarLeida: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true;
    await supabase.from('notificaciones_lectura').upsert({ notificacion_id: id, usuario_id: user.id }, { onConflict: 'notificacion_id,usuario_id' });
    return true;
  },
  eliminar: async (id) => {
    const { error } = await supabase.from('notificaciones').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
  eliminarTodas: async () => {
    const { error } = await supabase.from('notificaciones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(error.message);
    return true;
  },
};
