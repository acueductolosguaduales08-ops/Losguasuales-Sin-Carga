import { supabase } from '../lib/supabaseClient';
import { PublicacionesAPI } from './publicaciones';
import { NotificacionesAPI } from './notificaciones';
import { EncuestasAPI } from './encuestas';
import { renderDocumentoPublicoDesdeRPC, abrirDocumentoHtml } from '../utils/documentos';

// Home público SUPABASE-ONLY (sin sesión).
export const HomeAPI = {
  publicacionesDestacadas: () => PublicacionesAPI.destacadas(),
  publicacionesPublicas: ({ page = 0, size = 12 } = {}) => PublicacionesAPI.listarPublicas({ page, size }),
  categorias: () => PublicacionesAPI.categorias(),
  etiquetas: () => PublicacionesAPI.etiquetas(),
  videosPublicos: () => PublicacionesAPI.videosPublicos(),
  reacciones: (publicacionId) => PublicacionesAPI.reacciones(publicacionId),
  reaccionar: (publicacionId) => PublicacionesAPI.reaccionar(publicacionId),
  quitarReaccion: (publicacionId) => PublicacionesAPI.quitarReaccion(publicacionId),
  notificacionesPublicas: () => NotificacionesAPI.publicas(),
  encuestasPublicas: () => EncuestasAPI.listarPublicas(),

  estadoServicio: async (documento) => {
    const { data, error } = await supabase.rpc('consulta_estado_servicio', { p_documento: documento });
    if (error || !data) throw new Error('Documento no encontrado.');
    return data;
  },
  consultarFactura: async (numeroFactura) => {
    const d = await facturaPublicaDatos(numeroFactura);
    return {
      ...d,
      numeroFactura: d.numero_factura,
      asociadoId: d.asociado?.id || d.asociado_id,
      saldoPendiente: Number(d.total ?? 0) - Number(d.total_pagado ?? 0),
      fechaEmision: d.fecha_emision,
      fechaLimitePago: d.fecha_limite_pago,
    };
  },
  consultarRecibo: async (numeroRecibo) => {
    const { data, error } = await supabase.rpc('recibo_publico', { p_numero: numeroRecibo });
    if (error || !data) throw new Error('Recibo no encontrado.');
    return {
      ...data,
      numeroRecibo: data.numero_recibo,
      asociadoId: data.asociado_id,
      saldoPendiente: data.saldo_pendiente,
    };
  },
  descargarFacturaPdf: async (numeroFactura) => {
    const d = await facturaPublicaDatos(numeroFactura);
    const html = await renderDocumentoPublicoDesdeRPC({ tipo: 'FACTURA', contenido: d });
    abrirDocumentoHtml(html, { autoPrint: true });
    return { ok: true };
  },
  descargarReciboPdf: async (numeroRecibo) => {
    const { data, error } = await supabase.rpc('recibo_publico', { p_numero: numeroRecibo });
    if (error || !data) throw new Error('Recibo no encontrado.');
    const html = await renderDocumentoPublicoDesdeRPC({ tipo: 'RECIBO', contenido: data });
    abrirDocumentoHtml(html, { autoPrint: true });
    return { ok: true };
  },
};

async function facturaPublicaDatos(numeroFactura) {
  const { data, error } = await supabase.rpc('factura_publica', { p_numero: numeroFactura });
  if (error || !data) throw new Error('Factura no encontrada.');
  return typeof data === 'string' ? JSON.parse(data) : data;
}
