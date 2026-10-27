import { supabase } from '../lib/supabaseClient';

// Módulo 05 — Períodos SUPABASE-ONLY.
// Mapea snake_case -> camelCase exacto que espera la UI.

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function mapAnio(a) {
  if (!a) return null;
  return { id: a.id, anio: a.anio, estado: a.estado };
}

function mapMes(m, anioValor = null) {
  if (!m) return null;
  return {
    id: m.id,
    anioId: m.anio_id,
    anio: anioValor ?? m.anios_contables?.anio ?? null,
    numeroMes: m.mes,
    nombreMes: m.nombre_mes,
    estado: m.estado,
    fechaApertura: m.fecha_apertura,
    fechaCierre: m.fecha_cierre || null,
    motivoReapertura: m.motivo_reapertura || null,
  };
}

export const PeriodosAPI = {
  listarAnios: async () => {
    const { data, error } = await supabase.from('anios_contables').select('*').order('anio', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapAnio);
  },

  crearAnio: async (anio) => {
    const y = typeof anio === 'object' ? anio.anio : anio;
    const { data, error } = await supabase.from('anios_contables').insert({ anio: Number(y) }).select().single();
    if (error) throw new Error(error.message);
    return mapAnio(data);
  },

  listarMeses: async (anioId) => {
    const [{ data: anio }, res] = await Promise.all([
      supabase.from('anios_contables').select('anio').eq('id', anioId).single(),
      supabase.from('meses_contables').select('*').eq('anio_id', anioId).order('mes'),
    ]);
    if (res.error) throw new Error(res.error.message);
    return (res.data || []).map((m) => mapMes(m, anio?.anio ?? null));
  },

  crearMes: async (anioContableId, numeroMes) => {
    const anioId = typeof anioContableId === 'object' ? anioContableId.anioContableId : anioContableId;
    const num = typeof anioContableId === 'object' ? anioContableId.numeroMes : numeroMes;
    const { data, error } = await supabase.from('meses_contables').insert({
      anio_id: anioId,
      mes: Number(num),
      nombre_mes: MESES[Number(num) - 1] || `Mes ${num}`,
      estado: 'ABIERTO',
    }).select().single();
    if (error) throw new Error(error.message);
    const { data: anio } = await supabase.from('anios_contables').select('anio').eq('id', anioId).single();
    return mapMes(data, anio?.anio ?? null);
  },

  cerrarMes: async (mesId) => {
    const { count } = await supabase.from('lecturas').select('id', { count: 'exact', head: true }).eq('mes_contable_id', mesId).eq('factura_generada', false).eq('anulada', false);
    if ((count || 0) > 0) throw new Error(`No se puede cerrar: hay ${count} lectura(s) sin facturar.`);
    const { data, error } = await supabase.from('meses_contables').update({ estado: 'CERRADO', fecha_cierre: new Date().toISOString().slice(0, 10) }).eq('id', mesId).select('*, anios_contables(anio)').single();
    if (error) throw new Error(error.message);
    return mapMes(data);
  },

  reabrirMes: async (mesId, motivo) => {
    const { data, error } = await supabase.from('meses_contables').update({ estado: 'REABIERTO', motivo_reapertura: motivo || null }).eq('id', mesId).select('*, anios_contables(anio)').single();
    if (error) throw new Error(error.message);
    return mapMes(data);
  },

  resumenMes: async (mesId) => {
    const [{ data: facs }, { data: movs }, { data: lects }, { data: asocs }] = await Promise.all([
      supabase.from('facturas').select('estado, total, total_pagado').eq('mes_contable_id', mesId),
      supabase.from('movimientos_tesoreria').select('tipo, valor').eq('mes_contable_id', mesId).eq('anulado', false),
      supabase.from('lecturas').select('consumo_m3').eq('mes_contable_id', mesId).eq('anulada', false),
      supabase.from('asociados').select('estado_servicio').eq('archivado', false),
    ]);
    const f = facs || [];
    const esPend = (e) => e === 'PENDIENTE' || e === 'PAGADA_PARCIAL';
    const facturasGeneradas = f.length;
    const facturasPagadas = f.filter((x) => x.estado === 'PAGADA').length;
    const facturasPendientes = f.filter((x) => esPend(x.estado)).length;
    const facturasVencidas = f.filter((x) => x.estado === 'VENCIDA').length;
    const totalIngresos = (movs || []).filter((m) => m.tipo === 'ENTRADA').reduce((s, m) => s + Number(m.valor), 0);
    const totalGastos = (movs || []).filter((m) => m.tipo === 'SALIDA').reduce((s, m) => s + Number(m.valor), 0);
    const consumo = (lects || []).reduce((s, l) => s + Number(l.consumo_m3 || 0), 0);
    return {
      facturasGeneradas, facturasPagadas, facturasPendientes, facturasVencidas,
      totalFacturado: f.reduce((s, x) => s + Number(x.total), 0),
      totalIngresos, totalGastos, balance: totalIngresos - totalGastos,
      totalM3Consumidos: consumo,
      promedioConsumo: lects?.length ? Math.round((consumo / lects.length) * 100) / 100 : 0,
      asociadosActivos: (asocs || []).filter((a) => a.estado_servicio === 'ACTIVO').length,
      asociadosSuspendidos: (asocs || []).filter((a) => a.estado_servicio !== 'ACTIVO').length,
    };
  },

  obtenerMes: async (mesId) => {
    const { data, error } = await supabase.from('meses_contables').select('*, anios_contables(anio)').eq('id', mesId).single();
    if (error) throw new Error('Mes no encontrado.');
    return mapMes(data);
  },

  // Agregado de movimientos de caja para varios meses en UNA sola
  // consulta (evita N llamadas al cargar la lista de meses de un año).
  // Devuelve { [mesId]: { entradas, salidas, balance, cantidad,
  // ultimaActividad } } con los movimientos no anulados.
  resumenMovimientosMeses: async (mesIds) => {
    const vacio = {};
    if (!mesIds?.length) return vacio;
    const { data, error } = await supabase
      .from('movimientos_tesoreria')
      .select('mes_contable_id, tipo, valor, fecha, created_at, anulado')
      .in('mes_contable_id', mesIds)
      .eq('anulado', false)
      .limit(10000);
    if (error) throw new Error(error.message);
    const mapa = {};
    for (const id of mesIds) {
      mapa[id] = { entradas: 0, salidas: 0, balance: 0, cantidad: 0, ultimaActividad: null };
    }
    for (const m of data || []) {
      const bucket = mapa[m.mes_contable_id];
      if (!bucket) continue;
      bucket.cantidad += 1;
      const valor = Number(m.valor || 0);
      if (m.tipo === 'ENTRADA') bucket.entradas += valor;
      else bucket.salidas += valor;
      const fecha = m.fecha || m.created_at;
      if (fecha && (!bucket.ultimaActividad || fecha > bucket.ultimaActividad)) {
        bucket.ultimaActividad = fecha;
      }
    }
    for (const id of mesIds) {
      mapa[id].balance = mapa[id].entradas - mapa[id].salidas;
    }
    return mapa;
  },
};

export const ESTADOS_MES = ['ABIERTO', 'CERRADO', 'REABIERTO'];
export const NOMBRES_MESES = MESES;
