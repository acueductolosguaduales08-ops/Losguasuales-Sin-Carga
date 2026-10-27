import { supabase } from '../lib/supabaseClient';
import { cargarFacturaHtml, abrirDocumentoHtml } from '../utils/documentos';

// Módulo 07 — Facturación SUPABASE-ONLY.
const SELECT_ASOCIADO = 'asociado:asociados(id, codigo_interno, tipo_documento, documento, nombres, apellidos, direccion)';

function rowToCamel(f) {
  if (!f) return null;
  return {
    id: f.id,
    numeroFactura: f.numero_factura,
    numero: f.numero_factura,
    asociadoId: f.asociado_id,
    lecturaId: f.lectura_id,
    mesContableId: f.mes_contable_id,
    fechaEmision: f.fecha_emision,
    fechaLimitePago: f.fecha_limite_pago,
    lecturaAnterior: f.lectura_anterior,
    lecturaActual: f.lectura_actual,
    consumoM3: f.consumo_m3,
    valorM3: Number(f.valor_m3 ?? 0),
    valorConsumo: Number(f.valor_consumo ?? 0),
    cargoAdministracion: Number(f.cargo_administracion ?? 0),
    valoresAdicionales: Number(f.valores_adicionales ?? 0),
    totalMultas: Number(f.total_multas ?? 0),
    total: Number(f.total ?? 0),
    totalPagado: Number(f.total_pagado ?? 0),
    saldoPendiente: Number(f.total ?? 0) - Number(f.total_pagado ?? 0),
    estado: f.estado,
    codigoQr: f.codigo_qr,
    motivoAnulacion: f.motivo_anulacion,
    // Denormalizado para tablas/modales:
    asociado: f.asociado
      ? {
        id: f.asociado.id,
        codigoInterno: f.asociado.codigo_interno,
        tipoDocumento: f.asociado.tipo_documento,
        documento: f.asociado.documento,
        nombres: f.asociado.nombres,
        apellidos: f.asociado.apellidos,
        nombreCompleto: `${f.asociado.nombres ?? ''} ${f.asociado.apellidos ?? ''}`.trim(),
      }
      : undefined,
  };
}

export const FacturasAPI = {
  generarMes: async (mesContableId) => {
    const mesId = typeof mesContableId === 'object' ? mesContableId.mesContableId || mesContableId.mesId : mesContableId;
    const { data: count, error } = await supabase.rpc('generar_facturas_mes', { p_mes_id: mesId });
    if (error) throw new Error(error.message);
    const { data } = await supabase.from('facturas').select(`*, ${SELECT_ASOCIADO}`).eq('mes_contable_id', mesId).order('numero_factura');
    return { generadas: count, facturas: (data || []).map(rowToCamel) };
  },

  // Genera la factura de UNA lectura (requiere 14_factura_por_lectura.sql).
  // Devuelve { creada, motivo?, id?, numero?, total?, fechaLimitePago? }.
  generarDeLectura: async (lecturaId) => {
    const { data, error } = await supabase.rpc('generar_factura_lectura', { p_lectura_id: lecturaId });
    if (error) throw new Error(error.message);
    return {
      creada: !!data?.creada,
      motivo: data?.motivo || null,
      id: data?.id || null,
      numero: data?.numero || null,
      total: Number(data?.total ?? 0),
      fechaLimitePago: data?.fecha_limite_pago || null,
    };
  },

  agregarConcepto: async (payload) => {
    const fid = payload.facturaId || payload.factura_id;
    const { error } = await supabase.rpc('agregar_concepto', { p_factura_id: fid, p_desc: payload.descripcion, p_valor: Number(payload.valor) });
    if (error) throw new Error(error.message);
    return true;
  },

  anular: async (id, motivo) => {
    const { error } = await supabase.rpc('anular_factura', { p_factura_id: id, p_motivo: motivo || 'Anulada' });
    if (error) throw new Error(error.message);
    return true;
  },

  obtener: async (id) => {
    const { data, error } = await supabase.from('facturas').select(`*, conceptos_factura(*), ${SELECT_ASOCIADO}`).eq('id', id).single();
    if (error) throw new Error('Factura no encontrada.');
    return { ...rowToCamel(data), conceptos: data.conceptos_factura || [] };
  },

  listarPorAsociado: async (asociadoId) => {
    const { data, error } = await supabase.from('facturas').select(`*, ${SELECT_ASOCIADO}`).eq('asociado_id', asociadoId).order('fecha_emision', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToCamel);
  },

  listarPorEstado: async (estado) => {
    const { data, error } = await supabase.from('facturas').select(`*, ${SELECT_ASOCIADO}`).eq('estado', estado).order('fecha_emision', { ascending: false }).limit(1000);
    if (error) throw new Error(error.message);
    return (data || []).map(rowToCamel);
  },

  listarTodas: async () => {
    const { data, error } = await supabase.from('facturas').select(`*, ${SELECT_ASOCIADO}`).order('fecha_emision', { ascending: false }).limit(1000);
    if (error) throw new Error(error.message);
    return (data || []).map(rowToCamel);
  },

  // Cobro rápido del tesorero: busca por número de factura con
  // coincidencia parcial ("0012" encuentra FAC-2026-0012).
  buscarPorNumero: async (numero) => {
    const q = String(numero || '').trim().replace(/[^A-Za-z0-9-]/g, '');
    if (!q) return [];
    const { data, error } = await supabase
      .from('facturas')
      .select(`*, ${SELECT_ASOCIADO}`)
      .ilike('numero_factura', `%${q}%`)
      .order('fecha_emision', { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return (data || []).map(rowToCamel);
  },

  listarPorMes: async (mesContableId) => {
    const { data, error } = await supabase.from('facturas').select(`*, ${SELECT_ASOCIADO}`).eq('mes_contable_id', mesContableId);
    if (error) throw new Error(error.message);
    return (data || [])
      .map(rowToCamel)
      .sort((a, b) => String(a.asociado?.apellidos || '').localeCompare(String(b.asociado?.apellidos || ''), 'es'));
  },

  html: async (id) => {
    const html = await cargarFacturaHtml(id);
    abrirDocumentoHtml(html);
    return html;
  },

  descargarPdf: async (id) => {
    await cargarFacturaHtml(id, { autoPrint: true });
    return { ok: true };
  },

  // Compatibilidad con los modales que guardaban PDF en caché:
  htmlSinAbrir: (id) => cargarFacturaHtml(id),

  consultarPorQr: async (numeroFactura) => {
    const { data, error } = await supabase.rpc('factura_publica', { p_numero: numeroFactura });
    if (error || !data) throw new Error('Factura no encontrada.');
    const d = typeof data === 'string' ? JSON.parse(data) : data;
    return { ...rowToCamel(d), asociado: d.asociado || undefined };
  },

  generarEnlacePublico: async (id) => {
    const { data, error } = await supabase.rpc('crear_enlace_publico', { p_tipo: 'FACTURA', p_doc_id: id });
    if (error) throw new Error(error.message);
    return { token: data, url: `${window.location.origin}/factura/${data}` };
  },
};

export const ESTADOS_FACTURA = ['PENDIENTE', 'PAGADA_PARCIAL', 'PAGADA', 'VENCIDA', 'ANULADA'];
