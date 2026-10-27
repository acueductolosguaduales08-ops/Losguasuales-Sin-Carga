import { supabase } from '../lib/supabaseClient';

export const GALLERY_CATEGORY = 'gallery';

// Mapea fila snake_case -> shape camelCase que espera la UI vieja.
function toCamel(p, categoriaNombre = null, etiquetasNombres = [], etiquetasIds = []) {
  if (!p) return null;
  return {
    id: p.id,
    titulo: p.titulo,
    descripcionCorta: p.descripcion_corta || '',
    contenidoCompleto: p.contenido || '',
    contenido: p.contenido || '',
    imagenUrl: p.imagen_url || '',
    posicionImagen: p.posicion_imagen || 'ARRIBA',
    categoriaId: p.categoria_id || null,
    categoria: categoriaNombre || '',
    estado: p.estado,
    destacada: !!p.destacada,
    etiquetas: etiquetasNombres,
    etiquetasIds,
    created_at: p.created_at,
    updated_at: p.updated_at,
    fechaCreacion: p.created_at,
    fechaPublicacion: p.created_at,
  };
}

async function enrich(rows) {
  const list = rows || [];
  if (!list.length) return [];
  const ids = list.map((p) => p.id);
  const catIds = [...new Set(list.map((p) => p.categoria_id).filter(Boolean))];
  let catMap = {};
  if (catIds.length) {
    const { data: cats } = await supabase.from('categorias').select('id, nombre').in('id', catIds);
    catMap = Object.fromEntries((cats || []).map((c) => [c.id, c.nombre]));
  }
  const { data: links } = await supabase.from('publicacion_etiquetas').select('publicacion_id, etiqueta_id').in('publicacion_id', ids);
  const tagIds = [...new Set((links || []).map((l) => l.etiqueta_id))];
  let tagMap = {};
  if (tagIds.length) {
    const { data: tags } = await supabase.from('etiquetas').select('id, nombre').in('id', tagIds);
    tagMap = Object.fromEntries((tags || []).map((t) => [t.id, t.nombre]));
  }
  const byPub = {};
  for (const l of links || []) {
    (byPub[l.publicacion_id] = byPub[l.publicacion_id] || { ids: [], names: [] });
    byPub[l.publicacion_id].ids.push(l.etiqueta_id);
    if (tagMap[l.etiqueta_id]) byPub[l.publicacion_id].names.push(tagMap[l.etiqueta_id]);
  }
  return list.map((p) => toCamel(p, catMap[p.categoria_id] || '', byPub[p.id]?.names || [], byPub[p.id]?.ids || []));
}

function toSnake(payload) {
  const contenido = payload.contenidoCompleto || payload.contenido || payload.descripcionCorta || payload.titulo || 'Sin contenido';
  return {
    titulo: payload.titulo,
    contenido,
    descripcion_corta: payload.descripcionCorta || payload.descripcion_corta || null,
    imagen_url: payload.imagenUrl || payload.imagen_url || null,
    posicion_imagen: payload.posicionImagen || payload.posicion_imagen || 'ARRIBA',
    categoria_id: payload.categoriaId || payload.categoria_id || null,
    estado: payload.estado || 'BORRADOR',
    destacada: !!payload.destacada,
  };
}

async function vincularEtiquetas(publicacionId, ids) {
  if (!ids?.length) return;
  const { data: existentes } = await supabase.from('etiquetas').select('id');
  const validos = new Set((existentes || []).map((e) => e.id));
  const rows = ids.filter((id) => validos.has(id)).map((etiqueta_id) => ({ publicacion_id: publicacionId, etiqueta_id }));
  if (rows.length) await supabase.from('publicacion_etiquetas').insert(rows);
}

export const PublicacionesAPI = {
  listarPublicas: async ({ page = 0, size = 24 } = {}) => {
    const from = page * size;
    const { data, error, count } = await supabase.from('publicaciones').select('*', { count: 'exact' }).eq('estado', 'PUBLICADA').order('created_at', { ascending: false }).range(from, from + size - 1);
    if (error) throw new Error(error.message);
    const items = await enrich(data);
    const total = count || items.length;
    return { content: items, totalElements: total, totalPages: Math.max(1, Math.ceil(total / size)) };
  },
  listarAdmin: async () => {
    const { data, error } = await supabase.from('publicaciones').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    const items = await enrich(data);
    return { content: items, totalElements: items.length };
  },
  detalle: async (id) => {
    const { data, error } = await supabase.from('publicaciones').select('*').eq('id', id).single();
    if (error) throw new Error('Publicación no encontrada.');
    return (await enrich([data]))[0];
  },
  destacadas: async () => {
    const { data, error } = await supabase.from('publicaciones').select('*').eq('estado', 'PUBLICADA').eq('destacada', true).order('created_at', { ascending: false }).limit(6);
    if (error) throw new Error(error.message);
    return enrich(data);
  },
  crear: async (payload) => {
    if (!payload.titulo?.trim()) throw new Error('El título es obligatorio.');
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('publicaciones').insert({ ...toSnake(payload), autor_id: user?.id || null }).select().single();
    if (error) throw new Error(error.message);
    await vincularEtiquetas(data.id, payload.etiquetasIds || payload.etiquetas_ids || []);
    return (await enrich([data]))[0];
  },
  editar: async (id, payload) => {
    const body = toSnake(payload);
    delete body.estado; // el estado se cambia con publicar/ocultar
    const { data, error } = await supabase.from('publicaciones').update(body).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (payload.etiquetasIds !== undefined || payload.etiquetas_ids !== undefined) {
      await supabase.from('publicacion_etiquetas').delete().eq('publicacion_id', id);
      await vincularEtiquetas(id, payload.etiquetasIds || payload.etiquetas_ids || []);
    }
    return (await enrich([data]))[0];
  },
  publicar: async (id) => {
    const { error } = await supabase.from('publicaciones').update({ estado: 'PUBLICADA' }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
  ocultar: async (id) => {
    const { error } = await supabase.from('publicaciones').update({ estado: 'OCULTA' }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
  destacar: async (id, destacada) => {
    const { error } = await supabase.from('publicaciones').update({ destacada: !!destacada }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
  eliminar: async (id) => {
    const { error } = await supabase.from('publicaciones').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
  categorias: async () => {
    const { data, error } = await supabase.from('categorias').select('*').order('nombre');
    if (error) throw new Error(error.message);
    return data;
  },
  crearCategoria: async (nombre) => {
    const { data, error } = await supabase.from('categorias').insert({ nombre }).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  etiquetas: async () => {
    const { data, error } = await supabase.from('etiquetas').select('*').order('nombre');
    if (error) throw new Error(error.message);
    return data;
  },
  crearEtiqueta: async (nombre) => {
    const { data, error } = await supabase.from('etiquetas').insert({ nombre }).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  eliminarEtiqueta: async (id) => {
    const { error } = await supabase.from('etiquetas').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
  videosPublicos: async () => {
    const { data, error } = await supabase.from('videos').select('*').eq('oculto', false).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((v) => ({ ...v, urlVideo: v.url }));
  },
  crearVideo: async (payload) => {
    if (!payload.titulo?.trim() || !(payload.urlVideo || payload.url)?.trim()) {
      throw new Error('Título y URL son obligatorios.');
    }
    const { data, error } = await supabase.from('videos').insert({
      titulo: payload.titulo.trim(),
      url: (payload.urlVideo || payload.url).trim(),
    }).select().single();
    if (error) throw new Error(error.message);
    return { ...data, urlVideo: data.url };
  },
  ocultarVideo: async (id) => {
    const { error } = await supabase.from('videos').update({ oculto: true }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
  reacciones: async (id) => {
    const { data, error } = await supabase.from('reacciones_publicacion').select('tipo').eq('publicacion_id', id);
    if (error) throw new Error(error.message);
    const total = (data || []).length;
    return total > 0 ? [{ emoji: '👍', contador: total }] : [];
  },
  reaccionar: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Inicia sesión para reaccionar.');
    const { error } = await supabase.from('reacciones_publicacion').upsert({ publicacion_id: id, usuario_id: user.id, tipo: 'LIKE' }, { onConflict: 'publicacion_id,usuario_id' });
    if (error) throw new Error(error.message);
    return true;
  },
  quitarReaccion: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('reacciones_publicacion').delete().eq('publicacion_id', id).eq('usuario_id', user.id);
    if (error) throw new Error(error.message);
    return true;
  },
};
