import * as XLSX from 'xlsx';

/**
 * Exporta un array de objetos a un archivo Excel o CSV.
 * @param {Object[]} data - Array de objetos a exportar
 * @param {string} filename - Nombre del archivo (sin extension)
 * @param {string} sheetName - Nombre de la hoja de calculo
 * @param {string} format - 'xlsx' o 'csv'
 */
export function exportarAExcel(data, filename = 'exportacion', sheetName = 'Datos', format = 'xlsx') {
  if (!data || data.length === 0) return;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-ajustar anchos de columna
  const colWidths = Object.keys(data[0]).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((row) => String(row[key] || '').length)
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  if (format === 'csv') {
    XLSX.writeFile(wb, `${filename}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}

/**
 * Formatea moneda colombiana para exportaciones.
 */
export function formatoMoneda(valor) {
  if (valor === null || valor === undefined) return '';
  return Number(valor).toLocaleString('es-CO');
}

/**
 * Prepara datos de facturas para exportacion.
 */
export function prepararFacturasParaExportar(facturas) {
  return facturas.map((f) => ({
    'Número': f.numeroFactura,
    'Asociado': f.asociadoNombre || '',
    'Documento': f.asociadoDocumento || '',
    'Estado': f.estado,
    'Fecha emisión': f.fechaEmision,
    'Fecha límite pago': f.fechaLimitePago,
    'Consumo (m³)': f.consumoM3,
    'Valor consumo': f.valorConsumo,
    'Cargo administración': f.cargoAdministracion,
    'Multas': f.totalMultas,
    'Total': f.total,
    'Pagado': f.totalPagado,
    'Saldo pendiente': f.saldoPendiente,
  }));
}

/**
 * Prepara datos de recibos para exportacion.
 */
export function prepararRecibosParaExportar(recibos) {
  return recibos.map((r) => ({
    'Número': r.numeroRecibo,
    'Asociado': r.asociadoNombre || '',
    'Estado': r.estado,
    'Valor': r.valor,
    'Saldo pendiente': r.saldoPendiente,
    'Método pago': r.metodoPago || '',
    'Fecha': r.fechaEmision,
    'Factura asociada': r.numeroFactura || '',
  }));
}

/**
 * Prepara datos de movimientos de tesoreria para exportacion.
 */
export function prepararMovimientosParaExportar(movimientos) {
  return movimientos.map((m) => ({
    'Tipo': m.tipo,
    'Número': m.numeroFormateado,
    'Concepto': m.concepto,
    'Categoría': m.categoria,
    'Valor': m.valor,
    'Usuario': m.usuario,
    'Fecha': m.fecha,
    'Mes contable': m.mesContable || '',
  }));
}

/**
 * Prepara datos de asociados para exportacion.
 */
export function prepararAsociadosParaExportar(asociados) {
  return asociados.map((a) => ({
    'Nombre completo': a.nombreCompleto || `${a.nombres || ''} ${a.apellidos || ''}`.trim(),
    'Documento': a.numeroDocumento || a.documento || '',
    'Teléfono': a.telefonoPrincipal || a.telefono || '',
    'Correo': a.correo || a.email || '',
    'Dirección': a.direccion || '',
    'Barrio/Vereda': a.barrioVereda || a.barrio || '',
    'Número medidor': a.numeroMedidor || '',
    'Estado servicio': a.estadoServicio || '',
    'Fecha afiliación': a.fechaAfiliacion || '',
    'Archivado': a.archivado ? 'Sí' : 'No',
  }));
}

/**
 * Prepara datos de notas de credito para exportacion.
 */
export function prepararNotasCreditoParaExportar(notas) {
  return notas.map((nc) => ({
    'Número nota': nc.numeroNota,
    'Asociado': nc.asociadoNombre || '',
    'Motivo': nc.motivo || '',
    'Valor': nc.valor,
    'Factura': nc.numeroFactura || '—',
    'Estado': nc.estado,
    'Fecha emisión': nc.fechaEmision,
  }));
}

/**
 * Prepara datos de deudas/cartera para exportacion.
 */
export function prepararDeudasParaExportar(detalle) {
  return detalle.map((d) => ({
    'Factura': d.numeroFactura,
    'Asociado': d.asociadoNombre || '',
    'Medidor': d.numeroMedidor || '',
    'Total': d.total,
    'Pagado': d.totalPagado,
    'Saldo pendiente': d.saldoPendiente,
    'Días vencimiento': d.diasVencimiento,
    'Rango aging': d.rangoAging || '',
  }));
}

/**
 * Prepara datos de conciliacion bancaria para exportacion.
 */
export function prepararConciliacionParaExportar(movimientos) {
  return movimientos.map((m) => ({
    'Fecha': m.fechaTransaccion,
    'Descripción': m.descripcion || '',
    'Valor': m.valor,
    'Referencia': m.numeroReferencia || '—',
    'Estado': m.estado,
    'Archivo origen': m.archivoOrigen || '',
  }));
}
