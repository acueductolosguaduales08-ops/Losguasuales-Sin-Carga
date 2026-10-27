import { supabase } from '../lib/supabaseClient';

export const ReportesComunidadAPI = {
  enviar: async (payload) => {
    const { data, error } = await supabase.from('reportes_ciudadanos').insert({
      nombre: payload.nombre, mensaje: payload.mensaje,
      contacto: payload.contacto || null, imagen_url: payload.imagenUrl || payload.imagen_url || null,
    }).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  listar: async () => {
    const { data, error } = await supabase.from('reportes_ciudadanos').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) throw new Error(error.message);
    const items = (data || []).map((r) => ({
      ...r,
      imagenUrl: r.imagen_url || '',
      fechaCreacion: r.created_at,
    }));
    return { content: items, totalElements: items.length };
  },
  eliminar: async (id) => {
    const { error } = await supabase.from('reportes_ciudadanos').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
};
