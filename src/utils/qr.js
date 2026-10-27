import QRCode from 'qrcode';

// Genera QR lado cliente (sustituye QrCodeService del backend).
// Devuelve dataURL PNG para mostrar/guardar en codigo_qr.
export async function generarQRDataURL(texto) {
  try {
    return await QRCode.toDataURL(texto, { width: 256, margin: 1 });
  } catch {
    return null;
  }
}

// URL pública de consulta: la app resuelve /factura/:numero y /recibo/:numero
export function qrTextoFactura(numeroFactura) {
  return `${window.location.origin}/factura/${numeroFactura}`;
}

export function qrTextoRecibo(numeroRecibo) {
  return `${window.location.origin}/recibo/${numeroRecibo}`;
}

export function qrTextoEncuesta(codigo) {
  return `${window.location.origin}/encuestas?codigo=${codigo}`;
}
