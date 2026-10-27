import { supabase } from '../lib/supabaseClient';
import { AuthAPI } from './auth';
import { AsociadosAPI } from './asociados';
import { MedidoresAPI } from './medidores';
import { FacturasAPI } from './facturas';
import { TesoreriaAPI } from './tesoreria';
import { EncuestasAPI } from './encuestas';
import { PeriodosAPI } from './periodos';
import { NotificacionesAPI } from './notificaciones';
import { formatCOP } from '../utils/formatCOP';

// Gestión de datos importantes SUPABASE-ONLY (solo ADMIN).
// Los borrados usan las RPC de supabase/13_admin_delete_rpcs.sql
// (cascada real), previa verificación de contraseña del admin.
const RPC_ELIMINAR = {
  CUENTA: 'admin_eliminar_cuenta',
  ASOCIADO: 'admin_eliminar_asociado',
  FACTURA: 'admin_eliminar_factura',
  MULTA: 'admin_eliminar_multa',
  LECTURA: 'admin_eliminar_lectura',
  RECIBO: 'admin_eliminar_recibo',
  PAGO: 'admin_eliminar_pago',
  PERIODO_CONTABLE: 'admin_eliminar_periodo',
  ANIO_CONTABLE: 'admin_eliminar_anio',
  MEDIDOR: 'admin_eliminar_medidor',
  MOVIMIENTO: 'admin_eliminar_movimiento',
  NOTIFICACION: 'admin_eliminar_notificacion',
  FORMULARIO: 'admin_eliminar_formulario',
};

const TABLE_MAP = {
  ASOCIADO: 'asociados', CUENTA: 'profiles', MEDIDOR: 'medidores', FACTURA: 'facturas',
  RECIBO: 'recibos', PAGO: 'pagos', LECTURA: 'lecturas', MULTA: 'multas',
  FORMULARIO: 'encuestas', PERIODO_CONTABLE: 'meses_contables', ANIO_CONTABLE: 'anios_contables',
  MOVIMIENTO: 'movimientos_tesoreria', NOTIFICACION: 'notificaciones',
};

// Conteos de dependencias reales para el modal de confirmación.
async function contarCascada(tipo, id) {
  let cascade = {};
  if (tipo === 'ASOCIADO') {
    const [f, r, p, m, med, mov] = await Promise.all([
      supabase.from('facturas').select('id', { count: 'exact', head: true }).eq('asociado_id', id),
      supabase.from('recibos').select('id', { count: 'exact', head: true }).eq('asociado_id', id),
      supabase.from('pagos').select('id', { count: 'exact', head: true }).eq('asociado_id', id),
      supabase.from('multas').select('id', { count: 'exact', head: true }).eq('asociado_id', id),
      supabase.from('medidores').select('id', { count: 'exact', head: true }).eq('asociado_id', id),
      supabase.from('movimientos_tesoreria').select('id', { count: 'exact', head: true }).eq('asociado_id', id),
    ]);
    cascade = {
      facturas: f.count || 0, recibos: r.count || 0, pagos: p.count || 0,
      multas: m.count || 0, medidores: med.count || 0, movimientos: mov.count || 0,
    };
  } else if (tipo === 'FACTURA') {
    const [con, rec, pag, mul] = await Promise.all([
      supabase.from('conceptos_factura').select('id', { count: 'exact', head: true }).eq('factura_id', id),
      supabase.from('recibos').select('id', { count: 'exact', head: true }).eq('factura_id', id),
      supabase.from('pagos').select('id', { count: 'exact', head: true }).eq('factura_id', id),
      supabase.from('multas').select('id', { count: 'exact', head: true }).eq('factura_id', id),
    ]);
    cascade = { conceptos: con.count || 0, recibos: rec.count || 0, pagos: pag.count || 0, multas: mul.count || 0 };
  } else if (tipo === 'MULTA') {
    const [rec, pag] = await Promise.all([
      supabase.from('recibos').select('id', { count: 'exact', head: true }).eq('multa_id', id),
      supabase.from('pagos').select('id', { count: 'exact', head: true }).eq('multa_id', id),
    ]);
    cascade = { recibos: rec.count || 0, pagos: pag.count || 0 };
  } else if (tipo === 'PERIODO_CONTABLE') {
    const [f, l, mov] = await Promise.all([
      supabase.from('facturas').select('id', { count: 'exact', head: true }).eq('mes_contable_id', id),
      supabase.from('lecturas').select('id', { count: 'exact', head: true }).eq('mes_contable_id', id),
      supabase.from('movimientos_tesoreria').select('id', { count: 'exact', head: true }).eq('mes_contable_id', id),
    ]);
    cascade = { facturas: f.count || 0, lecturas: l.count || 0, movimientos: mov.count || 0 };
  }
  return cascade;
}

export const DatosImportantesAPI = {
  verificar: async (tipo, id) => {
    const table = TABLE_MAP[tipo];
    if (!table) throw new Error('Tipo no soportado.');
    const { data: row, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    const cascada = await contarCascada(tipo, id);
    let borrable = !!row;
    const motivosBloqueo = [];
    if (tipo === 'LECTURA' && row?.factura_generada) {
      borrable = false;
      motivosBloqueo.push('La lectura ya generó una factura. Anula la factura primero.');
    }
    return { existe: !!row, tipo, cascada, borrable, motivosBloqueo };
  },

  eliminar: async (tipo, id, password) => {
    const rpc = RPC_ELIMINAR[tipo];
    if (!rpc) throw new Error('Tipo no soportado para eliminación.');
    await AuthAPI.verificarPassword(password);
    const params = tipo === 'ANIO_CONTABLE' ? { p_anio_id: id } : { p_id: id };
    const { data, error } = await supabase.rpc(rpc, params);
    if (error) throw new Error(error.message);
    return data || { ok: true };
  },

  listarAsociados: () => AsociadosAPI.buscar(''),
  listarMedidores: () => MedidoresAPI.listar(),
  listarFacturas: () => FacturasAPI.listarTodas(),
  listarMultas: () => TesoreriaAPI.listarMultas(),
  listarFormularios: () => EncuestasAPI.listarAdmin(),
  listarAnios: () => PeriodosAPI.listarAnios(),
  listarMeses: (anioId) => PeriodosAPI.listarMeses(anioId),
  listarMovimientos: () => TesoreriaAPI.listarTodosMovimientos(),
  listarNotificaciones: () => NotificacionesAPI.publicas().then((r) => r.content || []),
  listarUsuarios: () => AuthAPI.listarUsuarios(),
  listarLecturas: async () => {
    const { data, error } = await supabase.from('lecturas').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data;
  },

  reiniciarNumeracion: async (tipo, password) => {
    const col = { FACTURA: 'siguiente_numero_factura', RECIBO: 'siguiente_numero_recibo', NOTA_CREDITO: 'siguiente_numero_nota_credito', FORMULARIO: 'siguiente_numero_formulario' }[tipo];
    if (!col) throw new Error('Tipo no soportado para reinicio.');
    await AuthAPI.verificarPassword(password);
    const { error } = await supabase.from('configuracion').update({ [col]: 1 }).eq('id', 1);
    if (error) throw new Error(error.message);
    return true;
  },
};

export const TIPOS_DATO_CONFIG = {
  ASOCIADO: { label: 'Asociado', listFn: 'listarAsociados', searchFields: ['nombres', 'apellidos', 'documento', 'telefonoPrincipal'],
    displayFields: (item) => ({ principal: `${item.nombres || ''} ${item.apellidos || ''}`.trim(), secundario: `${item.tipoDocumento}: ${item.documento}`, extra: item.telefonoPrincipal || '' }) },
  CUENTA: { label: 'Cuenta de usuario', listFn: 'listarUsuarios', searchFields: ['username', 'contacto'],
    displayFields: (item) => ({ principal: item.username, secundario: item.contacto || '—', extra: item.rol }), requiresPassword: false },
  MEDIDOR: { label: 'Medidor', listFn: 'listarMedidores', searchFields: ['numero'],
    displayFields: (item) => ({ principal: item.numero, secundario: item.estado || '', extra: '' }) },
  FACTURA: { label: 'Factura', listFn: 'listarFacturas', searchFields: ['numeroFactura'],
    displayFields: (item) => ({ principal: item.numeroFactura, secundario: `${formatCOP(item.total)}`, extra: item.estado || '' }) },
  RECIBO: { label: 'Recibo', listFn: null, searchFields: [], displayFields: () => ({ principal: 'Sin listado global', secundario: '', extra: '' }) },
  PAGO: { label: 'Pago', listFn: null, searchFields: [], displayFields: () => ({ principal: 'Sin listado global', secundario: '', extra: '' }) },
  LECTURA: { label: 'Lectura', listFn: 'listarLecturas', searchFields: [], displayFields: (item) => ({ principal: `Lectura ${item.lectura_actual}`, secundario: `Consumo: ${item.consumo_m3 || 0} m3`, extra: '' }) },
  MULTA: { label: 'Multa', listFn: 'listarMultas', searchFields: ['motivo'],
    displayFields: (item) => ({ principal: item.motivo, secundario: `${formatCOP(item.valor)}`, extra: item.estado || '' }) },
  FORMULARIO: { label: 'Formulario', listFn: 'listarFormularios', searchFields: ['titulo'],
    displayFields: (item) => ({ principal: item.titulo, secundario: item.descripcion || '', extra: item.estado || '' }) },
  PERIODO_CONTABLE: { label: 'Período contable (mes)', listFn: null, searchFields: [], displayFields: () => ({ principal: 'Selecciona un año primero', secundario: '', extra: '' }) },
  ANIO_CONTABLE: { label: 'Año contable', listFn: 'listarAnios', searchFields: ['anio'],
    displayFields: (item) => ({ principal: `${item.anio}`, secundario: item.estado || '', extra: '' }) },
  MOVIMIENTO: { label: 'Movimiento de tesorería', listFn: 'listarMovimientos', searchFields: ['concepto'],
    displayFields: (item) => ({ principal: item.concepto, secundario: `${formatCOP(item.valor)}`, extra: item.tipo || '' }) },
  NOTIFICACION: { label: 'Notificación', listFn: 'listarNotificaciones', searchFields: ['titulo'],
    displayFields: (item) => ({ principal: item.titulo, secundario: item.mensaje || '', extra: '' }) },
};

export const TIPOS_DATO = Object.entries(TIPOS_DATO_CONFIG).map(([value, config]) => ({ value, label: config.label }));
