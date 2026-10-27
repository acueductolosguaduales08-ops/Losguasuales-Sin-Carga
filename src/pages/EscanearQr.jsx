import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, CheckCircle2, FileText, Receipt, ClipboardList, Wallet2 } from 'lucide-react';
import Header from '../components/layout/Header';
import { HomeAPI } from '../api/home';
import { useToast } from '../context/ToastContext';

// Los QR generados por el backend apuntan a {baseUrl}/factura/{numero}, /recibo/{numero} o /encuestas?codigo={codigo}.
function interpretarUrlQr(texto) {
  try {
    const url = new URL(texto);
    if (url.pathname === '/encuestas' && url.searchParams.has('codigo')) {
      return { tipo: 'formulario', valor: decodeURIComponent(url.searchParams.get('codigo')) };
    }

    const partes = texto.split('/').filter(Boolean);
    const idx = partes.findIndex((p) => ['factura', 'recibo', 'formulario'].includes(p));
    if (idx === -1 || !partes[idx + 1]) return null;
    return { tipo: partes[idx], valor: decodeURIComponent(partes[idx + 1]) };
  } catch {
    try {
      const partes = texto.split('/').filter(Boolean);
      const idx = partes.findIndex((p) => ['factura', 'recibo', 'formulario'].includes(p));
      if (idx === -1 || !partes[idx + 1]) return null;
      return { tipo: partes[idx], valor: decodeURIComponent(partes[idx + 1]) };
    } catch {
      return null;
    }
  }
}

const TIPO_ICON = { factura: FileText, recibo: Receipt, formulario: ClipboardList };
const TIPO_LABEL = { factura: 'factura', recibo: 'recibo', formulario: 'formulario' };

export default function EscanearQr() {
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const scannerRef = useRef(null);
  const escaneandoRef = useRef(false);
  const cameraRef = useRef('environment');
  const navigate = useNavigate();
  const { success } = useToast();
  const [searchParams] = useSearchParams();
  // origin=tesoreria: llegamos desde el botón "Escanear QR" de Tesorería,
  // así que una factura escaneada nos lleva directo a registrar el pago.
  const origin = searchParams.get('origin');

  const detenerScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        /* ya estaba detenido */
      }
    }
  };

  const iniciarEscaner = async (facingMode) => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }
      escaneandoRef.current = true;
      setResultado(null);
      setDetalle(null);
      setPermisoDenegado(false);

      await scannerRef.current.start(
        { facingMode },
        { fps: 10, qrbox: { width: 240, height: 240 }, disableFlip: true },
        onScanSuccess,
        () => {}
      );
    } catch {
      setPermisoDenegado(true);
    }
  };

  const onScanSuccess = async (decodedText) => {
    if (!escaneandoRef.current) return;
    escaneandoRef.current = false;
    await detenerScanner();
    navigator.vibrate?.(80);

    const interpretado = interpretarUrlQr(decodedText) || { tipo: 'factura', valor: decodedText.trim() };
    setResultado(interpretado);

    setCargandoDetalle(true);
    try {
      if (interpretado.tipo === 'factura') {
        const data = await HomeAPI.consultarFactura(interpretado.valor);
        setDetalle(data);
      } else if (interpretado.tipo === 'recibo') {
        const data = await HomeAPI.consultarRecibo(interpretado.valor);
        setDetalle(data);
      }
    } catch {
      // Si la consulta falla, igual mostramos el código detectado con acción manual.
    } finally {
      setCargandoDetalle(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => iniciarEscaner(cameraRef.current), 300);
    return () => {
      clearTimeout(timer);
      detenerScanner();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlip = async () => {
    cameraRef.current = cameraRef.current === 'environment' ? 'user' : 'environment';
    await detenerScanner();
    iniciarEscaner(cameraRef.current);
  };

  const handleReintentar = () => iniciarEscaner(cameraRef.current);

  // Si venimos de Tesorería y el QR es de una factura, saltamos directo al
  // modal de "Registrar pago" con esa factura precargada.
  const pagoDirecto = origin === 'tesoreria' && resultado?.tipo === 'factura' && Boolean(detalle?.id);

  const irAResultado = () => {
    if (!resultado) return;
    if (resultado.tipo === 'formulario') {
      navigate(`/encuestas?codigo=${encodeURIComponent(resultado.valor)}`);
      return;
    }
    if (pagoDirecto) {
      navigate(`/tesoreria?facturaId=${detalle.id}`);
      return;
    }
    navigate(`/?${resultado.tipo}=${encodeURIComponent(resultado.valor)}#consulta`);
    success("QR escaneado.", "Código reconocido, redirigiendo...");
  };

  const Icon = pagoDirecto ? Wallet2 : resultado ? TIPO_ICON[resultado.tipo] || FileText : FileText;

  return (
    <div className="bg-gray-950 text-white min-h-screen font-sans antialiased">
      <Header />

      <main className="max-w-3xl mx-auto px-4 pt-24 pb-10 flex flex-col items-center">
        <button
          onClick={() => navigate(-1)}
          className="self-start flex items-center gap-1.5 text-sm font-bold text-white/70 hover:text-white mb-4 -mt-2"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <p className="text-center text-sm text-white/60 mb-6 max-w-sm">
          Apunta la cámara al código QR impreso en tu factura, recibo o formulario.
        </p>

        <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-black shadow-2xl qr-scanner-container">
          <div id="qr-reader" className="w-full h-full" />
          {!permisoDenegado && !resultado && (
            <div className="pointer-events-none absolute inset-6 border-2 border-white/70 rounded-2xl" />
          )}
        </div>

        <button
          onClick={handleFlip}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Cambiar cámara
        </button>

        {permisoDenegado && (
          <div className="mt-6 text-center max-w-sm">
            <p className="text-sm text-white/70 mb-3">
              No pudimos acceder a tu cámara. Verifica los permisos del navegador o ingresa el número manualmente.
            </p>
            <button
              onClick={() => navigate('/#consulta')}
              className="inline-block px-5 py-3 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl transition-colors text-sm"
            >
              Ir a consulta manual
            </button>
          </div>
        )}

        {resultado && (
          <div className="mt-6 w-full max-w-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl shadow-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="font-bold">Código detectado</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{resultado.valor}</p>
              </div>
            </div>

            {cargandoDetalle && (
              <div className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse mb-2" />
            )}

            {!cargandoDetalle && detalle && (
              <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                  <span className="font-semibold">{detalle.estado}</span>
                </div>
                {detalle.valor != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Valor pagado:</span>
                    <span className="font-semibold">{formatCOP(detalle.valor)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={irAResultado}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl transition-colors"
              >
                <Icon className="w-4 h-4" />
                {pagoDirecto ? 'Registrar pago' : `Ver ${TIPO_LABEL[resultado.tipo] || resultado.tipo}`}
              </button>
            </div>
          </div>
        )}

        {resultado && (
          <button
            onClick={handleReintentar}
            className="mt-4 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors text-sm"
          >
            Escanear otro código
          </button>
        )}
      </main>
    </div>
  );
}
