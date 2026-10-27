import { supabase } from '../lib/supabaseClient';
import { PeriodosAPI } from './periodos';
import { TesoreriaAPI } from './tesoreria';
import { DeudasAPI } from './deudas';

// Datos del Panel operativo (ADMIN/TESORERO): compone APIs existentes
// en paralelo. Todo best-effort: si algo falla, ese bloque queda en
// null y la UI muestra un estado vacío en vez de romper el panel.
export const PanelAPI = {
  cargar: async () => {
    const anios = await PeriodosAPI.listarAnios();
    const anio = anios[0] || null;
    const meses = anio ? await PeriodosAPI.listarMeses(anio.id) : [];
    const mesAbierto = meses.find((m) => m.estado !== 'CERRADO') || null;

    const [caja, cartera, movimientosRecientes] = await Promise.all([
      TesoreriaAPI.cajaDiaria().catch(() => null),
      DeudasAPI.obtenerCartera().catch(() => null),
      TesoreriaAPI.listarMovimientos().then((m) => m.slice(0, 8)).catch(() => []),
    ]);

    if (!mesAbierto) {
      return {
        anios, meses, mesAbierto: null,
        resumen: null, lecturasPendientes: null, medidoresActivos: null,
        caja, cartera, movimientosRecientes,
      };
    }

    const [resumen, lecturasPendientes, medidoresActivos] = await Promise.all([
      PeriodosAPI.resumenMes(mesAbierto.id).catch(() => null),
      supabase.from('lecturas').select('id', { count: 'exact', head: true })
        .eq('mes_contable_id', mesAbierto.id).eq('factura_generada', false).eq('anulada', false)
        .then((r) => r.count || 0).catch(() => null),
      supabase.from('medidores').select('id', { count: 'exact', head: true })
        .eq('estado', 'ACTIVO')
        .then((r) => r.count || 0).catch(() => null),
    ]);

    return {
      anios, meses, mesAbierto, resumen,
      lecturasPendientes, medidoresActivos,
      caja, cartera, movimientosRecientes,
    };
  },
};
