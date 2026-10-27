// Informes PDF portados de templates/informe-periodo.html, informe-asociado.html
// e informe-listado-asociados.html (backend Java/Thymeleaf).
import { esc, fmtMoneda, fmtFechaHora, decimal1 } from './comun';
import { ONDA_INFORME } from './ondas';

const ONDA_INFORME_SRC = `data:image/png;base64,${ONDA_INFORME}`;

const CSS_INFORME = `
* { box-sizing: border-box; }
@page { size: A4; margin: 0; }
body { margin: 0; padding: 0; background: #e9edf2; font-family: Arial, Helvetica, sans-serif; color: #222; }
.factura {
  position: relative; width: 210mm; min-height: 297mm; overflow: hidden;
  margin: 20px auto; background: #ffffff; box-shadow: 0 5px 25px rgba(0,0,0,0.15);
}
.onda-superior { position: absolute; top: 0; left: 0; width: 210mm; height: 82mm; z-index: 0; }
.onda-superior img { display: block; width: 210mm; height: 82mm; }
.contenido { position: relative; z-index: 2; width: 166mm; margin: 0 auto; padding-top: 18mm; padding-bottom: 30mm; }
table.encabezado { width: 166mm; border-collapse: collapse; margin-top: 4mm; }
table.encabezado td { vertical-align: middle; }
td.logo-celda { width: 27mm; padding-right: 4mm; }
td.logo-celda img { max-width: 24mm; max-height: 24mm; }
.encabezado h1 { margin: 0 0 1.5mm 0; color: #1266b3; font-size: 18px; font-weight: 700; }
.encabezado p { margin: 0.8mm 0; font-size: 12px; line-height: 1.2; }
.linea-azul { width: 100%; height: 1.2mm; background: #176abd; margin-top: 1mm; }
.titulo-informe { text-align: center; margin-top: 2.5mm; }
.titulo-informe h2 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
.titulo-informe .periodo { margin-top: 0.5mm; color: #1266b3; font-size: 22px; font-weight: 700; }
.titulo-informe .fecha-generacion { margin-top: 0.5mm; font-size: 10px; color: #777; }
.seccion { margin-top: 2mm; page-break-inside: avoid; }
.seccion-titulo { width: 100%; padding: 1.5mm 3mm; background: #dff0fc; font-size: 12px; font-weight: 700; color: #1266b3; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.indicadores { display: table; width: 100%; margin-top: 2mm; border-spacing: 2mm 0; }
.indicador { display: table-cell; width: 25%; text-align: center; background-color: #fafafa; border: 1px solid #eee; padding: 2.5mm 1mm; }
.indicador .valor { font-size: 15px; font-weight: 700; color: #1266b3; }
.indicador .etiqueta { font-size: 9px; color: #777; text-transform: uppercase; margin-top: 1mm; }
.indicador.ok .valor { color: #2e7d32; }
.indicador.alerta .valor { color: #c62828; }
.indicador.w20 { width: 20%; }
.datos-tabla { margin-top: 1.5mm; }
.datos-tabla td { border: 1px solid #d5d5d5; padding: 1.2mm 2mm; font-size: 12px; }
.datos-tabla td.etiqueta { font-weight: 700; background-color: #fafafa; width: 30%; }
.detalle { margin-top: 1.5mm; }
.detalle th { background-color: #176abd; color: #ffffff; padding: 1.8mm 2mm; text-align: left; font-size: 11px; }
.detalle td { padding: 1.5mm 2mm; border-bottom: 1px solid #eee; font-size: 11px; }
.detalle tr:nth-child(even) { background-color: #fafafa; }
.detalle td.der { text-align: right; white-space: nowrap; }
.estado-badge { display: inline-block; padding: 0.6mm 2.5mm; border-radius: 1mm; color: #ffffff; font-weight: 700; font-size: 9px; }
.estado-PENDIENTE { background-color: #f6a623; }
.estado-PAGADA { background-color: #2e7d32; }
.estado-PAGADA_PARCIAL { background-color: #ef6c00; }
.estado-VENCIDA { background-color: #c62828; }
.estado-ANULADA, .estado-ANULADO { background-color: #757575; }
.estado-EMITIDO { background-color: #2e7d32; }
.estado-ACTIVO { background-color: #2e7d32; }
.estado-SUSPENDIDO { background-color: #f6a623; }
.estado-INACTIVO { background-color: #757575; }
.estado-PAGADA_MULTA { background-color: #2e7d32; }
.tipo-ENTRADA { color: #2e7d32; font-weight: 700; }
.tipo-SALIDA { color: #c62828; font-weight: 700; }
table.firmas { width: 100%; border-collapse: collapse; margin-top: 4mm; page-break-inside: avoid; }
table.firmas td { width: 50%; text-align: center; vertical-align: top; }
.firma-linea { width: 52mm; border-top: 1px solid #222; margin: 0 auto 1.5mm auto; }
table.firmas img { max-width: 37mm; max-height: 15mm; }
table.firmas span { font-size: 13px; }
.pie { margin-top: 2mm; text-align: center; color: #777; font-size: 10px; line-height: 1.6; }
.pie p { margin: 0.8mm 0; }
@media print {
  body { background: white; }
  .factura { margin: 0; box-shadow: none; width: 210mm; min-height: 297mm; }
  .onda-superior { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
@media screen and (max-width: 800px) {
  .factura { width: 100%; min-height: auto; margin: 0; box-shadow: none; }
  .onda-superior, .onda-superior img { width: 100%; height: 110px; }
  .contenido { width: calc(100% - 28px); padding-top: 70px; padding-bottom: 24px; }
  table.encabezado { width: calc(100%); }
  .indicadores { display: block; border-spacing: 0; }
  .indicador { display: block; width: 100%; margin-top: 3px; }
  .datos-tabla td, .detalle td { font-size: 11px; }
}
@media print and (max-width: 800px) { .contenido { padding-top: 30px; } }
`;

const CSS_LISTADO = `
* { box-sizing: border-box; }
@page { size: A4 landscape; margin: 0; }
body { margin: 0; padding: 0; background: #e9edf2; font-family: Arial, Helvetica, sans-serif; color: #222; }
.factura { position: relative; width: 297mm; min-height: 210mm; margin: 20px auto; background: #ffffff; }
.onda-superior { position: absolute; top: 0; left: 0; width: 297mm; height: 40mm; z-index: 0; opacity: 0.12; }
.onda-superior img { display: block; width: 297mm; height: 40mm; }
.contenido { position: relative; z-index: 2; width: 253mm; margin: 0 auto; padding-top: 10mm; padding-bottom: 20mm; }
table.encabezado { width: 253mm; border-collapse: collapse; margin-top: 4mm; }
table.encabezado td { vertical-align: middle; }
td.logo-celda { width: 27mm; padding-right: 4mm; }
td.logo-celda img { max-width: 24mm; max-height: 24mm; }
.encabezado h1 { margin: 0 0 1.5mm 0; color: #1266b3; font-size: 18px; font-weight: 700; }
.encabezado p { margin: 0.8mm 0; font-size: 12px; line-height: 1.2; }
.linea-azul { width: 100%; height: 1.2mm; background: #176abd; margin-top: 1mm; }
.titulo-informe { text-align: center; margin-top: 2.5mm; }
.titulo-informe h2 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
.titulo-informe .fecha-generacion { margin-top: 0.5mm; font-size: 10px; color: #777; }
.resumen { margin-top: 2mm; }
.seccion-titulo { width: 100%; padding: 1.5mm 3mm; background: #dff0fc; font-size: 12px; font-weight: 700; color: #1266b3; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.indicadores { display: table; width: 100%; margin-top: 2mm; border-spacing: 2mm 0; }
.indicador { display: table-cell; width: 20%; text-align: center; background-color: #fafafa; border: 1px solid #eee; padding: 2mm 1mm; }
.indicador .valor { font-size: 15px; font-weight: 700; color: #1266b3; }
.indicador .etiqueta { font-size: 8px; color: #777; text-transform: uppercase; margin-top: 1mm; }
.indicador.ok .valor { color: #2e7d32; }
.indicador.alerta .valor { color: #c62828; }
.detalle { margin-top: 2mm; }
.detalle th { background-color: #176abd; color: #ffffff; padding: 1.6mm 2mm; text-align: left; font-size: 9px; text-transform: uppercase; }
.detalle td { padding: 1.4mm 2mm; border-bottom: 1px solid #eee; font-size: 9.5px; }
.detalle tr { page-break-inside: avoid; }
.detalle tr:nth-child(even) { background-color: #fafafa; }
.estado-badge { display: inline-block; padding: 0.6mm 2.5mm; border-radius: 1mm; color: #ffffff; font-weight: 700; font-size: 8px; }
.estado-ACTIVO { background-color: #2e7d32; }
.estado-SUSPENDIDO { background-color: #f6a623; }
.estado-INACTIVO { background-color: #757575; }
.tiene-cuenta { color: #2e7d32; font-weight: 700; }
.sin-cuenta { color: #c62828; font-weight: 700; }
.pie { margin-top: 2mm; text-align: center; color: #777; font-size: 10px; line-height: 1.6; }
.pie p { margin: 0.8mm 0; }
@media print {
  body { background: white; }
  .factura { margin: 0; box-shadow: none; width: 297mm; min-height: 210mm; }
  .onda-superior { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
@media screen and (max-width: 1100px) {
  .factura { width: 100%; min-height: auto; margin: 0; box-shadow: none; }
  .contenido { width: calc(100% - 24px); padding-top: 50px; }
  .onda-superior, .onda-superior img { width: 100%; height: 80px; }
  .indicadores { display: block; border-spacing: 0; }
  .indicador { display: block; width: 100%; margin-top: 3px; }
}
`;

function docWrap(title, style, cuerpo) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>${esc(title)}</title>
<style>${style}</style>
</head>
<body>
${cuerpo}
</body>
</html>`;
}

function cabecera({ config, inst }) {
  return `<table class="encabezado">
<tr>
    <td class="logo-celda">
        ${inst.logoSrc ? `<img src="${inst.logoSrc}" alt="Logo"/>` : ''}
    </td>
    <td>
        <h1>${esc(config.nombreAcueducto)}</h1>
        <p>${esc(config.direccion)}</p>
        <p>Tel: ${esc(config.telefonoPrincipal)}${config.nit ? ` | NIT: ${esc(config.nit)}` : ''}</p>
    </td>
</tr>
</table>
<div class="linea-azul"></div>`;
}

function firmas({ inst }) {
  return `<table class="firmas">
<tr>
    <td>
        ${inst.firmaSrc ? `<img src="${inst.firmaSrc}" alt="Firma"/>` : ''}
        <div class="firma-linea"></div>
        <span>Firma del Tesorero / Administrador</span>
    </td>
    <td>
        ${inst.selloSrc ? `<img src="${inst.selloSrc}" alt="Sello"/>` : ''}
        <div class="firma-linea"></div>
        <span>Sello oficial</span>
    </td>
</tr>
</table>`;
}

const PIE_INFORME = '<div class="pie"><p>Informe generado electronicamente por el Sistema Integral de Gestion del Acueducto Los Guaduales.</p></div>';

function indicador(clases, valor, etiqueta) {
  return `<div class="indicador${clases}"><div class="valor">${valor}</div><div class="etiqueta">${etiqueta}</div></div>`;
}

// ---------- informe periodo (mensual/anual) ----------

function cuerpoInforme({ tipo, periodo, informe, config, inst, titulo }) {
  const inf = informe || {};
  const badge = (e) => `<span class="estado-badge estado-${esc(e)}">${esc(e)}</span>`;
  return `<div class="factura">
    <div class="onda-superior"><img src="${ONDA_INFORME_SRC}" alt=""/></div>
    <div class="contenido">
        ${cabecera({ config, inst })}
        <div class="titulo-informe">
            <h2>${esc(titulo)}</h2>
            ${periodo ? `<div class="periodo">${esc(periodo)}</div>` : ''}
            <div class="fecha-generacion">Generado el ${esc(fmtFechaHora(new Date()))}</div>
        </div>
        <div class="seccion">
            <div class="seccion-titulo">Resumen de Tesoreria</div>
            <div class="indicadores">
                ${indicador(' ok', esc(fmtMoneda(inf.totalIngresos)), 'Total Ingresos')}
                ${indicador(' alerta', esc(fmtMoneda(inf.totalGastos)), 'Total Gastos')}
                ${indicador('', esc(fmtMoneda(inf.balance)), 'Balance')}
                ${indicador('', esc(fmtMoneda(inf.totalMultas)), `Total Multas (${Number(inf.numeroMultas ?? 0)})`)}
            </div>
        </div>
        <div class="seccion">
            <div class="seccion-titulo">Resumen de Facturacion</div>
            <div class="indicadores">
                ${indicador('', Number(inf.facturasGeneradas ?? 0), 'Facturas Generadas')}
                ${indicador(' ok', Number(inf.facturasPagadas ?? 0), 'Pagadas')}
                ${indicador('', Number(inf.facturasPendientes ?? 0), 'Pendientes')}
                ${indicador(' alerta', Number(inf.facturasVencidas ?? 0), 'Vencidas')}
            </div>
            <table class="datos-tabla">
                <tr><td class="etiqueta">Total facturado</td><td>${esc(fmtMoneda(inf.totalFacturado))}</td><td class="etiqueta">Total recaudado</td><td>${esc(fmtMoneda(inf.totalRecaudado))}</td></tr>
                <tr><td class="etiqueta">Consumo total (m3)</td><td>${Number(inf.totalM3Consumidos ?? 0)} m3</td><td class="etiqueta">Promedio de consumo</td><td>${esc(decimal1(inf.promedioConsumoM3))} m3</td></tr>
                <tr><td class="etiqueta">Asociados activos</td><td>${Number(inf.asociadosActivos ?? 0)}</td><td class="etiqueta">Asociados suspendidos</td><td>${Number(inf.asociadosSuspendidos ?? 0)}</td></tr>
            </table>
        </div>
        ${(inf.facturas || []).length ? `<div class="seccion">
            <div class="seccion-titulo">Detalle de Facturas del Periodo</div>
            <table class="detalle">
                <thead><tr><th>Numero</th><th>Asociado</th><th>Fecha</th><th>Estado</th><th style="text-align:right;">Total</th></tr></thead>
                <tbody>${inf.facturas.map((f) => `<tr><td>${esc(f.numeroFactura)}</td><td>${esc(f.asociadoNombre)}</td><td>${esc(f.fechaEmision)}</td><td>${badge(f.estado)}</td><td class="der">${esc(fmtMoneda(f.total))}</td></tr>`).join('')}</tbody>
            </table>
        </div>` : ''}
        ${(inf.movimientos || []).length ? `<div class="seccion">
            <div class="seccion-titulo">Detalle de Movimientos de Tesoreria</div>
            <table class="detalle">
                <thead><tr><th>Numero</th><th>Tipo</th><th>Concepto</th><th>Fecha</th><th style="text-align:right;">Valor</th></tr></thead>
                <tbody>${inf.movimientos.map((m) => `<tr><td>${esc(m.numero)}</td><td><span class="tipo-${esc(m.tipo)}">${esc(m.tipo)}</span></td><td>${esc(m.concepto)}</td><td>${esc(m.fecha)}</td><td class="der">${esc(fmtMoneda(m.valor))}</td></tr>`).join('')}</tbody>
            </table>
        </div>` : ''}
        ${firmas({ inst })}
        ${PIE_INFORME}
    </div>
</div>`;
}

export function renderInformePeriodoHtml({ informe, tipo = 'Mensual', periodo, config, inst }) {
  const cuerpo = cuerpoInforme({ tipo, periodo, informe, config, inst, titulo: `Informe ${tipo} de Gestion` });
  return docWrap(`Informe ${tipo} - ${periodo}`, CSS_INFORME, cuerpo);
}

export function renderInformeAnualHtml({ informe, tipo = 'Anual', periodo, config, inst }) {
  const cuerpo = cuerpoInforme({ tipo, periodo, informe, config, inst, titulo: `Informe ${tipo} de Gestion` });
  return docWrap(`Informe ${tipo} - ${periodo}`, CSS_INFORME, cuerpo);
}

// ---------- informe asociado ----------

export function renderInformeAsociadoHtml({ asociado, resumen, config, inst }) {
  const r = resumen || {};
  const badge = (e) => `<span class="estado-badge estado-${esc(e)}">${esc(e)}</span>`;
  const cuerpo = `<div class="factura">
    <div class="onda-superior"><img src="${ONDA_INFORME_SRC}" alt=""/></div>
    <div class="contenido">
        ${cabecera({ config, inst })}
        <div class="titulo-informe">
            <h2>Informe de Seguimiento al Asociado</h2>
            <div class="fecha-generacion">Generado el ${esc(fmtFechaHora(new Date()))}</div>
        </div>
        <div class="seccion">
            <div class="seccion-titulo">Datos del Asociado</div>
            <table class="datos-tabla">
                <tr><td class="etiqueta">Nombre completo</td><td>${esc(asociado.nombres)} ${esc(asociado.apellidos)}</td><td class="etiqueta">Documento</td><td>${esc(asociado.tipoDocumento)} ${esc(asociado.documento)}</td></tr>
                <tr><td class="etiqueta">Codigo interno</td><td>${esc(asociado.codigoInterno)}</td><td class="etiqueta">Estado del servicio</td><td>${badge(asociado.estadoServicio || 'ACTIVO')}</td></tr>
                <tr><td class="etiqueta">Telefono</td><td>${esc(asociado.telefonoPrincipal ?? '-')}</td><td class="etiqueta">Medidor</td><td>${esc(asociado.numeroMedidor || '-')}</td></tr>
                <tr><td class="etiqueta">Direccion</td><td colspan="3">${esc(asociado.direccion || '')}</td></tr>
                <tr><td class="etiqueta">Fecha de afiliacion</td><td colspan="3">${esc(asociado.fechaIngreso || '')}</td></tr>
            </table>
        </div>
        <div class="seccion">
            <div class="seccion-titulo">Resumen Financiero</div>
            <div class="indicadores">
                ${indicador('', Number(r.facturas_generadas ?? 0), 'Total Facturas')}
                ${indicador(' ok', Number(r.facturas_pagadas ?? 0), 'Pagadas')}
                ${indicador('', Number(r.facturas_pendientes ?? 0), 'Pendientes')}
                ${indicador(' alerta', Number(r.facturas_vencidas ?? 0), 'Vencidas')}
            </div>
            <table class="datos-tabla">
                <tr><td class="etiqueta">Total facturado</td><td>${esc(fmtMoneda(r.total_facturado))}</td><td class="etiqueta">Total pagado</td><td>${esc(fmtMoneda(r.total_pagado))}</td></tr>
                <tr><td class="etiqueta">Saldo pendiente</td><td>${esc(fmtMoneda(r.saldo_pendiente))}</td><td class="etiqueta">Multas (${Number(r.numero_multas ?? 0)})</td><td>${esc(fmtMoneda(r.total_multas))}</td></tr>
            </table>
        </div>
        ${(r.facturas || []).length ? `<div class="seccion">
            <div class="seccion-titulo">Historial de Facturas</div>
            <table class="detalle">
                <thead><tr><th>Numero</th><th>Fecha</th><th>Estado</th><th style="text-align:right;">Total</th><th style="text-align:right;">Saldo</th></tr></thead>
                <tbody>${r.facturas.map((f) => `<tr><td>${esc(f.numeroFactura)}</td><td>${esc(f.fechaEmision)}</td><td>${badge(f.estado)}</td><td class="der">${esc(fmtMoneda(f.total))}</td><td class="der">${esc(fmtMoneda(f.saldoPendiente ?? 0))}</td></tr>`).join('')}</tbody>
            </table>
        </div>` : ''}
        ${(r.pagos || []).length ? `<div class="seccion">
            <div class="seccion-titulo">Historial de Pagos Realizados</div>
            <table class="detalle">
                <thead><tr><th>Recibo</th><th>Factura</th><th>Fecha</th><th>Metodo</th><th style="text-align:right;">Valor</th></tr></thead>
                <tbody>${r.pagos.map((p) => `<tr><td>${esc(p.numeroRecibo)}</td><td>${esc(p.numeroFactura || '')}</td><td>${esc(p.fecha)}</td><td>${esc(p.metodoPago)}</td><td class="der">${esc(fmtMoneda(p.valor))}</td></tr>`).join('')}</tbody>
            </table>
        </div>` : ''}
        ${(r.multas || []).length ? `<div class="seccion">
            <div class="seccion-titulo">Historial de Multas</div>
            <table class="detalle">
                <thead><tr><th>Motivo</th><th>Fecha</th><th>Estado</th><th style="text-align:right;">Valor</th></tr></thead>
                <tbody>${r.multas.map((m) => `<tr><td>${esc(m.motivo)}</td><td>${esc(m.fecha)}</td><td>${esc(m.estado)}</td><td class="der">${esc(fmtMoneda(m.valor))}</td></tr>`).join('')}</tbody>
            </table>
        </div>` : ''}
        ${firmas({ inst })}
        ${PIE_INFORME}
    </div>
</div>`;
  return docWrap(`Informe asociado - ${asociado.nombres} ${asociado.apellidos}`, CSS_INFORME, cuerpo);
}

// ---------- listado general de asociados (landscape) ----------

export function renderListadoAsociadosHtml({ asociados = [], config, inst }) {
  const total = asociados.length;
  const activos = asociados.filter((a) => a.estadoServicio === 'ACTIVO').length;
  const suspendidos = asociados.filter((a) => a.estadoServicio === 'SUSPENDIDO').length;
  const sinCuenta = 0;
  const conCuenta = 0;
  const cuerpo = `<div class="factura">
    <div class="onda-superior"><img src="${ONDA_INFORME_SRC}" alt=""/></div>
    <div class="contenido">
        ${cabecera({ config, inst })}
        <div class="titulo-informe">
            <h2>Listado General de Asociados</h2>
            <div class="fecha-generacion">Generado el ${esc(fmtFechaHora(new Date()))}</div>
        </div>
        <div class="resumen">
            <div class="seccion-titulo">Resumen General</div>
            <div class="indicadores">
                ${indicador('', total, 'Total Asociados')}
                ${indicador(' ok', activos, 'Activos')}
                ${indicador(' alerta', suspendidos, 'Suspendidos')}
                ${indicador(' ok', conCuenta, 'Con Cuenta')}
                ${indicador(' alerta', sinCuenta, 'Sin Cuenta')}
            </div>
        </div>
        <table class="detalle">
            <thead>
            <tr>
                <th style="width:7%;">Codigo Interno</th>
                <th style="width:14%;">Nombre</th>
                <th style="width:10%;">Documento</th>
                <th style="width:9%;">Telefono</th>
                <th style="width:12%;">Correo</th>
                <th style="width:14%;">Direccion</th>
                <th style="width:8%;">Estado Servicio</th>
                <th style="width:8%;">Medidor</th>
                <th style="width:9%;">Estado Medidor</th>
                <th style="width:9%;">Cuenta</th>
            </tr>
            </thead>
            <tbody>
            ${asociados.map((a) => `<tr>
                <td>${esc(a.codigoInterno)}</td>
                <td>${esc(a.nombres)} ${esc(a.apellidos)}</td>
                <td>${esc(a.documento)}</td>
                <td>${esc(a.telefonoPrincipal)}</td>
                <td>${esc(a.correo || '')}</td>
                <td>${esc(a.direccion || '')}</td>
                <td><span class="estado-badge estado-${esc(a.estadoServicio)}">${esc(a.estadoServicio)}</span></td>
                <td>${esc(a.numeroMedidor || '')}</td>
                <td>${esc(a.estadoMedidor || '')}</td>
                <td>${a.tieneCuenta ? '<span class="tiene-cuenta">SI</span>' : '<span class="sin-cuenta">NO</span>'}</td>
            </tr>`).join('')}
            </tbody>
        </table>
        <div class="pie"><p>Listado generado electronicamente por el Sistema Integral de Gestion del Acueducto Los Guaduales.</p></div>
    </div>
</div>`;
  return docWrap(`Listado de Asociados - ${config.nombreAcueducto}`, CSS_LISTADO, cuerpo);
}
