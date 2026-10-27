import { supabase } from '../lib/supabaseClient';
import { cargarReciboHtml, cargarReciboHtmlPorNumero } from '../utils/documentos';

// Módulo 09 — Recibos SUPABASE-ONLY.
// Los recibos SIEMPRE traen el pago (método/tesorero), la factura relacionada y
// el asociado — así ReciboCard distingue multa independiente de pago de factura.
const SELECT_RECIBO = `*,
  pago:pagos(metodo_pago, tesorero:profiles(username)),
  factura:facturas(numero_factura),
  asociado:asociados(id, codigo_interno, tipo_documento, documento, nombres, apellidos)`;

function rowToCamel(r) {
  if (!r) return null;
  const esMulta = !!r.multa_id && !r.factura_id;
  return {
    id: r.id,
    numeroRecibo: r.numero_recibo,
    numero: r.numero_recibo,
    pagoId: r.pago_id,
    facturaId: r.factura_id,
    multaId: r.multa_id,
    asociadoId: r.asociado_id,
    valor: Number(r.valor ?? 0),
    saldoPendiente: Number(r.saldo_pendiente ?? 0),
    estado: r.estado,
    codigoQr: r.codigo_qr,
    fecha: r.created_at,
    esMulta,
    facturaNumero: r.factura?.numero_factura || null,
    numeroFactura: r.factura?.numero_factura || null,
    fechaEmision: r.created_at,
    asociadoNombre: r.asociado ? `${r.asociado.nombres ?? ''} ${r.asociado.apellidos ?? ''}`.trim() : null,
    metodoPago: r.pago?.metodo_pago || 'N/A',
    tesorero: r.pago?.tesorero?.username || '',
    asociado: r.asociado
      ? {
        id: r.asociado.id,
        codigoInterno: r.asociado.codigo_interno,
        documento: r.asociado.documento,
        tipoDocumento: r.asociado.tipo_documento,
        nombres: r.asociado.nombres,
        apellidos: r.asociado.apellidos,
        nombreCompleto: `${r.asociado.nombres ?? ''} ${r.asociado.apellidos ?? ''}`.trim(),
      }
      : undefined,
  };
}

export const RecibosAPI = {
  listarTodos: async () => {
    const { data, error } = await supabase.from('recibos').select(SELECT_RECIBO).order('created_at', { ascending: false }).limit(1000);
    if (error) throw new Error(error.message);
    return (data || []).map(rowToCamel);
  },

  listarPorAsociado: async (asociadoId) => {
    const { data, error } = await supabase.from('recibos').select(SELECT_RECIBO).eq('asociado_id', asociadoId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToCamel);
  },

  obtener: async (id) => {
    const { data, error } = await supabase.from('recibos').select(SELECT_RECIBO).eq('id', id).single();
    if (error) throw new Error('Recibo no encontrado.');
    return rowToCamel(data);
  },

  buscarPorNumero: async (numero) => {
    const { data, error } = await supabase.from('recibos').select(SELECT_RECIBO).eq('numero_recibo', numero).single();
    if (error) throw new Error('Recibo no encontrado.');
    return rowToCamel(data);
  },

  buscarPorMulta: async (multaId) => {
    const { data, error } = await supabase.from('recibos').select(SELECT_RECIBO).eq('multa_id', multaId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error || !data) throw new Error('Recibo no encontrado.');
    return rowToCamel(data);
  },

  html: async (numeroRecibo) => {
    const html = await cargarReciboHtmlPorNumero(numeroRecibo);
    return html;
  },

  abrirPdf: async (numeroRecibo) => {
    await cargarReciboHtmlPorNumero(numeroRecibo, { autoPrint: true });
    return { ok: true };
  },

  htmlSinAbrir: async (numeroRecibo) => cargarReciboHtmlPorNumero(numeroRecibo),

  // compatibilidad con quien usaba el id:
  abrirPdfPorId: async (id) => {
    await cargarReciboHtml(id, { autoPrint: true });
    return { ok: true };
  },

  generarEnlacePublico: async (numeroRecibo) => {
    const { data: rec, error: e1 } = await supabase.from('recibos').select('id').eq('numero_recibo', numeroRecibo).single();
    if (e1 || !rec) throw new Error('Recibo no encontrado.');
    const { data, error } = await supabase.rpc('crear_enlace_publico', { p_tipo: 'RECIBO', p_doc_id: rec.id });
    if (error) throw new Error(error.message);
    return { token: data, url: `${window.location.origin}/recibo/${data}` };
  },
};

export const ESTADOS_RECIBO = ['EMITIDO', 'ANULADO'];
