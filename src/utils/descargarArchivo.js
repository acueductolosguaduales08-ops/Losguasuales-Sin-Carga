// Dispara la descarga de un archivo binario a partir de una Response de fetch
// (usada junto a llamadas con { raw: true } del cliente de API, ej. PDFs).
export async function descargarBlobDesdeResponse(response, nombreSugerido) {
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const nombre = match?.[1] || nombreSugerido || 'archivo.pdf';

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
