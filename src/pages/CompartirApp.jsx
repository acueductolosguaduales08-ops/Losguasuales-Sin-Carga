import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Share2, Copy, Check, MessageCircle, Download } from 'lucide-react';
import Header from '../components/layout/Header';
import { useToast } from '../context/ToastContext';

// Página pública (sin necesidad de sesión) para compartir la app: enlace
// directo, código QR descargable y botón de WhatsApp con mensaje prellenado.
// La URL se toma de window.location.origin, así funciona igual en local,
// en el dominio de preview de Cloudflare y en el dominio de producción sin
// tener que hardcodear ninguna dirección.
export default function CompartirApp() {
  const { success, error, info } = useToast();
  const [copiado, setCopiado] = useState(false);
  const canvasRef = useRef(null);
  const [qrListo, setQrListo] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const mensajeWhatsapp = `¡Hola! Te comparto la app del Acueducto Los Guaduales, ahí puedes ver tus facturas, hacer reportes y estar al tanto de las novedades: ${url}`;
  const urlWhatsapp = `https://wa.me/?text=${encodeURIComponent(mensajeWhatsapp)}`;

  useEffect(() => {
    if (!url || !canvasRef.current) return;
    setQrListo(false);
    QRCode.toCanvas(canvasRef.current, url, {
      width: 240,
      margin: 1,
      color: { dark: '#1e293b', light: '#ffffff' },
    })
      .then(() => setQrListo(true))
      .catch(() => error("Error al generar QR.", "Recarga la página o usa el enlace directo."));
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      success("Enlace copiado.", "Pega el enlace donde quieras compartirlo.");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      error("Error al copiar enlace.", "Copia manualmente el enlace desde el campo de texto.");
    }
  };

  const handleDescargarQr = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'acueducto-los-guaduales-qr.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-lg mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <section className="flex items-center gap-2 mb-6">
          <Share2 className="w-6 h-6 text-brand shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Compartir la app</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Invita a otros asociados a usar la app del acueducto
            </p>
          </div>
        </section>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-6 flex flex-col items-center gap-5">
          {/* Código QR */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <canvas ref={canvasRef} className={qrListo ? '' : 'opacity-0'} />
          </div>

          <button
            type="button"
            onClick={handleDescargarQr}
            disabled={!qrListo}
            className="flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Descargar código QR
          </button>

          {/* Enlace directo */}
          <div className="w-full">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 text-center">
              O comparte este enlace
            </label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-3 py-2.5">
              <span className="flex-1 min-w-0 text-sm text-gray-700 dark:text-gray-300 truncate">{url}</span>
              <button
                type="button"
                onClick={handleCopiar}
                aria-label="Copiar enlace"
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-300 hover:text-brand hover:border-brand transition-colors"
              >
                {copiado ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón de WhatsApp */}
          <a
            href={urlWhatsapp}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/20"
          >
            <MessageCircle className="w-5 h-5" /> Compartir por WhatsApp
          </a>
        </div>
      </main>
    </div>
  );
}
