import { supabase } from '../lib/supabaseClient';
import { PeriodosAPI } from './periodos';
import {
  cargarInformePeriodoHtml, cargarInformeAnualHtml,
  cargarInformeAsociadoHtml, cargarListadoAsociadosHtml,
  abrirDocumentoHtml,
} from '../utils/documentos';

// Módulo 16 — Informes SUPABASE-ONLY: planillas PDF originales vía impresión del HTML.
export const InformesAPI = {
  periodoMes: (mesId) => PeriodosAPI.resumenMes(mesId),
  periodoMesHtml: (mesId) => cargarInformePeriodoHtml(mesId),
  periodoMesPdf: async (mesId) => {
    const html = await cargarInformePeriodoHtml(mesId);
    abrirDocumentoHtml(html, { autoPrint: true });
    return { ok: true };
  },

  periodoAnio: async (anioId) => {
    const { data: meses } = await supabase.from('meses_contables').select('id').eq('anio_id', anioId);
    const ids = (meses || []).map((m) => m.id);
    if (!ids.length) return { meses: [], totalFacturado: 0, totalIngresos: 0, totalGastos: 0, balance: 0, totalM3Consumidos: 0 };
    const [{ data: movs }, { data: lects }, { data: facs }] = await Promise.all([
      supabase.from('movimientos_tesoreria').select('tipo, valor').in('mes_contable_id', ids).eq('anulado', false),
      supabase.from('lecturas').select('consumo_m3').in('mes_contable_id', ids).eq('anulada', false),
      supabase.from('facturas').select('total').in('mes_contable_id', ids),
    ]);
    const totalIngresos = (movs || []).filter((m) => m.tipo === 'ENTRADA').reduce((s, m) => s + Number(m.valor), 0);
    const totalGastos = (movs || []).filter((m) => m.tipo === 'SALIDA').reduce((s, m) => s + Number(m.valor), 0);
    const totalM3Consumidos = (lects || []).reduce((s, l) => s + Number(l.consumo_m3 || 0), 0);
    return {
      meses: ids,
      totalFacturado: (facs || []).reduce((s, f) => s + Number(f.total), 0),
      totalIngresos, totalGastos, balance: totalIngresos - totalGastos, totalM3Consumidos,
    };
  },
  periodoAnioHtml: (anioId) => cargarInformeAnualHtml(anioId),
  periodoAnioPdf: async (anioId) => {
    const html = await cargarInformeAnualHtml(anioId);
    abrirDocumentoHtml(html, { autoPrint: true });
    return { ok: true };
  },

  asociado: async (asociadoId) => {
    const { data: resumen } = await supabase.rpc('resumen_financiero', { p_asociado_id: asociadoId });
    const { data: asoc } = await supabase.from('asociados').select('*').eq('id', asociadoId).single();
    return { asociado: asoc, resumen };
  },
  asociadoHtml: (asociadoId) => cargarInformeAsociadoHtml(asociadoId),
  asociadoPdf: async (asociadoId) => {
    const html = await cargarInformeAsociadoHtml(asociadoId);
    abrirDocumentoHtml(html, { autoPrint: true });
    return { ok: true };
  },

  listadoAsociados: async () => {
    const { data, error } = await supabase.from('asociados').select('*').eq('archivado', false).order('apellidos');
    if (error) throw new Error(error.message);
    return { total: data?.length || 0, asociados: data };
  },
  listadoAsociadosHtml: () => cargarListadoAsociadosHtml(),
  listadoAsociadosPdf: async () => {
    const html = await cargarListadoAsociadosHtml();
    abrirDocumentoHtml(html, { autoPrint: true });
    return { ok: true };
  },
};
