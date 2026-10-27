import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ReportesComunidadAPI } from '../api/reportesComunidad';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const ReportesComunidadContext = createContext(null);

const POLL_INTERVAL_MS = 30000;
const VISTOS_KEY = 'acueducto_reportes_comunidad_vistos_ids';

// localStorage (no sessionStorage): antes, al cerrar el navegador se
// perdía qué reportes ya se habían visto, y al volver a entrar la misma
// notificación de "nuevo reporte" reaparecía para reportes que el
// admin/tesorero ya había revisado en una sesión anterior. Con
// localStorage, lo visto queda recordado en este dispositivo hasta que el
// propio reporte se elimine del sistema.
function loadVistos() {
  try {
    const raw = localStorage.getItem(VISTOS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveVistos(set) {
  try {
    localStorage.setItem(VISTOS_KEY, JSON.stringify([...set]));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function ReportesComunidadProvider({ children }) {
  const { rol, isAuthenticated } = useAuth();
  const { warning } = useToast();
  const puedeGestionar = rol === 'ADMINISTRADOR' || rol === 'TESORERO';

  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  const vistos = useRef(loadVistos());
  const isFirstLoad = useRef(true);
  const [vistosVersion, setVistosVersion] = useState(0);

  // Trae el listado y, si aparecen reportes nuevos (no vistos aún en esta sesión),
  // avisa al admin/tesorero con un toast — la "notificación automática" de reportes.
  const fetchReportes = useCallback(async () => {
    if (!puedeGestionar) {
      setReportes([]);
      setLoading(false);
      return [];
    }
    try {
      const res = await ReportesComunidadAPI.listar({ page: 0, size: 50 });
      const content = res?.content || [];
      setReportes(content);

      const nuevos = content.filter((r) => !vistos.current.has(r.id));
      if (!isFirstLoad.current && nuevos.length > 0) {
        const mensaje =
          nuevos.length === 1
            ? `Nuevo reporte de la comunidad de ${nuevos[0].nombre}.`
            : `${nuevos.length} nuevos reportes de la comunidad recibidos.`;
        warning(mensaje, 'Revisa la sección de gestión para ver los detalles.');
      }

      return content;
    } catch {
      return [];
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  }, [puedeGestionar, warning]);

  useEffect(() => {
    fetchReportes();
    if (!puedeGestionar) return undefined;
    const interval = setInterval(fetchReportes, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, puedeGestionar]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cuántos reportes aún no ha "visto" el admin/tesorero — se usa como badge en el menú.
  const nuevos = useMemo(
    () => reportes.filter((r) => !vistos.current.has(r.id)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reportes, vistosVersion]
  );

  // Marca todos los reportes actuales como vistos (se llama al entrar a la sección de gestión).
  const marcarVistos = useCallback(() => {
    reportes.forEach((r) => vistos.current.add(r.id));
    saveVistos(vistos.current);
    setVistosVersion((v) => v + 1);
  }, [reportes]);

  // Quita un reporte de la lista local al instante (sin esperar el próximo
  // poll) cuando se elimina, y lo marca como visto para que, si por
  // cualquier motivo el backend lo sigue devolviendo un momento más,
  // no dispare de nuevo el aviso de "reporte nuevo".
  const quitarReporte = useCallback((id) => {
    setReportes((prev) => prev.filter((r) => r.id !== id));
    vistos.current.add(id);
    saveVistos(vistos.current);
  }, []);

  const value = useMemo(
    () => ({ reportes, loading, nuevos, puedeGestionar, fetchReportes, marcarVistos, quitarReporte }),
    [reportes, loading, nuevos, puedeGestionar, fetchReportes, marcarVistos, quitarReporte]
  );

  return <ReportesComunidadContext.Provider value={value}>{children}</ReportesComunidadContext.Provider>;
}

export function useReportesComunidad() {
  const ctx = useContext(ReportesComunidadContext);
  if (!ctx) throw new Error('useReportesComunidad debe usarse dentro de <ReportesComunidadProvider>');
  return ctx;
}
