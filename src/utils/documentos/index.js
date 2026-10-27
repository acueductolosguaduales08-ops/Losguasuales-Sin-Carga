// Punto de entrada del módulo de documentos (planillas originales).
// Uso tipico:
//   const html = await Documentos.cargarFacturaHtml(id);
//   await Documentos.imprimirFactura(id);   // abre pestaña + print (Guardar como PDF)
//   await Documentos.imprimirLoteFacturas(ids); // un solo documento con hoja por factura
import { supabase } from '../../lib/supabaseClient';
import {
  abrirDocumentoHtml,
  obtenerInstitucional,
  fmtMoneda, fmtFecha, fmtFechaHora, esc, numeroMulta, hashDoc6, nombreMes, decimal1,
} from './comun';
import {
  renderFacturaHtml, renderReciboHtml, renderMultaHtml, ondasPara,
} from './plantillas';
import {
  renderInformePeriodoHtml, renderInformeAnualHtml,
  renderInformeAsociadoHtml, renderListadoAsociadosHtml,
} from './informesDocs';
import {
  cargarFacturaHtml, cargarReciboHtml, cargarReciboHtmlPorNumero, cargarMultaHtml,
  renderFacturaDesdeFila, renderReciboDesdeFila, renderMultaDesdeFila,
  renderDocumentoPublicoDesdeRPC,
  cargarInformePeriodoHtml, cargarInformeAnualHtml,
  cargarInformeAsociadoHtml, cargarListadoAsociadosHtml,
} from './cargar';

export const imprimirFactura = (id) => cargarFacturaHtml(id, { autoPrint: true });
export const imprimirRecibo = (id) => cargarReciboHtml(id, { autoPrint: true });
export const imprimirMulta = (id) => cargarMultaHtml(id, { autoPrint: true });

// Extrae la porción de <body> de un documento completo y el CSS compartido.
function partirDocumento(html) {
  const iStyle = html.indexOf('<style>');
  const fStyle = html.indexOf('</style>');
  const css = iStyle >= 0 && fStyle > iStyle ? html.slice(iStyle + '<style>'.length, fStyle) : '';
  const iBody = html.indexOf('<body>') + '<body>'.length;
  const fBody = html.lastIndexOf('</body>');
  const cuerpo = html.slice(iBody, fBody);
  return { css, cuerpo };
}

// Abre una única pestaña con N planillas, cada una seguida de salto de página.
export function abrirLoteDocumentosHtml(htmls, { autoPrint = true } = {}) {
  if (!htmls?.length) throw new Error('Lote vacío.');
  if (htmls.length === 1) {
    abrirDocumentoHtml(htmls[0], { autoPrint });
    return true;
  }
  const partes = htmls.map(partirDocumento);
  // El CSS es igual en todas las planillas del mismo tipo; el listado en
  // landscape no se mezcla (se llama por separado).
  const css = partes[0].css + `
    .doc-lote { page-break-after: always; break-after: page; }
    .doc-lote:last-child { page-break-after: auto; }
  `;
  const cuerpo = partes.map((p) => `<div class="doc-lote">${p.cuerpo}</div>`).join('');
  abrirDocumentoHtml(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Documentos (${htmls.length})</title>
<style>${css}</style>
</head>
<body>
${cuerpo}
</body>
</html>`, { autoPrint });
  return true;
}

// Imprime por lote todas las facturas del periodo (o la lista de ids dada).
export async function imprimirLoteFacturas(idsOrMes, { mesContableId } = {}) {
  let ids = idsOrMes;
  if (!Array.isArray(ids)) {
    if (!mesContableId) throw new Error('Se requiere mesContableId.');
    const { data, error } = await supabase
      .from('facturas')
      .select('id')
      .eq('mes_contable_id', mesContableId)
      .neq('estado', 'ANULADA');
    if (error) throw new Error(error.message);
    ids = (data || []).map((f) => f.id);
  }
  const htmls = [];
  for (const id of ids) {
    // Secuencial: reutiliza el cache institucional sin bloquear la UI.
    // eslint-disable-next-line no-await-in-loop
    htmls.push(await cargarFacturaHtml(id, { autoPrint: false }));
  }
  if (!htmls.length) throw new Error('No hay facturas para imprimir en ese periodo.');
  abrirLoteDocumentosHtml(htmls, { autoPrint: true });
  return htmls.length;
}

export const Documentos = {
  // plantillas
  renderFacturaHtml, renderReciboHtml, renderMultaHtml, ondasPara,
  renderInformePeriodoHtml, renderInformeAnualHtml,
  renderInformeAsociadoHtml, renderListadoAsociadosHtml,
  // cargadores
  cargarFacturaHtml, cargarReciboHtml, cargarReciboHtmlPorNumero, cargarMultaHtml,
  cargarInformePeriodoHtml, cargarInformeAnualHtml,
  cargarInformeAsociadoHtml, cargarListadoAsociadosHtml,
  renderFacturaDesdeFila, renderReciboDesdeFila, renderMultaDesdeFila,
  renderDocumentoPublicoDesdeRPC,
  // helpers
  abrirDocumentoHtml, abrirLoteDocumentosHtml,
  imprimirFactura, imprimirRecibo, imprimirMulta, imprimirLoteFacturas,
  obtenerInstitucional,
  fmtMoneda, fmtFecha, fmtFechaHora, esc, numeroMulta, hashDoc6, nombreMes, decimal1,
};

export {
  cargarFacturaHtml,
  cargarReciboHtml,
  cargarReciboHtmlPorNumero,
  cargarMultaHtml,
  cargarInformePeriodoHtml,
  cargarInformeAnualHtml,
  cargarInformeAsociadoHtml,
  cargarListadoAsociadosHtml,
  abrirDocumentoHtml,
};
export {
  renderFacturaDesdeFila, renderReciboDesdeFila, renderMultaDesdeFila,
  renderDocumentoPublicoDesdeRPC,
  renderFacturaHtml, renderReciboHtml, renderMultaHtml, ondasPara,
  renderInformePeriodoHtml, renderInformeAnualHtml,
  renderInformeAsociadoHtml, renderListadoAsociadosHtml,
};
export default Documentos;
