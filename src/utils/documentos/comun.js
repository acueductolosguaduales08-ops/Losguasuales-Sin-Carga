// Helpers compartidos por todas las planillas originales (portadas del backend Java/Thymeleaf).
import { supabase } from '../../lib/supabaseClient';
import { generarQRDataURL, qrTextoFactura, qrTextoRecibo } from '../qr';

// ---------- escape / formatos ----------

export function esc(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Igual al FormatoMonedaUtil del backend: $1.250.000 (es-CO, sin decimales si son .00)
export function fmtMoneda(v) {
  const n = Number(v ?? 0);
  const sinDec = Math.abs(n % 1) < 0.005;
  const s = n.toLocaleString('es-CO', {
    minimumFractionDigits: sinDec ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `$${s}`;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function fmtFecha(iso) {
  if (!iso) return '';
  const d = iso instanceof Date ? iso : new Date(String(iso).length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function fmtFechaHora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${fmtFecha(d)} ${h}:${m}`;
}

export function nombreMes(numero) {
  return MESES[(Number(numero) || 1) - 1] || '';
}

export function decimal1(v) {
  const n = Number(v ?? 0);
  return n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// El backend Java formateaba MULTA-000001 con ids Long. Ahora los ids son UUID:
// derivamos un número de 6 dígitos determinista para que el comprobante tenga
// un código legible y estable para el mismo registro de multa.
export function numeroMulta(id) {
  if (typeof id === 'number') return `MULTA-${String(id).padStart(6, '0')}`;
  const s = String(id ?? '').replace(/-/g, '');
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) % 1000000;
  }
  return `MULTA-${String(h % 1000000).padStart(6, '0')}`;
}

export function hashDoc6(id) {
  const s = String(id ?? '').replace(/[^a-z0-9]/gi, '');
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) % 1000000;
  }
  return h % 1000000;
}

// ---------- institutional (logo/firma/sello como data-URL) ----------

let _instCache = null;

async function urlADataURL(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) return url;
    const blob = await res.blob();
    if (blob.size > 900000) return url; // imágenes muy pesadas: mejor dejar la URL
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => resolve(url);
      fr.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

export async function obtenerInstitucional() {
  if (_instCache) return _instCache;
  const { data } = await supabase.from('configuracion').select('*').eq('id', 1).single();
  const conf = {
    nombreAcueducto: data?.nombre_acueducto || 'Acueducto Los Guaduales',
    nit: data?.nit || '',
    direccion: data?.direccion || '',
    telefonoPrincipal: data?.telefono_principal || '',
    correo: data?.correo || '',
    municipio: data?.municipio || '',
    banco: data?.banco || '',
    tipoCuenta: data?.tipo_cuenta || '',
    numeroCuenta: data?.numero_cuenta || '',
    titularCuenta: data?.titular_cuenta || '',
    notasFactura: data?.notas_factura || '',
  };
  const [logoSrc, firmaSrc, selloSrc] = await Promise.all([
    urlADataURL(data?.logo_activo ?? null),
    urlADataURL(data?.firma_activa ?? null),
    urlADataURL(data?.sello_activo ?? null),
  ]);
  _instCache = { config: conf, logoSrc, firmaSrc, selloSrc };
  return _instCache;
}

// ---------- apertura de documentos ----------

const AUTO_PRINT_SNIPPET = `
<script>
  window.addEventListener('load', function () {
    setTimeout(function () { try { window.focus(); window.print(); } catch (e) {} }, 350);
  });
<\/script>`;

// Abre el HTML de la planilla en pestaña nueva. autoPrint:true dispara el
// diálogo del navegador (Guardar como PDF) — así queda el PDF con el
// diseño original (ondas, logo, firma, sello) tal como se imprimía antes.
export function abrirDocumentoHtml(html, { autoPrint = false, preparando } = {}) {
  const ventana = window.open('', '_blank');
  if (!ventana) {
    if (preparando) preparando();
    return false;
  }
  const final = autoPrint ? html.replace('</body>', `${AUTO_PRINT_SNIPPET}</body>`) : html;
  ventana.document.open();
  ventana.document.write(final);
  ventana.document.close();
  return true;
}

// ---------- QR ----------
// Genera el QR de la factura/recibo (dataURL) y guarda copia en codigo_qr
// si la columna estaba vacía (mejor esfuerzo: si RLS lo bloquea, se ignora).

export async function qrConPersistencia(tipo, { id, numero, texto }) {
  const urlTexto = texto || (tipo === 'FACTURA' ? qrTextoFactura(numero) : qrTextoRecibo(numero));
  const dataUrl = await generarQRDataURL(urlTexto);
  if (!dataUrl) return null;
  if (id && numero) {
    const tabla = tipo === 'FACTURA' ? 'facturas' : 'recibos';
    const columna = tipo === 'FACTURA' ? 'numero_factura' : 'numero_recibo';
    supabase
      .from(tabla)
      .update({ codigo_qr: dataUrl })
      .eq('id', id)
      .eq(columna, numero)
      .then((r) => {
        void r;
      })
      .catch(() => {});
  }
  return dataUrl;
}
