import { supabase } from '../lib/supabaseClient';

// Conciliación SUPABASE-ONLY: importa CSV simple (fecha,descripcion,valor,referencia)
// en vez de Excel del backend. El frontend ya trae xlsx, aquí aceptamos array también.
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const [fecha, descripcion, valor, referencia] = lines[i].split(/[,;]/).map((s) => (s || '').trim().replace(/^"|"$/g, ''));
    if (!fecha || !valor) continue;
    out.push({ fecha, descripcion: descripcion || 'Movimiento', valor: Number(valor), referencia: referencia || null });
  }
  return out;
}

export const ConciliacionAPI = {
  importarExtracto: async (formData) => {
    let rows = [];
    if (Array.isArray(formData)) rows = formData;
    else if (typeof formData === 'string') rows = parseCSV(formData);
    else if (formData instanceof FormData) {
      const file = formData.get('file') || formData.get('archivo');
      if (!file) throw new Error('Archivo requerido.');
      const text = await file.text();
      rows = text.includes(',') || text.includes(';') ? parseCSV(text) : [];
      if (!rows.length) throw new Error('Formato no reconocido. Usa CSV: fecha,descripcion,valor,referencia.');
    }
    const { data, error } = await supabase.from('movimientos_bancarios').insert(rows).select();
    if (error) throw new Error(error.message);
    return data;
  },
  listarPendientes: async () => {
    const { data, error } = await supabase.from('movimientos_bancarios').select('*').eq('estado', 'PENDIENTE').order('fecha', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },
  listarTodos: async () => {
    const { data, error } = await supabase.from('movimientos_bancarios').select('*').order('fecha', { ascending: false }).limit(300);
    if (error) throw new Error(error.message);
    return data;
  },
  conciliar: async (bancarioId, tesoreriaId) => {
    const { error } = await supabase.from('movimientos_bancarios').update({ estado: 'CONCILIADO', tesoreria_id: tesoreriaId }).eq('id', bancarioId);
    if (error) throw new Error(error.message);
    return true;
  },
  marcarSinCoincidencia: async (bancarioId) => {
    const { error } = await supabase.from('movimientos_bancarios').update({ estado: 'SIN_COINCIDENCIA' }).eq('id', bancarioId);
    if (error) throw new Error(error.message);
    return true;
  },
  resumen: async () => {
    const { data } = await supabase.from('movimientos_bancarios').select('estado, valor');
    const r = { pendientes: 0, conciliados: 0, sinCoincidencia: 0, total: 0 };
    for (const m of data || []) {
      r.total++;
      if (m.estado === 'PENDIENTE') r.pendientes++;
      if (m.estado === 'CONCILIADO') r.conciliados++;
      if (m.estado === 'SIN_COINCIDENCIA') r.sinCoincidencia++;
    }
    return r;
  },
};
