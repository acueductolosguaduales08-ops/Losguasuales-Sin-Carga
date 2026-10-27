import { jsPDF } from 'jspdf';

// PDFs reales lado cliente (sustituyen Thymeleaf del backend).
// Encabezado institucional simple; usa ConfiguracionAPI.obtener() si la pasas.

function header(doc, titulo, subtitulo) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Acueducto Los Guaduales', 14, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(titulo, 14, 24);
  if (subtitulo) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(subtitulo, 14, 30);
    doc.setTextColor(0);
  }
  doc.line(14, 34, 196, 34);
}

function kv(doc, y, k, v) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(k, 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(v ?? '-'), 70, y);
  return y + 6;
}

export function facturaPDF(f, conceptos = [], config = {}) {
  const doc = new jsPDF();
  header(doc, `Factura ${f.numero_factura || f.numeroFactura}`, `Emisión ${f.fecha_emision || f.fechaEmision} · Límite ${f.fecha_limite_pago || f.fechaLimitePago}`);
  let y = 42;
  y = kv(doc, y, 'Estado:', f.estado);
  y = kv(doc, y, 'Lectura:', `${f.lectura_anterior ?? '-'} → ${f.lectura_actual ?? '-'} (${f.consumo_m3 ?? f.consumoM3 ?? 0} m³)`);
  y = kv(doc, y, 'Consumo:', `${f.valor_consumo ?? f.valorConsumo} (${f.consumo_m3 ?? f.consumoM3} × ${f.valor_m3 ?? f.valorM3})`);
  y = kv(doc, y, 'Cargo admón:', `${f.cargo_administracion ?? f.cargoAdministracion}`);
  y = kv(doc, y, 'Multas:', `${f.total_multas ?? f.totalMultas}`);
  y = kv(doc, y, 'Adicionales:', `${f.valores_adicionales ?? f.valoresAdicionales}`);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${f.total}`, 14, y + 2);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pagado: ${f.total_pagado ?? f.totalPagado ?? 0}`, 14, y + 8);
  let cy = y + 16;
  if (conceptos.length) {
    doc.setFont('helvetica', 'bold');
    doc.text('Conceptos adicionales:', 14, cy);
    cy += 6;
    doc.setFont('helvetica', 'normal');
    for (const c of conceptos) {
      doc.text(`- ${c.descripcion}: ${c.valor}`, 14, cy);
      cy += 5;
      if (cy > 270) { doc.addPage(); cy = 20; }
    }
  }
  if (config.notasFactura) {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(config.notasFactura.slice(0, 300), 14, 285, { maxWidth: 180 });
  }
  return doc.output('blob');
}

export function reciboPDF(r) {
  const doc = new jsPDF();
  header(doc, `Recibo ${r.numero_recibo || r.numeroRecibo}`, `Estado ${r.estado}`);
  let y = 42;
  y = kv(doc, y, 'Valor:', `${r.valor}`);
  y = kv(doc, y, 'Saldo pendiente:', `${r.saldo_pendiente ?? r.saldoPendiente ?? 0}`);
  y = kv(doc, y, 'Fecha:', `${r.created_at || r.fecha || ''}`);
  return doc.output('blob');
}

export function informePDF(titulo, obj) {
  const doc = new jsPDF();
  header(doc, titulo, new Date().toLocaleString());
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(JSON.stringify(obj, null, 2), 180);
  doc.text(lines.slice(0, 120), 14, 42);
  return doc.output('blob');
}

export function pdfResponse(blob, filename) {
  return new Response(blob, {
    status: 200,
    headers: { 'Content-Type': 'application/pdf', 'content-disposition': `attachment; filename="${filename}"` },
  });
}
