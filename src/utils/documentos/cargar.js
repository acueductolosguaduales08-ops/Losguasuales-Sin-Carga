// Cargadores: traen los datos de Supabase (con joins), generan el QR y devuelven
// el HTML final de cada planilla. Reemplaza los "html" de jsPDF y los PDF amarillos.
import { supabase } from '../../lib/supabaseClient';
import {
  obtenerInstitucional, fmtFecha, fmtFechaHora, numeroMulta,
  abrirDocumentoHtml, qrConPersistencia,
} from './comun';
import {
  renderFacturaHtml, renderReciboHtml, renderMultaHtml, ondasPara,
} from './plantillas';
import {
  renderInformePeriodoHtml, renderInformeAnualHtml,
  renderInformeAsociadoHtml, renderListadoAsociadosHtml,
} from './informesDocs';

const SELECT_ASOCIADO = 'asociado:asociados(id, codigo_interno, tipo_documento, documento, nombres, apellidos, direccion, telefono_principal, correo)';

export function mapAsociado(row) {
  const a = row?.asociado ?? row?.asociados ?? null;
  if (!a) return {};
  return {
    codigoInterno: a.codigo_interno || '',
    tipoDocumento: a.tipo_documento || '',
    documento: a.documento || '',
    nombres: a.nombres || '',
    apellidos: a.apellidos || '',
    direccion: a.direccion || '',
    telefonoPrincipal: a.telefono_principal || '',
  };
}

export function mapFactura(fila) {
  const total = Number(fila.total ?? 0);
  const pagado = Number(fila.total_pagado ?? 0);
  return {
    id: fila.id,
    numeroFactura: fila.numero_factura,
    estado: fila.estado,
    fechaEmision: fmtFecha(fila.fecha_emision),
    fechaLimitePago: fmtFecha(fila.fecha_limite_pago),
    lecturaAnterior: fila.lectura_anterior,
    lecturaActual: fila.lectura_actual,
    consumoM3: fila.consumo_m3,
    valorM3: Number(fila.valor_m3 ?? 0),
    valorConsumo: Number(fila.valor_consumo ?? 0),
    cargoAdministracion: Number(fila.cargo_administracion ?? 0),
    valoresAdicionales: Number(fila.valores_adicionales ?? 0),
    totalMultas: Number(fila.total_multas ?? 0),
    total,
    totalPagado: pagado,
    saldoPendiente: total - pagado,
  };
}

// ---------- FACTURA ----------

export async function cargarFacturaHtml(idFactura, { autoPrint = false } = {}) {
  const { data, error } = await supabase
    .from('facturas')
    .select(`*, conceptos:conceptos_factura(descripcion, valor), ${SELECT_ASOCIADO}`)
    .eq('id', idFactura)
    .maybeSingle();
  if (error || !data) throw new Error('Factura no encontrada.');
  // No hay FK directas facturas→medidores: se resuelve por lectura o por asociado.
  let numeroMedidor = '';
  if (data.lectura_id) {
    const { data: med } = await supabase
      .from('lecturas')
      .select('medidor:medidores(numero)')
      .eq('id', data.lectura_id)
      .maybeSingle();
    numeroMedidor = med?.medidor?.numero || '';
  }
  if (!numeroMedidor && data.asociado_id) {
    const { data: med } = await supabase
      .from('medidores')
      .select('numero')
      .eq('asociado_id', data.asociado_id)
      .maybeSingle();
    numeroMedidor = med?.numero || '';
  }
  data.medidor = { numero: numeroMedidor };
  return renderFacturaDesdeFila(data, { autoPrint });
}

export async function renderFacturaDesdeFila(data, { autoPrint = false } = {}) {
  const inst = { ...(await obtenerInstitucional()), ...ondasPara('azul') };
  const qr = await qrConPersistencia('FACTURA', { id: data.id, numero: data.numero_factura });
  const html = renderFacturaHtml({
    factura: mapFactura(data),
    asociado: mapAsociado(data),
    medidor: data.medidor?.numero || '',
    conceptos: data.conceptos || [],
    config: inst.config,
    inst,
    qr,
  });
  if (autoPrint) abrirDocumentoHtml(html, { autoPrint: true });
  return html;
}

// ---------- RECIBO ----------

export async function cargarReciboHtml(idRecibo, { autoPrint = false } = {}) {
  const { data, error } = await supabase
    .from('recibos')
    .select(`*, pago:pagos(metodo_pago, tesorero:profiles(username)), factura:facturas(numero_factura), multa:multas(independiente), ${SELECT_ASOCIADO}`)
    .eq('id', idRecibo)
    .maybeSingle();
  if (error || !data) throw new Error('Recibo no encontrado.');
  return renderReciboDesdeFila(data, { autoPrint });
}

export async function cargarReciboHtmlPorNumero(numeroRecibo, { autoPrint = false } = {}) {
  const { data, error } = await supabase
    .from('recibos')
    .select(`*, pago:pagos(metodo_pago, tesorero:profiles(username)), factura:facturas(numero_factura), multa:multas(independiente), ${SELECT_ASOCIADO}`)
    .eq('numero_recibo', numeroRecibo)
    .maybeSingle();
  if (error || !data) throw new Error('Recibo no encontrado.');
  return renderReciboDesdeFila(data, { autoPrint });
}

export async function renderReciboDesdeFila(data, { autoPrint = false } = {}) {
  const esMulta = !!data.multa_id && !data.factura_id;
  const inst = { ...(await obtenerInstitucional()), ...ondasPara(esMulta ? 'verde' : 'azul') };
  const qr = await qrConPersistencia('RECIBO', { id: data.id, numero: data.numero_recibo });
  const html = renderReciboHtml({
    recibo: {
      id: data.id,
      numeroRecibo: data.numero_recibo,
      estado: data.estado,
      valor: Number(data.valor ?? 0),
      saldoPendiente: Number(data.saldo_pendiente ?? 0),
      fechaEmision: fmtFechaHora(data.created_at),
    },
    asociado: mapAsociado(data),
    factura: data.factura?.numero_factura || null,
    pago: { metodoPago: data.pago?.metodo_pago || 'N/A', tesorero: data.pago?.tesorero?.username || '' },
    config: inst.config,
    inst,
    qr,
    esMulta,
  });
  if (autoPrint) abrirDocumentoHtml(html, { autoPrint: true });
  return html;
}

// ---------- MULTA ----------

export async function cargarMultaHtml(idMulta, { autoPrint = false } = {}) {
  const { data, error } = await supabase
    .from('multas')
    .select(`*, ${SELECT_ASOCIADO}, factura:facturas(numero_factura)`)
    .eq('id', idMulta)
    .maybeSingle();
  if (error || !data) throw new Error('Multa no encontrada.');
  return renderMultaDesdeFila(data, { autoPrint });
}

export async function renderMultaDesdeFila(data, { autoPrint = false } = {}) {
  const inst = { ...(await obtenerInstitucional()), ...ondasPara('ambar') };
  const html = renderMultaHtml({
    multa: {
      numero: numeroMulta(data.id),
      motivo: data.motivo,
      valor: Number(data.valor ?? 0),
      fecha: fmtFecha(data.fecha),
      estado: data.estado,
      independiente: data.independiente,
    },
    asociado: mapAsociado(data),
    facturaNumero: data.factura?.numero_factura || null,
    config: inst.config,
    inst,
  });
  if (autoPrint) abrirDocumentoHtml(html, { autoPrint: true });
  return html;
}

// ---------- ADAPTADORES PÚBLICOS (RPC endurecidas, sin login) ----------
// Contrato de las RPC 12_public_rpc_hardening.sql:
//   { tipo: 'FACTURA' | 'RECIBO', contenido: { ...fila..., asociado, conceptos?, institucional? } }

export async function renderDocumentoPublicoDesdeRPC(payload) {
  const { tipo, contenido: c } = payload || {};
  const instBase = c.institucional ? instDesdeRPC(c.institucional) : null;
  const inst = {
    ...(instBase || await obtenerInstitucional().catch(() => ({ config: {}, logoSrc: null, firmaSrc: null, selloSrc: null }))),
    ...ondasPara(tipo === 'RECIBO' ? 'verde' : 'azul'),
  };
  if (tipo === 'FACTURA') {
    const qr = c.codigo_qr || (await qrConPersistencia('FACTURA', { id: null, numero: c.numero_factura }));
    return renderFacturaHtml({
      factura: mapFacturaEditar(c),
      asociado: asociadoDesdeRPC(c?.asociado),
      medidor: c.medidor || '',
      conceptos: c.conceptos || [],
      config: inst.config,
      inst,
      qr,
    });
  }
  const esMulta = !!(c.multa_id && !c.factura_id);
  const qr = c.codigo_qr || (await qrConPersistencia('RECIBO', { id: null, numero: c.numero_recibo }));
  return renderReciboHtml({
    recibo: {
      id: c.id,
      numeroRecibo: c.numero_recibo,
      estado: c.estado,
      valor: Number(c.valor ?? 0),
      saldoPendiente: Number(c.saldo_pendiente ?? 0),
      fechaEmision: fmtFechaHora(c.created_at),
    },
    asociado: asociadoDesdeRPC(c?.asociado),
    factura: c.factura?.numero_factura || c.factura_numero || null,
    pago: { metodoPago: c.pago?.metodo_pago || c.metodo_pago || 'N/A', tesorero: c.pago?.tesorero || '' },
    config: inst.config,
    inst,
    qr,
    esMulta,
  });
}

function instDesdeRPC(i) {
  return {
    config: {
      nombreAcueducto: i.nombre_acueducto || 'Acueducto Los Guaduales',
      nit: i.nit || '', direccion: i.direccion || '', telefonoPrincipal: i.telefono_principal || '',
      correo: i.correo || '', municipio: i.municipio || '', banco: i.banco || '',
      tipoCuenta: i.tipo_cuenta || '', numeroCuenta: i.numero_cuenta || '',
      titularCuenta: i.titular_cuenta || '', notasFactura: i.notas_factura || '',
    },
    logoSrc: i.logo_activo || null,
    firmaSrc: i.firma_activa || null,
    selloSrc: i.sello_activo || null,
  };
}

function asociadoDesdeRPC(a) {
  if (!a) return {};
  return {
    codigoInterno: a.codigo_interno || '',
    tipoDocumento: a.tipo_documento || '',
    documento: a.documento || '',
    nombres: a.nombres || '',
    apellidos: a.apellidos || '',
    direccion: a.direccion || '',
    telefonoPrincipal: a.telefono_principal || '',
  };
}

function mapFacturaEditar(c) {
  const total = Number(c.total ?? 0);
  const pagado = Number(c.total_pagado ?? 0);
  return {
    id: c.id,
    numeroFactura: c.numero_factura,
    estado: c.estado,
    fechaEmision: fmtFecha(c.fecha_emision),
    fechaLimitePago: fmtFecha(c.fecha_limite_pago),
    lecturaAnterior: c.lectura_anterior,
    lecturaActual: c.lectura_actual,
    consumoM3: c.consumo_m3,
    valorM3: Number(c.valor_m3 ?? 0),
    valorConsumo: Number(c.valor_consumo ?? 0),
    cargoAdministracion: Number(c.cargo_administracion ?? 0),
    valoresAdicionales: Number(c.valores_adicionales ?? 0),
    totalMultas: Number(c.total_multas ?? 0),
    total,
    totalPagado: pagado,
    saldoPendiente: total - pagado,
  };
}

// ---------- INFORMES ----------

export async function cargarInformePeriodoHtml(mesContableId) {
  const { data: mes, error } = await supabase
    .from('meses_contables')
    .select('*, anio:anios_contables(anio)')
    .eq('id', mesContableId)
    .maybeSingle();
  if (error || !mes) throw new Error('Mes contable no encontrado.');
  const resumen = await resumenMensualCompleto(mesContableId, { inicio: mes.fecha_apertura, fin: mes.fecha_cierre });
  const inst = await obtenerInstitucional();
  return renderInformePeriodoHtml({
    informe: resumen,
    tipo: 'Mensual',
    periodo: `${mes.nombre_mes || nombreMes(mes.mes)} ${mes.anio?.anio ?? ''}`,
    config: inst.config,
    inst,
  });
}

export async function cargarInformeAnualHtml(anioId) {
  const { data: anio, error } = await supabase.from('anios_contables').select('anio').eq('id', anioId).maybeSingle();
  if (error || !anio) throw new Error('Año contable no encontrado.');
  const resumen = await resumenAnualCompleto(anioId);
  const inst = await obtenerInstitucional();
  return renderInformeAnualHtml({ informe: resumen, tipo: 'Anual', periodo: `Año ${anio.anio}`, config: inst.config, inst });
}

export async function cargarInformeAsociadoHtml(asociadoId) {
  const [{ data: asociado }, { data: facturas }, { data: recibos }, { data: multas }] = await Promise.all([
    supabase.from('asociados').select('*').eq('id', asociadoId).maybeSingle(),
    supabase.from('facturas').select('numero_factura, fecha_emision, estado, total, total_pagado').eq('asociado_id', asociadoId).order('fecha_emision', { ascending: false }),
    supabase.from('recibos').select('numero_recibo, valor, created_at, factura:facturas(numero_factura), pago:pagos(metodo_pago)').eq('asociado_id', asociadoId).order('created_at', { ascending: false }).limit(500),
    supabase.from('multas').select('motivo, fecha, estado, valor').eq('asociado_id', asociadoId).order('fecha', { ascending: false }).limit(500),
  ]);
  if (!asociado) throw new Error('Asociado no encontrado.');
  const { data: medidor } = await supabase.from('medidores').select('numero, estado').eq('asociado_id', asociadoId).maybeSingle();

  const esPend = (e) => e === 'PENDIENTE' || e === 'PAGADA_PARCIAL' || e === 'VENCIDA';
  const facturado = (facturas || []).reduce((s, f) => s + Number(f.total), 0);
  const pagado = (facturas || []).reduce((s, f) => s + Number(f.total_pagado ?? 0), 0);
  const valorMultas = (multas || []).filter((m) => m.estado !== 'ANULADA').reduce((s, m) => s + Number(m.valor), 0);
  const pct = (v) => (Number(v ?? 0) > 0 ? esc(fmtMoneda(v)) : esc(fmtMoneda(0)));
  void pct;
  const resumen = {
    facturasGeneradas: (facturas || []).length,
    facturasPagadas: (facturas || []).filter((f) => f.estado === 'PAGADA').length,
    facturasPendientes: (facturas || []).filter((f) => f.estado === 'PENDIENTE' || f.estado === 'PAGADA_PARCIAL').length,
    facturasVencidas: (facturas || []).filter((f) => f.estado === 'VENCIDA').length,
    totalFacturado: facturado,
    totalPagado: pagado,
    saldoPendiente: facturado - pagado,
    numeroMultas: (multas || []).filter((m) => m.estado === 'PENDIENTE').length,
    totalMultas: valorMultas,
    facturas: (facturas || []).map((f) => ({
      numeroFactura: f.numero_factura,
      fechaEmision: fmtFecha(f.fecha_emision),
      estado: f.estado,
      total: Number(f.total),
      saldoPendiente: Number(f.total) - Number(f.total_pagado ?? 0),
    })),
    pagos: (recibos || []).map((r) => ({
      numeroRecibo: r.numero_recibo,
      numeroFactura: r.factura?.numero_factura || '',
      fecha: fmtFechaHora(r.created_at),
      metodoPago: r.pago?.metodo_pago || '',
      valor: Number(r.valor),
    })),
    multas: (multas || []).map((m) => ({
      motivo: m.motivo, fecha: fmtFecha(m.fecha), estado: m.estado, valor: Number(m.valor),
    })),
  };
  const inst = await obtenerInstitucional();
  return renderInformeAsociadoHtml({
    asociado: {
      codigoInterno: asociado.codigo_interno || '',
      tipoDocumento: asociado.tipo_documento || '',
      documento: asociado.documento || '',
      nombres: asociado.nombres || '',
      apellidos: asociado.apellidos || '',
      direccion: asociado.direccion || '',
      telefonoPrincipal: asociado.telefono_principal || '',
      correo: asociado.correo || '',
      numeroMedidor: medidor?.numero || '',
      fechaIngreso: fmtFecha(asociado.fecha_afiliacion),
      estadoServicio: asociado.estado_servicio || '',
    },
    resumen,
    config: inst.config,
    inst,
  });
}

export async function cargarListadoAsociadosHtml() {
  const [{ data: asociados }, pendPrefs, { data: cuentas }, inst] = await Promise.all([
    supabase.from('asociados').select('*').eq('archivado', false).order('apellidos', { ascending: true }),
    supabase.from('facturas').select('asociado_id, total, total_pagado').in('estado', ['PENDIENTE', 'PAGADA_PARCIAL', 'VENCIDA']),
    supabase.from('profiles').select('asociado_id').not('asociado_id', 'is', null),
    obtenerInstitucional(),
  ]);
  const conCuenta = new Set((cuentas || []).map((p) => p.asociado_id));
  const pendientes = pendPrefs?.data ?? [];
  const saldos = {};
  pendientes.forEach((f) => {
    saldos[f.asociado_id] = (saldos[f.asociado_id] ?? 0) + (Number(f.total) - Number(f.total_pagado ?? 0));
  });
  const { data: medidores } = await supabase.from('medidores').select('asociado_id, numero, estado');
  const medsPorAsoc = {};
  (medidores || []).forEach((m) => {
    if (!medsPorAsoc[m.asociado_id]) medsPorAsoc[m.asociado_id] = m;
  });
  if (!asociados?.length) throw new Error('No hay asociados.');
  return renderListadoAsociadosHtml({
    config: inst.config,
    asociados: asociados.map((a) => ({
      codigoInterno: a.codigo_interno,
      documento: a.documento,
      tipoDocumento: a.tipo_documento,
      nombres: a.nombres,
      apellidos: a.apellidos,
      direccion: a.direccion,
      correo: a.correo,
      telefonoPrincipal: a.telefono_principal,
      fechaIngreso: fmtFecha(a.fecha_afiliacion),
      numeroMedidor: medsPorAsoc[a.id]?.numero || '',
      estadoMedidor: medsPorAsoc[a.id]?.estado || '',
      tieneCuenta: conCuenta.has(a.id),
      estadoServicio: a.estado_servicio,
      saldo: saldos[a.id] ?? 0,
    })),
    inst,
  });
}

async function resumenMensualCompleto(mesContableId, { inicio, fin } = {}) {
  const qMultas = supabase.from('multas').select('valor');
  if (inicio) qMultas.gte('fecha', inicio);
  if (fin) qMultas.lte('fecha', fin);
  const [{ data: facs }, { data: movs }, { data: lects }, { data: asocs }, { data: multas }] = await Promise.all([
    supabase.from('facturas').select('numero_factura, fecha_emision, estado, total, total_pagado, asociados(nombres, apellidos)').eq('mes_contable_id', mesContableId),
    supabase.from('movimientos_tesoreria').select('numero, tipo, concepto, fecha, valor').eq('mes_contable_id', mesContableId).eq('anulado', false),
    supabase.from('lecturas').select('consumo_m3').eq('mes_contable_id', mesContableId).eq('anulada', false),
    supabase.from('asociados').select('estado_servicio').eq('archivado', false),
    qMultas.eq('estado', 'PENDIENTE'),
  ]);
  const esPend = (e) => e === 'PENDIENTE' || e === 'PAGADA_PARCIAL';
  const ingresos = (movs || []).filter((m) => m.tipo === 'ENTRADA').reduce((s, m) => s + Number(m.valor), 0);
  const gastos = (movs || []).filter((m) => m.tipo === 'SALIDA').reduce((s, m) => s + Number(m.valor), 0);
  const consumo = (lects || []).reduce((s, l) => s + Number(l.consumo_m3 || 0), 0);
  return {
    totalIngresos: ingresos,
    totalGastos: gastos,
    balance: ingresos - gastos,
    totalMultas: (multas || []).reduce((s, m) => s + Number(m.valor), 0),
    numeroMultas: (multas || []).length,
    facturasGeneradas: (facs || []).length,
    facturasPagadas: (facs || []).filter((x) => x.estado === 'PAGADA').length,
    facturasPendientes: (facs || []).filter((x) => esPend(x.estado)).length,
    facturasVencidas: (facs || []).filter((x) => x.estado === 'VENCIDA').length,
    totalFacturado: (facs || []).reduce((s, x) => s + Number(x.total), 0),
    totalRecaudado: (facs || []).reduce((s, x) => s + Number(x.total_pagado ?? 0), 0),
    totalM3Consumidos: consumo,
    promedioConsumoM3: lects?.length ? consumo / lects.length : 0,
    asociadosActivos: (asocs || []).filter((a) => a.estado_servicio === 'ACTIVO').length,
    asociadosSuspendidos: (asocs || []).filter((a) => a.estado_servicio !== 'ACTIVO').length,
    facturas: (facs || []).map((f) => ({
      numeroFactura: f.numero_factura,
      asociadoNombre: `${f.asociados?.nombres ?? ''} ${f.asociados?.apellidos ?? ''}`.trim(),
      fechaEmision: fmtFecha(f.fecha_emision),
      estado: f.estado,
      total: Number(f.total ?? 0),
    })),
    movimientos: (movs || []).map((m) => ({
      numero: m.numero, tipo: m.tipo, concepto: m.concepto, fecha: fmtFecha(m.fecha), valor: Number(m.valor ?? 0),
    })),
  };
}

async function resumenAnualCompleto(anioId) {
  const { data: meses } = await supabase.from('meses_contables').select('id').eq('anio_id', anioId);
  const ids = (meses || []).map((m) => m.id);
  if (!ids.length) return resumenVacio();
  const [{ data: facs }, { data: movs }, { data: lects }, { data: asocs }, { data: multas }] = await Promise.all([
    supabase.from('facturas').select('numero_factura, fecha_emision, estado, total, total_pagado, asociados(nombres, apellidos)').in('mes_contable_id', ids),
    supabase.from('movimientos_tesoreria').select('numero, tipo, concepto, fecha, valor').in('mes_contable_id', ids).eq('anulado', false),
    supabase.from('lecturas').select('consumo_m3').in('mes_contable_id', ids).eq('anulada', false),
    supabase.from('asociados').select('estado_servicio').eq('archivado', false),
    supabase.from('multas').select('valor').eq('estado', 'PENDIENTE'),
  ]);
  const esPend = (e) => e === 'PENDIENTE' || e === 'PAGADA_PARCIAL';
  const ingresos = (movs || []).filter((m) => m.tipo === 'ENTRADA').reduce((s, m) => s + Number(m.valor), 0);
  const gastos = (movs || []).filter((m) => m.tipo === 'SALIDA').reduce((s, m) => s + Number(m.valor), 0);
  const consumo = (lects || []).reduce((s, l) => s + Number(l.consumo_m3 || 0), 0);
  return {
    totalIngresos: ingresos,
    totalGastos: gastos,
    balance: ingresos - gastos,
    totalMultas: (multas || []).reduce((s, m) => s + Number(m.valor), 0),
    numeroMultas: (multas || []).length,
    facturasGeneradas: (facs || []).length,
    facturasPagadas: (facs || []).filter((x) => x.estado === 'PAGADA').length,
    facturasPendientes: (facs || []).filter((x) => esPend(x.estado)).length,
    facturasVencidas: (facs || []).filter((x) => x.estado === 'VENCIDA').length,
    totalFacturado: (facs || []).reduce((s, x) => s + Number(x.total), 0),
    totalRecaudado: (facs || []).reduce((s, x) => s + Number(x.total_pagado ?? 0), 0),
    totalM3Consumidos: consumo,
    promedioConsumoM3: lects?.length ? consumo / lects.length : 0,
    asociadosActivos: (asocs || []).filter((a) => a.estado_servicio === 'ACTIVO').length,
    asociadosSuspendidos: (asocs || []).filter((a) => a.estado_servicio !== 'ACTIVO').length,
    facturas: (facs || []).slice(0, 120).map((f) => ({
      numeroFactura: f.numero_factura,
      asociadoNombre: `${f.asociados?.nombres ?? ''} ${f.asociados?.apellidos ?? ''}`.trim(),
      fechaEmision: fmtFecha(f.fecha_emision),
      estado: f.estado,
      total: Number(f.total ?? 0),
    })),
    movimientos: (movs || []).slice(0, 120).map((m) => ({
      numero: m.numero, tipo: m.tipo, concepto: m.concepto, fecha: fmtFecha(m.fecha), valor: Number(m.valor ?? 0),
    })),
  };
}

function resumenVacio() {
  return {
    totalIngresos: 0, totalGastos: 0, balance: 0, totalMultas: 0, numeroMultas: 0,
    facturasGeneradas: 0, facturasPagadas: 0, facturasPendientes: 0, facturasVencidas: 0,
    totalFacturado: 0, totalRecaudado: 0, totalM3Consumidos: 0, promedioConsumoM3: 0,
    asociadosActivos: 0,     asociadosSuspendidos: 0, facturas: [], movimientos: [],
  };
}

