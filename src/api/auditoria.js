import { supabase } from '../lib/supabaseClient';

export const AuditoriaAPI = {
  listar: async () => {
    const { data, error } = await supabase.from('auditoria').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return { content: data, totalElements: data?.length || 0 };
  },
  filtrarPorModulo: async (modulo) => {
    const { data, error } = await supabase.from('auditoria').select('*').eq('modulo', modulo).order('created_at', { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return { content: data, totalElements: data?.length || 0 };
  },
  filtrarPorUsuario: async (usuario) => {
    const { data, error } = await supabase.from('auditoria').select('*').eq('usuario_nombre', usuario).order('created_at', { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return { content: data, totalElements: data?.length || 0 };
  },
  obtenerEstado: async () => {
    const { data } = await supabase.from('configuracion').select('auditoria_activa').eq('id', 1).single();
    return { activa: data?.auditoria_activa ?? true };
  },
  desactivar: async (nombre) => {
    await supabase.from('configuracion').update({ auditoria_activa: false }).eq('id', 1);
    await supabase.from('auditoria').insert({ modulo: 'AUDITORIA', usuario_nombre: nombre || 'admin', accion: 'DESACTIVAR' });
    return true;
  },
  activar: async (nombre) => {
    await supabase.from('configuracion').update({ auditoria_activa: true }).eq('id', 1);
    await supabase.from('auditoria').insert({ modulo: 'AUDITORIA', usuario_nombre: nombre || 'admin', accion: 'ACTIVAR' });
    return true;
  },
};

export async function registrarAuditoria(modulo, accion, detalle) {
  try {
    const { data } = await supabase.from('configuracion').select('auditoria_activa').eq('id', 1).single();
    if (data && data.auditoria_activa === false) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('auditoria').insert({ modulo, usuario_id: user?.id || null, accion, detalle: detalle || null });
  } catch { /* auditoría nunca rompe el flujo */ }
}
