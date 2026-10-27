import { supabase } from '../lib/supabaseClient';

// Módulo 02 — Asociados SUPABASE-ONLY. Mapea snake_case DB <-> camelCase UI.

function toCamel(a) {
  if (!a) return null;
  return {
    id: a.id,
    codigoInterno: a.codigo_interno,
    tipoDocumento: a.tipo_documento,
    documento: a.documento,
    nombres: a.nombres,
    apellidos: a.apellidos,
    fechaNacimiento: a.fecha_nacimiento,
    telefonoPrincipal: a.telefono_principal,
    telefonoAlternativo: a.telefono_alternativo,
    correo: a.correo,
    direccion: a.direccion,
    barrioVereda: a.barrio_vereda,
    observaciones: a.observaciones,
    estadoServicio: a.estado_servicio,
    fechaAfiliacion: a.fecha_afiliacion,
    fechaSuspension: a.fecha_suspension,
    motivoSuspension: a.motivo_suspension,
    fechaReactivacion: a.fecha_reactivacion,
    observacionesAdministrativas: a.observaciones_administrativas,
    archivado: a.archivado,
  };
}

function toSnake(p) {
  const m = {
    codigoInterno: 'codigo_interno',
    tipoDocumento: 'tipo_documento',
    documento: 'documento',
    nombres: 'nombres',
    apellidos: 'apellidos',
    fechaNacimiento: 'fecha_nacimiento',
    telefonoPrincipal: 'telefono_principal',
    telefonoAlternativo: 'telefono_alternativo',
    correo: 'correo',
    direccion: 'direccion',
    barrioVereda: 'barrio_vereda',
    observaciones: 'observaciones',
    estadoServicio: 'estado_servicio',
    fechaAfiliacion: 'fecha_afiliacion',
  };
  const out = {};
  for (const [camel, snake] of Object.entries(m)) {
    if (p[camel] !== undefined) out[snake] = p[camel];
    if (p[snake] !== undefined) out[snake] = p[snake];
  }
  return out;
}

export const AsociadosAPI = {
  crear: async (payload) => {
    const body = toSnake(payload);
    if (!body.documento || !body.nombres || !body.apellidos || !body.direccion) {
      throw new Error('Faltan campos obligatorios del asociado.');
    }
    // Reserva código ASO-00001 atómico (solo staff por RLS/función)
    try {
      const { data: codigo } = await supabase.rpc('reservar_numero', { p_tipo: 'ASOCIADO' });
      if (codigo) body.codigo_interno = codigo;
    } catch {
      // Si falla el rpc (p.ej. sin permiso), sigue sin código; DB lo permite nullable
    }
    if (!body.fecha_afiliacion) body.fecha_afiliacion = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('asociados')
      .insert(body)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  },

  editar: async (id, payload) => {
    const body = toSnake(payload);
    delete body.codigo_interno;
    delete body.documento; // documento único no se cambia en edición simple
    const { data, error } = await supabase
      .from('asociados')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  },

  buscar: async (q, extraParams, signal) => {
    let query = supabase.from('asociados').select('*').eq('archivado', false).order('apellidos').limit(extraParams?.size || 100);
    if (q) {
      const like = `%${q}%`;
      query = query.or(`documento.ilike.${like},nombres.ilike.${like},apellidos.ilike.${like},telefono_principal.ilike.${like}`);
    }
    const { data, error } = await query.abortSignal(signal || null);
    if (error) throw new Error(error.message);
    return (data || []).map(toCamel);
  },

  filtrarPorEstado: async (estado) => {
    const { data, error } = await supabase
      .from('asociados')
      .select('*')
      .eq('estado_servicio', estado)
      .eq('archivado', false)
      .order('apellidos');
    if (error) throw new Error(error.message);
    return (data || []).map(toCamel);
  },

  obtener: async (id) => {
    const { data, error } = await supabase.from('asociados').select('*').eq('id', id).single();
    if (error) throw new Error('Asociado no encontrado.');
    return toCamel(data);
  },

  resumenFinanciero: async (id) => {
    const { data, error } = await supabase.rpc('resumen_financiero', { p_asociado_id: id });
    if (error) throw new Error(error.message);
    return data;
  },

  cambiarEstadoServicio: async (id, { estado, motivo }) => {
    const { data, error } = await supabase
      .from('asociados')
      .update({
        estado_servicio: estado,
        motivo_suspension: motivo || null,
        fecha_suspension: estado === 'SUSPENDIDO' ? new Date().toISOString().slice(0, 10) : null,
        fecha_reactivacion: estado === 'ACTIVO' ? new Date().toISOString().slice(0, 10) : null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  },

  archivar: async (id) => {
    const { error } = await supabase.from('asociados').update({ archivado: true }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
};

export const ESTADOS_SERVICIO = ['ACTIVO', 'SUSPENDIDO', 'INACTIVO'];
export const TIPOS_DOCUMENTO = ['CC', 'CE', 'TI', 'NIT', 'PASAPORTE'];
