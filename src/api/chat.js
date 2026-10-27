import { supabase } from '../lib/supabaseClient';

// Módulo 16 — Chat SUPABASE-ONLY con realtime (supabase channel en ChatPage sigue igual).
export const ChatAPI = {
  obtenerContactos: async () => {
    const { data, error } = await supabase.rpc('contactos_disponibles');
    if (error) throw new Error(error.message);
    return (data || []).map((u) => ({
      id: u.id, usuarioId: u.id, nombre: u.username, iniciales: (u.username || '?').slice(0, 2).toUpperCase(), rol: u.rol, contacto: '',
    }));
  },

  crearConversacion: async (destinatarioId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const a = user.id < destinatarioId ? user.id : destinatarioId;
    const b = user.id < destinatarioId ? destinatarioId : user.id;
    // Evita ASOCIADO-ASOCIADO (regla Spring)
    const { data: roles } = await supabase.from('profiles').select('id, rol').in('id', [a, b]);
    const r = Object.fromEntries((roles || []).map((x) => [x.id, x.rol]));
    if (r[a] === 'ASOCIADO' && r[b] === 'ASOCIADO') throw new Error('No puedes chatear con otro asociado.');
    const { data, error } = await supabase.from('conversaciones').upsert({ participante_a: a, participante_b: b }, { onConflict: 'participante_a,participante_b' }).select().single();
    if (error) throw new Error(error.message);
    // Normaliza para la UI: devuelve también el otro participante como destinatario
    return { ...data, destinatarioId };
  },

  listarConversaciones: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('conversaciones').select('*').or(`participante_a.eq.${user.id},participante_b.eq.${user.id}`).order('ultimo_mensaje_at', { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  marcarLeidos: async (conversacionId) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('mensajes').update({ leido: true }).eq('conversacion_id', conversacionId).neq('remitente_id', user.id);
    return true;
  },

  eliminarConversacion: async (conversacionId) => {
    const { error } = await supabase.from('conversaciones').delete().eq('id', conversacionId);
    if (error) throw new Error(error.message);
    return true;
  },

  obtenerMensajes: async (conversacionId) => {
    const { data, error } = await supabase.from('mensajes').select('*').eq('conversacion_id', conversacionId).order('created_at');
    if (error) throw new Error(error.message);
    return (data || []).map((m) => ({ ...m, contenido: m.texto }));
  },

  enviarMensaje: async (conversacionId, contenido) => {
    const texto = typeof contenido === 'string' ? contenido : contenido?.contenido;
    if (!texto || texto.length > 2000) throw new Error('Mensaje inválido (máx 2000).');
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('mensajes').insert({ conversacion_id: conversacionId, remitente_id: user.id, texto }).select().single();
    if (error) throw new Error(error.message);
    await supabase.from('conversaciones').update({ ultimo_mensaje_at: new Date().toISOString() }).eq('id', conversacionId);
    return { ...data, contenido: data.texto };
  },

  editarMensaje: async (mensajeId, contenido) => {
    const texto = typeof contenido === 'string' ? contenido : contenido?.contenido;
    const { error } = await supabase.from('mensajes').update({ texto }).eq('id', mensajeId);
    if (error) throw new Error(error.message);
    return true;
  },

  solicitarEliminacion: async (mensajeId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('solicitudes_eliminacion').insert({ mensaje_id: mensajeId, solicitado_por: user.id }).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  listarSolicitudes: async () => {
    const { data, error } = await supabase.from('solicitudes_eliminacion').select('*').eq('estado', 'PENDIENTE');
    if (error) throw new Error(error.message);
    return data || [];
  },
  aceptarSolicitud: async (solicitudId) => {
    const { data: sol } = await supabase.from('solicitudes_eliminacion').select('mensaje_id').eq('id', solicitudId).single();
    if (sol) await supabase.from('mensajes').delete().eq('id', sol.mensaje_id);
    await supabase.from('solicitudes_eliminacion').update({ estado: 'ACEPTADA' }).eq('id', solicitudId);
    return true;
  },
  rechazarSolicitud: async (solicitudId) => {
    await supabase.from('solicitudes_eliminacion').update({ estado: 'RECHAZADA' }).eq('id', solicitudId);
    return true;
  },
  cancelarSolicitud: async (solicitudId) => {
    await supabase.from('solicitudes_eliminacion').update({ estado: 'CANCELADA' }).eq('id', solicitudId);
    return true;
  },
};
