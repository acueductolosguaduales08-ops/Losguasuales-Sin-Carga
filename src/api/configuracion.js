import { supabase } from '../lib/supabaseClient';

// Módulo 06 — Configuración SUPABASE-ONLY (singleton id=1 + metodos + hero + archivos).

function toCamel(c) {
  if (!c) return null;
  return {
    nombreAcueducto: c.nombre_acueducto,
    nit: c.nit,
    direccion: c.direccion,
    telefonoPrincipal: c.telefono_principal,
    correo: c.correo,
    municipio: c.municipio,
    departamento: c.departamento,
    banco: c.banco,
    tipoCuenta: c.tipo_cuenta,
    numeroCuenta: c.numero_cuenta,
    titularCuenta: c.titular_cuenta,
    valorM3: Number(c.valor_m3),
    cargoFijoAdministracion: Number(c.cargo_fijo_administracion),
    valorReconexion: Number(c.valor_reconexion ?? 0),
    valorMultaDefecto: Number(c.valor_multa_defecto ?? 0),
    diasPlazoPago: c.dias_plazo_pago,
    diasParaSuspension: c.dias_para_suspension,
    notasFactura: c.notas_factura,
    logoActivo: c.logo_activo,
    firmaActiva: c.firma_activa,
    selloActivo: c.sello_activo,
    modoHero: c.modo_hero,
    auditoriaActiva: c.auditoria_activa,
    edicionAsociadosActiva: c.edicion_asociados_activa,
  };
}

export const ConfiguracionAPI = {
  obtener: async () => {
    const { data, error } = await supabase.from('configuracion').select('*').eq('id', 1).single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  },

  actualizar: async (payload) => {
    const map = {
      nombreAcueducto: 'nombre_acueducto', nit: 'nit', direccion: 'direccion',
      telefonoPrincipal: 'telefono_principal', correo: 'correo', municipio: 'municipio',
      departamento: 'departamento', banco: 'banco', tipoCuenta: 'tipo_cuenta',
      numeroCuenta: 'numero_cuenta', titularCuenta: 'titular_cuenta',
      valorM3: 'valor_m3', cargoFijoAdministracion: 'cargo_fijo_administracion',
      valorReconexion: 'valor_reconexion', valorMultaDefecto: 'valor_multa_defecto',
      diasPlazoPago: 'dias_plazo_pago', diasParaSuspension: 'dias_para_suspension',
      notasFactura: 'notas_factura',
    };
    const body = {};
    for (const [camel, snake] of Object.entries(map)) {
      if (payload[camel] !== undefined) body[snake] = payload[camel];
      if (payload[snake] !== undefined) body[snake] = payload[snake];
    }
    const { data, error } = await supabase.from('configuracion').update(body).eq('id', 1).select().single();
    if (error) throw new Error(error.message);
    // Guarda historial de tarifas como hacía Spring
    if (body.valor_m3 !== undefined || body.cargo_fijo_administracion !== undefined) {
      await supabase.from('tarifas_historial').insert({
        valor_m3: body.valor_m3 ?? data.valor_m3,
        cargo_fijo: body.cargo_fijo_administracion ?? data.cargo_fijo_administracion,
      });
    }
    return toCamel(data);
  },

  listarMetodosPago: async () => {
    const { data, error } = await supabase.from('metodos_pago').select('*').order('nombre');
    if (error) throw new Error(error.message);
    return data;
  },
  crearMetodoPago: async (nombre) => {
    const { data, error } = await supabase.from('metodos_pago').insert({ nombre }).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  activarMetodoPago: async (id, activo) => {
    const { error } = await supabase.from('metodos_pago').update({ activo }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  // Archivos: ahora directo a Storage + tabla archivos_institucionales
  listarArchivos: async (tipo) => {
    const { data, error } = await supabase.from('archivos_institucionales').select('*').eq('tipo', tipo).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },
  registrarArchivoUrl: async (tipo, url) => {
    const { data, error } = await supabase.from('archivos_institucionales').insert({ tipo, fuente: 'URL', ruta: url, activo: false }).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  activarArchivo: async (archivoId) => {
    const { data: arch } = await supabase.from('archivos_institucionales').select('tipo, ruta').eq('id', archivoId).single();
    if (!arch) throw new Error('Archivo no encontrado.');
    await supabase.from('archivos_institucionales').update({ activo: false }).eq('tipo', arch.tipo);
    await supabase.from('archivos_institucionales').update({ activo: true }).eq('id', archivoId);
    const col = arch.tipo === 'LOGO' ? 'logo_activo' : arch.tipo === 'FIRMA' ? 'firma_activa' : 'sello_activo';
    await supabase.from('configuracion').update({ [col]: arch.ruta }).eq('id', 1);
    return true;
  },
  eliminarArchivo: async (archivoId) => {
    const { error } = await supabase.from('archivos_institucionales').delete().eq('id', archivoId);
    if (error) throw new Error(error.message);
    return true;
  },
  subirArchivo: async () => {
    throw new Error('Usa ImageUploader a Supabase Storage directamente (sin backend).');
  },
  subirArchivoDirect: async () => {
    throw new Error('Usa ImageUploader a Supabase Storage directamente (sin backend).');
  },

  activarEdicionAsociados: async (activa) => {
    const { error } = await supabase.from('configuracion').update({ edicion_asociados_activa: activa }).eq('id', 1);
    if (error) throw new Error(error.message);
    return true;
  },

  heroActual: async () => {
    const { data: conf } = await supabase.from('configuracion').select('modo_hero').eq('id', 1).single();
    const { data: links } = await supabase.from('hero_links').select('*').order('created_at');
    if (!links?.length) return null;
    if (conf?.modo_hero === 'UNICO') return links.find((l) => l.principal) || links[0];
    return links[Math.floor(Math.random() * links.length)];
  },
  heroListar: async () => {
    const { data, error } = await supabase.from('hero_links').select('*').order('created_at');
    if (error) throw new Error(error.message);
    return data;
  },
  heroAgregar: async (link) => {
    const body = typeof link === 'string' ? { titulo: link, link } : link;
    const { data, error } = await supabase.from('hero_links').insert(body).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  heroEliminar: async (id) => {
    const { error } = await supabase.from('hero_links').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
  heroPrincipal: async (id) => {
    await supabase.from('hero_links').update({ principal: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    const { error } = await supabase.from('hero_links').update({ principal: true }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
  heroModo: async (modo) => {
    const { error } = await supabase.from('configuracion').update({ modo_hero: modo }).eq('id', 1);
    if (error) throw new Error(error.message);
    return true;
  },

  historialTarifas: async () => {
    const { data, error } = await supabase.from('tarifas_historial').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },
};

export const TIPOS_ARCHIVO = ['LOGO', 'FIRMA', 'SELLO'];
