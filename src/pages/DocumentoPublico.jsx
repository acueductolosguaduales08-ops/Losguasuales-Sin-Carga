import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { HomeAPI } from '../api/home';
import {
  renderDocumentoPublicoDesdeRPC,
  renderFacturaDesdeFila,
  renderReciboDesdeFila,
  abrirDocumentoHtml,
} from '../utils/documentos';

export default function DocumentoPublico() {
  const { tipo: tipoRuta, numero } = useParams();
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError(null);
    setHtml(null);
    (async () => {
      const esFactura = tipoRuta?.toLowerCase().includes('factura');
      try {
        let docHtml = null;
        // Numeros de documento: FAC-000001 / REC-000001. Tokens de enlace
        // compartido: hex aleatorio de 48 chars -> RPC por token.
        const esToken = /^[a-f0-9]{32,64}$/i.test(numero || '');
        if (esToken) {
          const { supabase } = await import('../lib/supabaseClient');
          const { data, error: rpcError } = await supabase.rpc('obtener_documento_por_token', { p_token: numero });
          if (rpcError || !data?.contenido) {
            const msg = rpcError?.message || '';
            throw new Error(/schema cache|function|PGRST/.test(msg)
              ? 'Este enlace dejó de estar disponible o falta aplicar el SQL de RPCs públicas.'
              : 'Este enlace dejó de estar disponible.');
          }
          const tipo = data?.tipo || (esFactura ? 'FACTURA' : 'RECIBO');
          const contenido = typeof data?.contenido === 'string' ? JSON.parse(data.contenido) : data?.contenido;
          if (!contenido) throw new Error('Este enlace dejó de estar disponible.');
          try {
            docHtml = await renderDocumentoPublicoDesdeRPC({ tipo, contenido });
          } catch {
            docHtml = null;
          }
          if (!docHtml) {
            docHtml = tipo === 'FACTURA' ? renderFacturaDesdeFila(contenido) : renderReciboDesdeFila(contenido);
          }
        } else {
          const payload = esFactura
            ? await HomeAPI.consultarFactura(numero)
            : await HomeAPI.consultarRecibo(numero);
          try {
            docHtml = await renderDocumentoPublicoDesdeRPC({
              tipo: esFactura ? 'FACTURA' : 'RECIBO',
              contenido: payload,
            });
          } catch {
            docHtml = null;
          }
          if (!docHtml) {
            docHtml = esFactura ? renderFacturaDesdeFila(payload) : renderReciboDesdeFila(payload);
          }
        }
        if (!cancelado) {
          setHtml(docHtml);
          abrirDocumentoHtml(docHtml, { autoPrint: false });
        }
      } catch (e) {
        if (!cancelado) setError(e?.message || 'Documento no encontrado.');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => { cancelado = true; };
  }, [tipoRuta, numero]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-6 text-center">
      {loading && (
        <>
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
          <p className="text-sm text-gray-500">Cargando documento…</p>
        </>
      )}
      {!loading && html && (
        <>
          <FileText className="w-10 h-10 text-emerald-600 mb-3" />
          <h1 className="text-lg font-bold text-gray-800 mb-1">Documento abierto en una pestaña</h1>
          <p className="text-sm text-gray-500 mb-4 max-w-md">
            Si no se abrió automáticamente, puedes abrirlo de nuevo desde aquí.
          </p>
          <button
            onClick={() => abrirDocumentoHtml(html, { autoPrint: true })}
            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white"
          >
            Abrir / Imprimir
          </button>
        </>
      )}
      {!loading && error && (
        <>
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <h1 className="text-lg font-bold text-gray-800 mb-1">Documento no disponible</h1>
          <p className="text-sm text-gray-500 max-w-md">{error}</p>
          <Link to="/" className="mt-4 text-sm font-semibold text-emerald-600 hover:underline">Volver al inicio</Link>
        </>
      )}
    </div>
  );
}
