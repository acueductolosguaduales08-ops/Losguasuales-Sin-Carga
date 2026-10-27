import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { NotificacionesAPI } from '../api/notificaciones';
import { useAuth } from './AuthContext';
import {
  registrarServiceWorker,
  permisoNotificaciones,
  solicitarPermisoNotificaciones,
  mostrarNotificacionSistema,
} from '../utils/notificacionesSistema';

const NotificationsContext = createContext(null);

const POLL_INTERVAL_MS = 30000;
const SEEN_IDS_KEY = 'acueducto_ntf_seen_ids';
const HIDDEN_KEY_PREFIX = 'acueducto_ntf_hidden_';

function loadSeenIds() {
  try {
    const raw = sessionStorage.getItem(SEEN_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenIds(set) {
  try {
    sessionStorage.setItem(SEEN_IDS_KEY, JSON.stringify([...set]));
  } catch {
    /* almacenamiento no disponible */
  }
}

function loadHiddenIds(userId) {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY_PREFIX + userId);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveHiddenIds(userId, set) {
  try {
    localStorage.setItem(HIDDEN_KEY_PREFIX + userId, JSON.stringify([...set]));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function NotificationsProvider({ children }) {
  const { isAuthenticated, usuario } = useAuth();
  const userId = usuario?.id || 'anon';

  const [publicas, setPublicas] = useState([]);
  const [misNotificaciones, setMisNotificaciones] = useState([]);
  const [loadingPublicas, setLoadingPublicas] = useState(true);
  const [loadingMias, setLoadingMias] = useState(true);
  const [detalle, setDetalle] = useState(null);
  const [permisoSistema, setPermisoSistema] = useState(() => permisoNotificaciones());
  const [hiddenIds, setHiddenIds] = useState(() => loadHiddenIds(userId));

  const seenIds = useRef(loadSeenIds());
  const isFirstLoad = useRef(true);

  // Recargar hidden IDs cuando cambia el usuario
  useEffect(() => {
    setHiddenIds(loadHiddenIds(userId));
  }, [userId]);

  useEffect(() => {
    registrarServiceWorker();
  }, []);

  const activarNotificacionesSistema = useCallback(async () => {
    const resultado = await solicitarPermisoNotificaciones();
    setPermisoSistema(resultado);
    return resultado;
  }, []);

  const notificarFueraPagina = useCallback((n) => {
    if (permisoNotificaciones() !== 'granted') return;
    mostrarNotificacionSistema({
      id: n.id,
      titulo: n.titulo,
      cuerpo: n.descripcionCorta,
      imagen: n.enlaceUrl || undefined,
    });
  }, []);

  const dismissToast = useCallback(() => {}, []);

  // Ocultar notificación: la agrega al set de ocultas y la quita de las listas visibles
  const ocultarNotificacion = useCallback((id) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveHiddenIds(userId, next);
      return next;
    });
    setPublicas((prev) => prev.filter((n) => n.id !== id));
    setMisNotificaciones((prev) => prev.filter((n) => n.id !== id));
    setDetalle((prev) => (prev?.id === id ? null : prev));
  }, [userId]);

  const fetchPublicas = useCallback(async ({ page = 0, size = 20 } = {}) => {
    try {
      const res = await NotificacionesAPI.publicas({ page, size });
      const content = res?.content || [];
      setPublicas(content);

      const nuevas = content.filter((n) => !seenIds.current.has(n.id) && !hiddenIds.has(n.id));
      if (!isFirstLoad.current) {
        nuevas.forEach((n) => {
          notificarFueraPagina(n);
        });
      }
      content.forEach((n) => seenIds.current.add(n.id));
      saveSeenIds(seenIds.current);

      return content;
    } catch {
      return [];
    } finally {
      setLoadingPublicas(false);
    }
  }, [notificarFueraPagina, hiddenIds]);

  const fetchMisNotificaciones = useCallback(async ({ page = 0, size = 20 } = {}) => {
    if (!isAuthenticated) {
      setMisNotificaciones([]);
      setLoadingMias(false);
      return [];
    }
    try {
      const res = await NotificacionesAPI.misNotificaciones({ page, size });
      const content = res?.content || [];
      setMisNotificaciones(content);

      const nuevas = content.filter((n) => !seenIds.current.has(n.id) && !hiddenIds.has(n.id));
      if (!isFirstLoad.current) {
        nuevas.forEach((n) => {
          notificarFueraPagina(n);
        });
      }
      content.forEach((n) => seenIds.current.add(n.id));
      saveSeenIds(seenIds.current);

      return content;
    } catch {
      return [];
    } finally {
      setLoadingMias(false);
    }
  }, [isAuthenticated, notificarFueraPagina, hiddenIds]);

  const refetchAll = useCallback(async () => {
    await Promise.all([fetchPublicas(), fetchMisNotificaciones()]);
    isFirstLoad.current = false;
  }, [fetchPublicas, fetchMisNotificaciones]);

  useEffect(() => {
    refetchAll();
    const interval = setInterval(() => {
      fetchPublicas();
      fetchMisNotificaciones();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const marcarLeida = useCallback(async (id) => {
    setMisNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    setPublicas((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    try {
      await NotificacionesAPI.marcarLeida(id);
    } catch {
      /* falla silenciosa */
    }
  }, []);

  const abrirDetalle = useCallback(
    (n) => {
      setDetalle(n);
      if (!n.leida) marcarLeida(n.id);
    },
    [marcarLeida]
  );

  const cerrarDetalle = useCallback(() => setDetalle(null), []);

  // Listas filtradas (excluye ocultas)
  const publicasVisibles = useMemo(() => publicas.filter((n) => !hiddenIds.has(n.id)), [publicas, hiddenIds]);
  const misNotificacionesVisibles = useMemo(() => misNotificaciones.filter((n) => !hiddenIds.has(n.id)), [misNotificaciones, hiddenIds]);

  const noLeidas = useMemo(() => {
    const combinadas = [...publicasVisibles, ...misNotificacionesVisibles];
    const unicas = new Map(combinadas.map((n) => [n.id, n]));
    return [...unicas.values()].filter((n) => !n.leida).length;
  }, [publicasVisibles, misNotificacionesVisibles]);

  const value = useMemo(
    () => ({
      publicas: publicasVisibles,
      misNotificaciones: misNotificacionesVisibles,
      loadingPublicas,
      loadingMias,
      detalle,
      noLeidas,
      permisoSistema,
      activarNotificacionesSistema,
      dismissToast,
      abrirDetalle,
      cerrarDetalle,
      marcarLeida,
      ocultarNotificacion,
      refetchAll,
    }),
    [
      publicasVisibles,
      misNotificacionesVisibles,
      loadingPublicas,
      loadingMias,
      detalle,
      noLeidas,
      permisoSistema,
      activarNotificacionesSistema,
      dismissToast,
      abrirDetalle,
      cerrarDetalle,
      marcarLeida,
      ocultarNotificacion,
      refetchAll,
    ]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de <NotificationsProvider>');
  return ctx;
}
