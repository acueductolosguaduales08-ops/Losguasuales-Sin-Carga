import { supabase } from '../lib/supabaseClient';
import { cargarMultaHtml, abrirDocumentoHtml } from '../utils/documentos';

// Módulo 08 — Tesorería SUPABASE-ONLY.
const SELECT_ASOCIADO = 'asociado:asociados(id, codigo_interno, tipo_documento, documento, nombres, apellidos)';

export function multaToCamel(m) {
  if (!m) return null;
  return {
    id: m.id,
    asociadoId: m.asociado_id,
    facturaId: m.factura_id,
    facturaNumero: m.facturas?.numero_factura || null,
    motivo: m.motivo,
    valor: Number(m.valor ?? 0),
    fecha: m.fecha,
    estado: m.estado,
    independiente: m.independiente,
    numero: `MULTA-${String(m.id).replace(/-/g, '').slice(0, 6).toUpperCase()}`,
    asociado: m.asociado
      ? {
        id: m.asociado.id,
        codigoInterno: m.asociado.codigo_interno,
        tipoDocumento: m.asociado.tipo_documento,
        documento: m.asociado.documento,
        nombres: m.asociado.nombres,
        apellidos: m.asociado.apellidos,
        nombreCompleto: `${m.asociado.nombres ?? ''} ${m.asociado.apellidos ?? ''}`.trim(),
      }
      : undefined,
  };
}

function movimientoToCamel(m) {
  if (!m) return null;
  return {
    id: m.id,
    numero: m.numero,
    tipo: m.tipo,
    fecha: m.fecha,
    valor: Number(m.valor ?? 0),
    metodoPago: m.metodo_pago,
    concepto: m.concepto,
    categoria: m.categoria,
    asociadoId: m.asociado_id,
    facturaId: m.factura_id,
    reciboId: m.recibo_id,
    mesContableId: m.mes_contable_id,
    comprobanteUrl: m.comprobante_url,
    anulado: m.anulado,
    motivoAnulacion: m.motivo_anulacion,
    fechaCreacion: m.created_at,
    reciboNumero: m.recibo?.numero_recibo || null,
    facturaNumero: m.factura?.numero_factura || null,
    usuario: m.usuario?.username || '',
    asociadoNombre: m.asociado ? `${m.asociado.nombres ?? ''} ${m.asociado.apellidos ?? ''}`.trim() : null,
  };
}

export { movimientoToCamel };

async function metodoNombre(metodoPagoId, metodoPago) {
  if (metodoPago) return metodoPago;
  if (!metodoPagoId) return 'EFECTIVO';
  const { data } = await supabase.from('metodos_pago').select('nombre').eq('id', metodoPagoId).single();
  return data?.nombre || 'EFECTIVO';
}

export const TesoreriaAPI = {
  registrarPago: async (payload) => {
    const fid = payload.facturaId || payload.factura_id;
    const metodo = await metodoNombre(payload.metodoPagoId, payload.metodoPago);
    const { data: reciboId, error } = await supabase.rpc('registrar_pago_factura', {
      p_factura_id: fid,
      p_valor: Number(payload.valor),
      p_metodo: metodo,
    });
    if (error) throw new Error(error.message);
    const { data: rec } = await supabase.from('recibos').select('numero_recibo, valor').eq('id', reciboId).single();
    return { numeroRecibo: rec?.numero_recibo || reciboId, valor: rec ? Number(rec.valor) : Number(payload.valor) };
  },

  registrarMulta: async (payload) => {
    const independiente = payload.independiente ?? (payload.facturaId || payload.factura_id ? false : true);
    const body = {
      asociado_id: payload.asociadoId || payload.asociado_id,
      factura_id: independiente ? null : (payload.facturaId || payload.factura_id || null),
      motivo: payload.motivo,
      valor: Number(payload.valor),
      independiente: !!independiente,
    };
    if (!body.asociado_id || !body.motivo || !body.valor) throw new Error('Faltan campos de la multa.');
    const { data, error } = await supabase.from('multas').insert(body).select().single();
    if (error) throw new Error(error.message);
    return multaToCamel(data);
  },

  listarMultas: async () => {
    const { data, error } = await supabase.from('multas').select(`*, ${SELECT_ASOCIADO}, facturas(numero_factura)`).order('fecha', { ascending: false }).limit(1000);
    if (error) throw new Error(error.message);
    return (data || []).map(multaToCamel);
  },

  estadisticasMultas: async () => {
    const { data, error } = await supabase.from('multas').select('estado, valor');
    if (error) throw new Error(error.message);
    const agg = { total: 0, pendientes: 0, pagadas: 0, anuladas: 0, valorPendiente: 0 };
    for (const m of data || []) {
      agg.total++;
      if (m.estado === 'PENDIENTE') { agg.pendientes++; agg.valorPendiente += Number(m.valor); }
      if (m.estado === 'PAGADA') agg.pagadas++;
      if (m.estado === 'ANULADA') agg.anuladas++;
    }
    return agg;
  },

  listarMultasAsociado: async (asociadoId) => {
    const { data, error } = await supabase.from('multas').select(`*, ${SELECT_ASOCIADO}, facturas(numero_factura)`).eq('asociado_id', asociadoId).order('fecha', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(multaToCamel);
  },

  pagarMulta: async (id, payload = {}) => {
    const metodo = await metodoNombre(payload.metodoPagoId, payload.metodoPago);
    const { data, error } = await supabase.rpc('pagar_multa', { p_multa_id: id, p_metodo: metodo });
    if (error) throw new Error(error.message);
    const { data: rec } = await supabase.from('recibos').select('numero_recibo, valor').eq('id', data).single();
    return { recibo: data, numeroRecibo: rec?.numero_recibo, valor: rec ? Number(rec.valor) : undefined };
  },

  editarValorMulta: async (id, payload) => {
    const valor = Number(payload.valor ?? payload);
    const { data: m } = await supabase.from('multas').select('estado, factura_id').eq('id', id).single();
    if (!m) throw new Error('Multa no encontrada.');
    if (m.estado !== 'PENDIENTE') throw new Error('Solo se puede editar si está PENDIENTE.');
    if (m.factura_id) throw new Error('Ya está incluida en factura, no editable.');
    const { error } = await supabase.from('multas').update({ valor }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  verMultaHtml: async (id) => {
    const html = await cargarMultaHtml(id);
    abrirDocumentoHtml(html);
    return html;
  },

  descargarMultaPdf: async (id) => {
    await cargarMultaHtml(id, { autoPrint: true });
    return { ok: true };
  },

  registrarIngreso: async (payload) => {
    const metodo = await metodoNombre(payload.metodoPagoId, payload.metodoPago);
    const { data: numero } = await supabase.rpc('reservar_numero', { p_tipo: 'ENTRADA' });
    const { data, error } = await supabase.from('movimientos_tesoreria').insert({
      numero, tipo: 'ENTRADA', valor: Number(payload.valor), metodo_pago: metodo,
      concepto: payload.concepto, categoria: payload.categoria || 'GENERAL',
      asociado_id: payload.asociadoId || null, mes_contable_id: payload.mesContableId || null,
      comprobante_url: payload.comprobanteUrl || null,
    }).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  registrarGasto: async (payload) => {
    const metodo = await metodoNombre(payload.metodoPagoId, payload.metodoPago);
    const { data: numero } = await supabase.rpc('reservar_numero', { p_tipo: 'SALIDA' });
    const { data, error } = await supabase.from('movimientos_tesoreria').insert({
      numero, tipo: 'SALIDA', valor: Number(payload.valor), metodo_pago: metodo,
      concepto: payload.concepto, categoria: payload.categoria || 'GENERAL',
      mes_contable_id: payload.mesContableId || null,
      comprobante_url: payload.comprobanteUrl || null,
    }).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  anularMovimiento: async (id, motivo) => {
    const { data: mov } = await supabase.from('movimientos_tesoreria').select('*').eq('id', id).single();
    if (!mov) throw new Error('Movimiento no encontrado.');
    if (mov.concepto?.startsWith('PAGO_FACTURA') && mov.factura_id) {
      // Reversa: anula pago+recibo y recalcula factura
      await supabase.from('pagos').update({ anulado: true }).eq('factura_id', mov.factura_id).eq('anulado', false);
      await supabase.from('recibos').update({ estado: 'ANULADO' }).eq('id', mov.recibo_id);
      const { data: pagos } = await supabase.from('pagos').select('valor').eq('factura_id', mov.factura_id).eq('anulado', false);
      const pagado = (pagos || []).reduce((s, p) => s + Number(p.valor), 0);
      const { data: fac } = await supabase.from('facturas').select('total, fecha_limite_pago').eq('id', mov.factura_id).single();
      let estado = 'PENDIENTE';
      if (pagado >= Number(fac.total)) estado = 'PAGADA';
      else if (pagado > 0) estado = 'PAGADA_PARCIAL';
      else if (fac.fecha_limite_pago < new Date().toISOString().slice(0, 10)) estado = 'VENCIDA';
      await supabase.from('facturas').update({ total_pagado: pagado, estado }).eq('id', mov.factura_id);
    }
    const { error } = await supabase.from('movimientos_tesoreria').update({ anulado: true, motivo_anulacion: motivo }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  listarMovimientos: async (tipo) => {
    let q = supabase.from('movimientos_tesoreria').select(`*, recibo:recibos(numero_recibo), factura:facturas(numero_factura), asociado:asociados(nombres, apellidos), usuario:profiles(username)`).eq('anulado', false).order('created_at', { ascending: false }).limit(1000);
    if (tipo) q = q.eq('tipo', tipo);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []).map(movimientoToCamel);
  },

  listarTodosMovimientos: async () => TesoreriaAPI.listarMovimientos(),

  // Movimientos de UN mes contable para el detalle de período. A
  // diferencia de listarMovimientos, incluye los anulados (la
  // trazabilidad del período pide ver el historial completo con su
  // estado), y va en orden cronológico ascendente.
  listarMovimientosPorMes: async (mesId) => {
    const { data, error } = await supabase
      .from('movimientos_tesoreria')
      .select(`*, recibo:recibos(numero_recibo), factura:facturas(numero_factura), asociado:asociados(nombres, apellidos), usuario:profiles(username)`)
      .eq('mes_contable_id', mesId)
      .order('fecha', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(movimientoToCamel);
  },

  // Movimientos de UN asociado (historial de caja del perfil). Incluye
  // anulados para trazabilidad completa, en orden cronológico inverso.
  listarMovimientosPorAsociado: async (asociadoId) => {
    const { data, error } = await supabase
      .from('movimientos_tesoreria')
      .select(`*, recibo:recibos(numero_recibo), factura:facturas(numero_factura), asociado:asociados(nombres, apellidos), usuario:profiles(username)`)
      .eq('asociado_id', asociadoId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(movimientoToCamel);
  },

  cajaDiaria: async () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from('movimientos_tesoreria').select('tipo, valor').eq('fecha', hoy).eq('anulado', false);
    const ingresos = (data || []).filter((m) => m.tipo === 'ENTRADA').reduce((s, m) => s + Number(m.valor), 0);
    const gastos = (data || []).filter((m) => m.tipo === 'SALIDA').reduce((s, m) => s + Number(m.valor), 0);
    return { totalIngresos: ingresos, totalGastos: gastos, balance: ingresos - gastos, numeroMovimientos: (data || []).length };
  },
};

export const TIPOS_MOVIMIENTO = ['ENTRADA', 'SALIDA'];
export const ESTADOS_MULTA = ['PENDIENTE', 'PAGADA', 'ANULADA'];
