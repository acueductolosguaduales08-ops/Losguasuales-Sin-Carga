import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Users, FileText, Receipt, ShieldAlert, Inbox } from 'lucide-react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { useAuth } from '../../context/AuthContext';
import { AsociadosAPI } from '../../api/asociados';
import { FacturasAPI } from '../../api/facturas';
import { RecibosAPI } from '../../api/recibos';
import { TesoreriaAPI } from '../../api/tesoreria';
import { formatCOP } from '../../utils/formatCOP';

const MIN_CHARS = 2;

// Resultados planos que se pueden navegar de inmediato.
function normalizarAsociado(a) {
  return {
    tipo: 'asociado',
    id: a.id,
    titulo: `${a.nombres || ''} ${a.apellidos || ''}`.trim() || 'Asociado',
    subtitulo: a.documento || a.codigoInterno || '',
    estado: a.estadoServicio || a.estado,
    extra: a.direccion || '',
    ruta: `/asociados/${a.id}`,
  };
}

function normalizarFactura(f) {
  return {
    tipo: 'factura',
    id: f.id,
    titulo: f.numeroFactura || f.numero || 'Factura',
    subtitulo: `${f.asociado?.nombreCompleto || f.asociadoNombre || ''}`.trim(),
    estado: f.estado,
    extra: formatCOP(f.total),
    ruta: `/facturacion?ver=${f.id}`,
  };
}

function normalizarRecibo(r) {
  return {
    tipo: 'recibo',
    id: r.id,
    titulo: r.numeroRecibo || r.numero || 'Recibo',
    subtitulo: r.asociado?.nombreCompleto || r.asociadoNombre || '',
    estado: r.estado || r.estadoRecibo,
    extra: formatCOP(r.valor),
    ruta: '/recibos',
  };
}

function normalizarMulta(m) {
  return {
    tipo: 'multa',
    id: m.id,
    titulo: m.motivo || m.numero || 'Multa',
    subtitulo: m.asociado?.nombreCompleto || '',
    estado: m.estado,
    extra: formatCOP(m.valor),
    ruta: `/multas?ver=${m.id}`,
  };
}

export default function BuscadorGlobalModal({ open, onClose }) {
  const navigate = useNavigate();
  const { rol } = useAuth();
  const inputRef = useRef(null);
  useLockBodyScroll(open, onClose);

  const esStaff = rol === 'ADMINISTRADOR' || rol === 'TESORERO';

  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Enfocar el input al abrir
  useEffect(() => {
    if (open) {
      setQ('');
      setResultados([]);
      setError(null);
      // pequeño delay para que el modal termine de montarse
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Buscar con debounce
  useEffect(() => {
    if (!open || !esStaff) return;
    const texto = q.trim();
    if (texto.length < MIN_CHARS) {
      setResultados([]);
      setError(null);
      setCargando(false);
      return;
    }
    setCargando(true);
    setError(null);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      Promise.allSettled([
        AsociadosAPI.buscar(texto, { size: 5 }, ctrl.signal),
        FacturasAPI.buscarPorNumero(texto),
        RecibosAPI.buscarPorNumero(texto).then((r) => (r ? [r] : [])).catch(() => []),
        TesoreriaAPI.listarMultasAsociado
          ? TesoreriaAPI.listarMultas().then((ms) =>
              (Array.isArray(ms) ? ms : []).filter((m) =>
                String(m.motivo || '').toLowerCase().includes(texto.toLowerCase())
              )
            )
          : Promise.resolve([]),
      ])
        .then((r) => {
          const [asoc, fac, rec, mul] = r;
          const planos = [];
          if (asoc.status === 'fulfilled' && Array.isArray(asoc.value)) {
            planos.push(...asoc.value.slice(0, 5).map(normalizarAsociado));
          }
          if (fac.status === 'fulfilled' && Array.isArray(fac.value)) {
            planos.push(...fac.value.slice(0, 5).map(normalizarFactura));
          }
          if (rec.status === 'fulfilled' && Array.isArray(rec.value)) {
            planos.push(...rec.value.slice(0, 3).map(normalizarRecibo));
          }
          if (mul.status === 'fulfilled' && Array.isArray(mul.value)) {
            planos.push(...mul.value.slice(0, 5).map(normalizarMulta));
          }
          setResultados(planos);
          if (planos.length === 0) setError('Sin resultados para "' + texto + '".');
        })
        .catch(() => setError('No se pudo completar la búsqueda.'))
        .finally(() => setCargando(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open, esStaff]);

  const agrupados = useMemo(() => {
    const grupos = {};
    for (const r of resultados) {
      if (!grupos[r.tipo]) grupos[r.tipo] = [];
      grupos[r.tipo].push(r);
    }
    return grupos;
  }, [resultados]);

  const ir = (ruta) => {
    onClose();
    navigate(ruta);
  };

  if (!open || !esStaff) return null;

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="modal-shell__card relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[85dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda global"
      >
        <div className="p-4 border-b border-gray-200 dark:border-dark-muted flex items-center gap-2 shrink-0">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar asociados, facturas, recibos, multas…"
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400"
            aria-label="Buscar en todo el sistema"
          />
          {cargando && <Loader2 className="w-4 h-4 animate-spin text-gray-400 shrink-0" />}
        </div>

        <div className="modal-shell__body flex-1 p-4 overflow-y-auto overscroll-contain custom-scroll space-y-4">
          {q.trim().length < MIN_CHARS && !cargando && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
              Escribe al menos {MIN_CHARS} caracteres para buscar.
            </p>
          )}

          {error && (
            <div className="text-center py-6">
              <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
            </div>
          )}

          {resultados.length === 0 && q.trim().length >= MIN_CHARS && !cargando && !error && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">Sin resultados.</p>
          )}

          {Object.entries(agrupados).map(([tipo, items]) => (
            <div key={tipo}>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                {tipo === 'asociado' && <Users className="w-3.5 h-3.5" />}
                {tipo === 'factura' && <FileText className="w-3.5 h-3.5" />}
                {tipo === 'recibo' && <Receipt className="w-3.5 h-3.5" />}
                {tipo === 'multa' && <ShieldAlert className="w-3.5 h-3.5" />}
                {tipo === 'asociado' ? 'Asociados' : tipo === 'factura' ? 'Facturas' : tipo === 'recibo' ? 'Recibos' : 'Multas'}
              </p>
              <ul className="space-y-1">
                {items.map((r) => (
                  <li key={`${r.tipo}-${r.id}`}>
                    <button
                      onClick={() => ir(r.ruta)}
                      className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-gray-800 dark:text-white truncate">{r.titulo}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                          {[r.subtitulo, r.extra].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      {r.estado && (
                        <span className="shrink-0 badge-estado badge-gris text-[10px]">{r.estado}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
