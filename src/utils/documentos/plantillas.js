// Planillas originales del acueducto portadas del backend Java/Thymeleaf.
// Réplica fiel de templates/factura.html, recibo.html y multa.html:
// mismas ondas, colores, tamaños A4, responsive e impresión.
import {
  esc,
  fmtMoneda,
  fmtFecha,
  fmtFechaHora,
  numeroMulta,
} from './comun';
import { ONDA_AZUL_TOP, ONDA_AZUL_BOT, ONDA_VERDE_TOP, ONDA_VERDE_BOT, ONDA_AMBAR_TOP, ONDA_AMBAR_BOT } from './ondas';

/* ============================ FACTURA ============================ */

const CSS_FACTURA = `
* { box-sizing: border-box; }
@page { size: A4; margin: 0; }
body { margin: 0; padding: 0; background: #e9edf2; font-family: Arial, Helvetica, sans-serif; color: #222; }
.factura { position: relative; width: 210mm; min-height: 297mm; overflow: hidden; margin: 0 auto; background: #ffffff; }
.onda-superior { position: absolute; top: 0; left: 0; width: 100%; height: 54mm; z-index: 0; overflow: hidden; }
.onda-superior img { display: block; width: 100%; height: 100%; }
.onda-inferior { position: absolute; bottom: 0; left: 0; width: 100%; height: 55mm; z-index: 0; overflow: hidden; }
.onda-inferior img { display: block; width: 100%; height: 100%; }
.contenido { position: relative; z-index: 2; width: 166mm; margin: 0 auto; padding-top: 12mm; padding-bottom: 45mm; }
.encabezado { position: relative; }
table.empresa { width: 166mm; border-collapse: collapse; margin-top: 4mm; }
table.empresa td { vertical-align: middle; }
td.logo-celda { width: 27mm; padding-right: 4mm; }
td.logo-celda img { max-width: 24mm; max-height: 24mm; }
td.qr-celda { width: 31mm; text-align: right; vertical-align: top; }
.empresa h1 { margin: 0 0 1.5mm 0; color: #1266b3; font-size: 18px; font-weight: 700; }
.empresa p { margin: 0.8mm 0; font-size: 12px; line-height: 1.2; }
.qr-card { width: 29mm; padding: 3mm; background: #ffffff; border: 1px solid #d8d8d8; }
.qr-card img { display: block; width: 23mm; height: 23mm; margin: 0 auto; }
.linea-azul { width: 100%; height: 1.2mm; background: #176abd; margin-top: 1mm; }
.titulo { text-align: center; margin-top: 2.5mm; }
.titulo h2 { margin: 0; font-size: 19px; font-weight: 700; }
.numero-factura { margin-top: 0.5mm; color: #1266b3; font-size: 25px; font-weight: 700; }
.estado { display: inline-block; margin-top: 0.5mm; padding: 1mm 3.5mm; color: #ffffff; font-size: 12px; font-weight: 700; }
.estado-PENDIENTE { background-color: #f6a623; }
.estado-PAGADA { background-color: #2e7d32; }
.estado-PAGADA_PARCIAL { background-color: #ef6c00; }
.estado-VENCIDA { background-color: #c62828; }
.estado-ANULADA { background-color: #757575; }
.seccion { margin-top: 2mm; page-break-inside: avoid; }
.seccion-titulo { width: 100%; padding: 1.5mm 3mm; background: #dff0fc; font-size: 12px; font-weight: 700; color: #1266b3; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.tabla-info td { border: 1px solid #d5d5d5; padding: 1.2mm 2mm; font-size: 12px; }
.tabla-info td.label { width: 22%; font-weight: 700; }
.tabla-info td.valor { width: 28%; }
.tabla-info td.label-2 { width: 23%; font-weight: 700; }
.tabla-info td.valor-2 { width: 27%; }
.tabla-cobros { margin-top: 1.5mm; }
.tabla-cobros th { padding: 2mm; background: #176abd; color: #ffffff; font-size: 12px; text-align: left; }
.tabla-cobros th:last-child { text-align: right; }
.tabla-cobros td { padding: 2mm 2mm; border-bottom: 1px solid #ddd; font-size: 12px; }
.tabla-cobros td:last-child { text-align: right; white-space: nowrap; }
.tabla-cobros tr.total td { border-top: 1mm solid #176abd; border-bottom: none; font-size: 16px; font-weight: 700; padding: 2mm; }
table.firmas { width: 100%; border-collapse: collapse; margin-top: 4mm; page-break-inside: avoid; }
table.firmas td { width: 50%; text-align: center; vertical-align: top; }
.firma-linea { width: 52mm; border-top: 1px solid #222; margin: 0 auto 1.5mm auto; }
table.firmas img { max-width: 37mm; max-height: 15mm; }
table.firmas span { font-size: 13px; }
.pie { margin-top: 2mm; text-align: center; color: #777; font-size: 10px; line-height: 1.6; }
.pie p { margin: 0.8mm 0; }
@media print {
  body { background: #ffffff; }
  .factura { width: 210mm; min-height: 297mm; margin: 0; box-shadow: none; }
  .onda-superior, .onda-inferior { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
@media screen and (max-width: 800px) {
  body { background: #fff; }
  .factura { width: 100%; min-height: auto; margin: 0; box-shadow: none; }
  .contenido { width: calc(100% - 40px); padding-top: 120px; padding-bottom: 130px; }
  .onda-superior { width: 100%; height: 150px; }
  .onda-superior img { width: 100%; height: 150px; }
  .onda-inferior { width: 100%; height: 120px; }
  .onda-inferior img { width: 100%; height: 120px; }
  .encabezado { min-height: 210px; }
  table.empresa { width: calc(100% - 100px); margin-top: 20px; }
  td.logo-celda { width: 80px; }
  td.logo-celda img { max-width: 70px; max-height: 70px; }
  .empresa h1 { font-size: 19px; }
  .empresa p { font-size: 12px; }
  .qr-card { top: 100px; right: 0; width: 90px; min-height: 110px; }
  .qr-card img { width: 70px; height: 70px; }
  .titulo h2 { font-size: 17px; }
  .numero-factura { font-size: 23px; }
  .tabla-info td { font-size: 12px; padding: 2mm; }
  .tabla-cobros td, .tabla-cobros th { font-size: 12px; }
}
@media screen and (max-width: 500px) {
  .contenido { width: calc(100% - 24px); }
  table.empresa { width: calc(100% - 86px); }
  .empresa p { font-size: 11px; }
  .qr-card { width: 78px; min-height: 96px; }
  .qr-card img { width: 60px; height: 60px; }
  .tabla-info td { font-size: 11px; }
  .tabla-cobros td, .tabla-cobros th { font-size: 11px; }
  .total td { font-size: 15px; }
  .firma-linea { width: 100%; }
  table.firmas span { font-size: 11px; }
}
`;

export function renderFacturaHtml({ factura, asociado, medidor, conceptos = [], config, inst, qr }) {
  const num = factura.numeroFactura || factura.numero || '';
  const estado = factura.estado || 'PENDIENTE';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Factura ${esc(num)}</title>
<style>${CSS_FACTURA}</style>
</head>
<body>
<div class="factura">

    <div class="onda-superior"><img src="${inst.ondaTop}" alt=""/></div>
    <div class="onda-inferior"><img src="${inst.ondaBot}" alt=""/></div>

    <div class="contenido">
        <div class="encabezado">
            <table class="empresa">
                <tr>
                    <td class="logo-celda">
                        <img src="${inst.logoSrc}" width="24" height="24" alt="Logo"/>
                    </td>
                    <td>
                        <h1>${esc(config.nombreAcueducto)}</h1>
                        <p>${esc(config.direccion)}</p>
                        <p>${esc(config.telefonoPrincipal ? 'Tel: ' + config.telefonoPrincipal : '')}${config.nit ? ' | NIT: ' + esc(config.nit) : ''}</p>
                        <p>${esc(config.correo)}</p>
                    </td>
                    <td class="qr-celda">
                        <div class="qr-card">
                            ${qr ? `<img src="${qr}" alt="Codigo QR"/>` : ''}
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="linea-azul"></div>

        <div class="titulo">
            <h2>FACTURA DE COBRO DEL SERVICIO DE ACUEDUCTO</h2>
            <div class="numero-factura">${esc(num)}</div>
            <span class="estado estado-${esc(estado)}">${esc(estado)}</span>
        </div>

        <div class="seccion">
            <div class="seccion-titulo">INFORMACION DEL ASOCIADO</div>
            <table class="tabla-info">
                <tr>
                    <td class="label">Codigo interno</td>
                    <td class="valor">${esc(asociado.codigoInterno || '-')}</td>
                    <td class="label-2">Documento</td>
                    <td class="valor-2">${esc(asociado.tipoDocumento || '')} ${esc(asociado.documento || '')}</td>
                </tr>
                <tr>
                    <td class="label">Nombre completo</td>
                    <td colspan="3">${esc(asociado.nombres)} ${esc(asociado.apellidos)}</td>
                </tr>
                <tr>
                    <td class="label">Direccion</td>
                    <td colspan="3">${esc(asociado.direccion || '-')}</td>
                </tr>
            </table>
        </div>

        <div class="seccion">
            <div class="seccion-titulo">INFORMACION DEL PERIODO</div>
            <table class="tabla-info">
                <tr>
                    <td class="label">Fecha de emision</td>
                    <td class="valor">${esc(fmtFecha(factura.fechaEmision))}</td>
                    <td class="label-2">Fecha limite de pago</td>
                    <td class="valor-2">${esc(fmtFecha(factura.fechaLimitePago))}</td>
                </tr>
                <tr>
                    <td class="label">Lectura anterior</td>
                    <td class="valor">${esc(factura.lecturaAnterior ?? '-')}</td>
                    <td class="label-2">Lectura actual</td>
                    <td class="valor-2">${esc(factura.lecturaActual ?? '-')}</td>
                </tr>
                <tr>
                    <td class="label">Consumo (m3)</td>
                    <td colspan="3">${esc(factura.consumoM3 ?? 0)} m3${medidor ? ` | Medidor: ${esc(medidor)}` : ''}</td>
                </tr>
            </table>
        </div>

        <div class="seccion">
            <div class="seccion-titulo">DETALLE DE COBROS</div>
            <table class="tabla-cobros">
                <thead>
                <tr><th>Concepto</th><th style="width: 28%;">Valor</th></tr>
                </thead>
                <tbody>
                <tr>
                    <td>Consumo de agua (${esc(factura.consumoM3 ?? 0)} m3 x ${esc(fmtMoneda(factura.valorM3))})</td>
                    <td>${esc(fmtMoneda(factura.valorConsumo))}</td>
                </tr>
                <tr>
                    <td>Cargo fijo de administracion</td>
                    <td>${esc(fmtMoneda(factura.cargoAdministracion))}</td>
                </tr>
                ${Number(factura.totalMultas ?? 0) > 0 ? `<tr><td>Multas pendientes</td><td>${esc(fmtMoneda(factura.totalMultas))}</td></tr>` : ''}
                ${Number(factura.valoresAdicionales ?? 0) > 0 && !(conceptos || []).length ? `<tr><td>Conceptos adicionales</td><td>${esc(fmtMoneda(factura.valoresAdicionales))}</td></tr>` : ''}
                ${(conceptos || []).map((c) => `<tr><td>${esc(c.descripcion)}</td><td>${esc(fmtMoneda(c.valor))}</td></tr>`).join('')}
                <tr class="total">
                    <td>TOTAL A PAGAR</td>
                    <td>${esc(fmtMoneda(factura.total))}</td>
                </tr>
                ${Number(factura.totalPagado ?? 0) > 0 ? `<tr><td>Total pagado</td><td>${esc(fmtMoneda(factura.totalPagado))}</td></tr>
                <tr><td><b>Saldo pendiente</b></td><td><b>${esc(fmtMoneda(factura.saldoPendiente ?? (Number(factura.total) - Number(factura.totalPagado ?? 0))))}</b></td></tr>` : ''}
                </tbody>
            </table>
        </div>

        ${config.banco ? `<div class="seccion">
            <div class="seccion-titulo">INFORMACION BANCARIA PARA PAGOS</div>
            <table class="tabla-info">
                <tr>
                    <td class="label">Banco</td>
                    <td class="valor">${esc(config.banco)}</td>
                    <td class="label-2">Tipo de cuenta</td>
                    <td class="valor-2">${esc(config.tipoCuenta)}</td>
                </tr>
                <tr>
                    <td class="label">Numero de cuenta</td>
                    <td class="valor">${esc(config.numeroCuenta)}</td>
                    <td class="label-2">Titular</td>
                    <td class="valor-2">${esc(config.titularCuenta)}</td>
                </tr>
            </table>
        </div>` : ''}

        <table class="firmas">
            <tr>
                <td>
                    ${inst.firmaSrc ? `<img src="${inst.firmaSrc}" width="37" height="15" alt="Firma"/>` : ''}
                    <div class="firma-linea"></div>
                    <span>Firma autorizada</span>
                </td>
                <td>
                    ${inst.selloSrc ? `<img src="${inst.selloSrc}" width="37" height="15" alt="Sello"/>` : ''}
                    <div class="firma-linea"></div>
                    <span>Sello oficial</span>
                </td>
            </tr>
        </table>

        <div class="pie">
            ${config.notasFactura ? `<p>${esc(config.notasFactura)}</p>` : ''}
            <p>Documento generado electronicamente por el Sistema Integral de Gestion del ${esc(config.nombreAcueducto)}.</p>
        </div>
    </div>
</div>
</body>
</html>`;
}

/* ============================ RECIBO ============================ */

const CSS_RECIBO = CSS_FACTURA.replace(/#1266b3/g, '#237d32').replace(/#176abd/g, '#237d32').replace('#dff0fc', '#e7f4e9');
// Variables adicionales específicas del recibo (multa independiente ámbar).
const CSS_RECIBO_EXTRA = `
.empresa h1.multa { color: #d97706; }
.linea-azul.multa { background: #d97706; }
.titulo.multa h2 { color: #d97706; }
.numero-recibo.multa { color: #d97706; }
.estado-EMITIDO { background-color: #2e7d32; }
.estado-EMITIDO.multa { background-color: #d97706; }
.estado-ANULADO { background-color: #c62828; }
.seccion-titulo.multa { background: #fef3c7; color: #d97706; }
.valor-recibido { margin-top: 1.5mm; padding: 4mm; background: #eaf6ec; border: 1px solid #cfe8d4; text-align: center; }
.valor-recibido.multa { background: #fef3c7; border-color: #fcd34d; }
.valor-recibido .valor { color: #237d32; font-size: 24px; font-weight: 700; }
.valor-recibido.multa .valor { color: #d97706; }
.valor-recibido .saldo { margin-top: 1.5mm; font-size: 12px; color: #333; }
`;

export function renderReciboHtml({ recibo, asociado, factura: facturaNumero, pago, config, inst, qr, esMulta }) {
  const num = recibo.numeroRecibo || recibo.numero || '';
  const estado = recibo.estado || 'EMITIDO';
  const m = esMulta ? ' multa' : '';
  const tituloDoc = esMulta ? 'PAGO MULTA INDEPENDIENTE' : 'RECIBO DE PAGO';
  const facturaRel = esMulta || !factura ? 'Multa independiente' : factura;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Recibo ${esc(num)}</title>
<style>${CSS_RECIBO}${CSS_RECIBO_EXTRA}</style>
</head>
<body>
<div class="recibo">

    <div class="onda-superior${m}"><img src="${esMulta ? inst.ondaTopMulta : inst.ondaTop}" alt=""/></div>
    <div class="onda-inferior${m}"><img src="${esMulta ? inst.ondaBotMulta : inst.ondaBot}" alt=""/></div>

    <div class="contenido">
        <div class="encabezado">
            <table class="empresa">
                <tr>
                    <td class="logo-celda">
                        <img src="${inst.logoSrc}" width="24" height="24" alt="Logo"/>
                    </td>
                    <td>
                        <h1 class="${esMulta ? 'multa' : ''}">${esc(config.nombreAcueducto)}</h1>
                        <p>${esc(config.direccion)}</p>
                        <p>${esc(config.telefonoPrincipal ? 'Tel: ' + config.telefonoPrincipal : '')}${config.nit ? ' | NIT: ' + esc(config.nit) : ''}</p>
                        <p>${esc(config.correo)}</p>
                    </td>
                    <td class="qr-celda">
                        <div class="qr-card">
                            ${qr ? `<img src="${qr}" alt="Codigo QR"/>` : ''}
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="linea-azul${m}"></div>

        <div class="titulo${m}">
            <h2>${tituloDoc}</h2>
            <div class="numero-recibo${m}">${esc(num)}</div>
            <span class="estado estado-${esc(estado)}${m}">${esc(estado)}</span>
        </div>

        <div class="seccion">
            <div class="seccion-titulo${m}">INFORMACION DEL PAGO</div>
            <table class="tabla-info">
                <tr>
                    <td class="label">Fecha de emision</td>
                    <td class="valor">${esc(fmtFechaHora(recibo.fechaEmision))}</td>
                    <td class="label-2">Factura relacionada</td>
                    <td class="valor-2">${esc(facturaRel)}</td>
                </tr>
                <tr>
                    <td class="label">Asociado</td>
                    <td class="valor">${esc(asociado.nombres)} ${esc(asociado.apellidos)}</td>
                    <td class="label-2">Documento</td>
                    <td class="valor-2">${esc(asociado.tipoDocumento || '')} ${esc(asociado.documento || '')}</td>
                </tr>
                <tr>
                    <td class="label">Metodo de pago</td>
                    <td class="valor">${esc(pago.metodoPago || 'N/A')}</td>
                    <td class="label-2">Recibido por</td>
                    <td class="valor-2">${esc(pago.tesorero || 'Sistema')}</td>
                </tr>
            </table>
        </div>

        <div class="seccion">
            <div class="seccion-titulo${m}">VALOR RECIBIDO</div>
            <div class="valor-recibido${m}">
                <div class="valor">${esc(fmtMoneda(recibo.valor))}</div>
                ${Number(recibo.saldoPendiente ?? 0) > 0 ? `<div class="saldo">Saldo pendiente de la factura: <b>${esc(fmtMoneda(recibo.saldoPendiente))}</b></div>` : ''}
            </div>
        </div>

        <table class="firmas">
            <tr>
                <td>
                    ${inst.firmaSrc ? `<img src="${inst.firmaSrc}" width="37" height="15" alt="Firma"/>` : ''}
                    <div class="firma-linea"></div>
                    <span>Firma autorizada</span>
                </td>
                <td>
                    ${inst.selloSrc ? `<img src="${inst.selloSrc}" width="37" height="15" alt="Sello"/>` : ''}
                    <div class="firma-linea"></div>
                    <span>Sello oficial</span>
                </td>
            </tr>
        </table>

        <div class="pie">
            ${config.notasFactura ? `<p>${esc(config.notasFactura)}</p>` : ''}
            <p>Documento generado electronicamente por el Sistema Integral de Gestion del ${esc(config.nombreAcueducto)}.</p>
        </div>
    </div>
</div>
</body>
</html>`;
}

/* ============================ MULTA ============================ */

const CSS_MULTA = CSS_FACTURA
  .replace(/#1266b3/g, '#d97706')
  .replace(/#176abd/g, '#d97706')
  .replace(/#dff0fc/g, '#fef3c7')
  + `
.titulo h2 { color: #92400e; }
.motivo-box { margin-top: 1.5mm; padding: 3mm; background: #fffbeb; border: 1px solid #fcd34d; font-size: 13px; line-height: 1.5; }
.motivo-box strong { color: #92400e; }
.valor-box { margin-top: 3mm; padding: 4mm; background: #fef3c7; border: 2px solid #f59e0b; text-align: center; }
.valor-box .label-valor { font-size: 12px; color: #92400e; font-weight: 700; text-transform: uppercase; }
.valor-box .monto { font-size: 28px; font-weight: 700; color: #d97706; margin-top: 1mm; }
`;

export function renderMultaHtml({ multa, asociado, facturaNumero, config, inst, numeroDoc }) {
  const numDoc = numeroDoc || numeroMulta(multa.id);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Multa ${esc(numDoc)}</title>
<style>${CSS_MULTA}</style>
</head>
<body>
<div class="documento">
    <div class="onda-superior"><img src="${inst.ondaTopMulta}" alt=""/></div>
    <div class="onda-inferior"><img src="${inst.ondaBotMulta}" alt=""/></div>
    <div class="contenido">
        <div class="encabezado">
            <table class="empresa">
                <tr>
                    <td class="logo-celda">
                        <img src="${inst.logoSrc}" width="24" height="24" alt="Logo"/>
                    </td>
                    <td>
                        <h1>${esc(config.nombreAcueducto)}</h1>
                        <p>${esc(config.direccion)}</p>
                        <p>${esc(config.telefonoPrincipal ? 'Tel: ' + config.telefonoPrincipal : '')}${config.nit ? ' | NIT: ' + esc(config.nit) : ''}</p>
                        <p>${esc(config.correo)}</p>
                    </td>
                </tr>
            </table>
        </div>
        <div class="linea-azul"></div>
        <div class="titulo">
            <h2>COMPROBANTE DE MULTA</h2>
            <div class="numero-factura">${esc(numDoc)}</div>
            <span class="estado estado-${esc(multa.estado || 'PENDIENTE')}">${esc(multa.estado || 'PENDIENTE')}</span>
        </div>
        <div class="seccion">
            <div class="seccion-titulo">INFORMACION DEL ASOCIADO</div>
            <table class="tabla-info">
                <tr>
                    <td class="label">Codigo interno</td>
                    <td class="valor">${esc(asociado.codigoInterno || '-')}</td>
                    <td class="label-2">Documento</td>
                    <td class="valor-2">${esc(asociado.tipoDocumento || '')} ${esc(asociado.documento || '')}</td>
                </tr>
                <tr>
                    <td class="label">Nombre completo</td>
                    <td colspan="3">${esc(asociado.nombres)} ${esc(asociado.apellidos)}</td>
                </tr>
                <tr>
                    <td class="label">Direccion</td>
                    <td colspan="3">${esc(asociado.direccion || '-')}</td>
                </tr>
            </table>
        </div>
        <div class="seccion">
            <div class="seccion-titulo">DETALLE DE LA MULTA</div>
            <table class="tabla-info">
                <tr>
                    <td class="label">Fecha de multa</td>
                    <td class="valor">${esc(fmtFecha(multa.fecha))}</td>
                    <td class="label-2">Estado</td>
                    <td class="valor-2">${esc(multa.estado || '')}</td>
                </tr>
                ${facturaNumero ? `<tr><td class="label">Factura asociada</td><td colspan="3">${esc(facturaNumero)}</td></tr>` : ''}
                <tr>
                    <td class="label">Tipo</td>
                    <td colspan="3">${multa.independiente ? 'Independiente (pago directo)' : 'Asociada a factura'}</td>
                </tr>
            </table>
        </div>
        <div class="seccion">
            <div class="seccion-titulo">MOTIVO</div>
            <div class="motivo-box">
                <strong>Motivo de la multa:</strong><br/>
                <span>${esc(multa.motivo)}</span>
            </div>
        </div>
        <div class="seccion">
            <div class="seccion-titulo">VALOR A PAGAR</div>
            <div class="valor-box">
                <div class="label-valor">Monto de la multa</div>
                <div class="monto">${esc(fmtMoneda(multa.valor))}</div>
            </div>
        </div>
        <table class="firmas">
            <tr>
                <td>
                    ${inst.firmaSrc ? `<img src="${inst.firmaSrc}" width="37" height="15" alt="Firma"/>` : ''}
                    <div class="firma-linea"></div>
                    <span>Firma autorizada</span>
                </td>
                <td>
                    ${inst.selloSrc ? `<img src="${inst.selloSrc}" width="37" height="15" alt="Sello"/>` : ''}
                    <div class="firma-linea"></div>
                    <span>Sello oficial</span>
                </td>
            </tr>
        </table>
        <div class="pie">
            ${config.notasFactura ? `<p>${esc(config.notasFactura)}</p>` : ''}
            <p>Documento generado electronicamente por el Sistema Integral de Gestion del ${esc(config.nombreAcueducto)}.</p>
        </div>
    </div>
</div>
</body>
</html>`;
}

// Devuelve las ondas por acento para pasarlas a los renderers a través de `inst`.
export function ondasPara(acento) {
  const dataURL = (n) => `data:image/png;base64,${n}`;
  const verde = {
    ondaTop: dataURL(ONDA_VERDE_TOP), ondaBot: dataURL(ONDA_VERDE_BOT),
    ondaTopMulta: dataURL(ONDA_AMBAR_TOP), ondaBotMulta: dataURL(ONDA_AMBAR_BOT),
  };
  if (acento === 'verde') return verde;
  if (acento === 'multa' || acento === 'ambar') {
    return { ondaTop: dataURL(ONDA_AMBAR_TOP), ondaBot: dataURL(ONDA_AMBAR_BOT), ondaTopMulta: dataURL(ONDA_AMBAR_TOP), ondaBotMulta: dataURL(ONDA_AMBAR_BOT) };
  }
  const azul = { ondaTop: dataURL(ONDA_AZUL_TOP), ondaBot: dataURL(ONDA_AZUL_BOT), ondaTopMulta: dataURL(ONDA_AMBAR_TOP), ondaBotMulta: dataURL(ONDA_AMBAR_BOT) };
  return azul;
}
