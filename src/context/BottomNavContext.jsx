import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const BottomNavContext = createContext(null);

const STORAGE_KEY = 'bottomNavEnabled';

// Alto real de la barra (h-16 = 4rem = 64px) + el alto de la zona segura
// inferior de dispositivos con "isla"/gestos (env(safe-area-inset-bottom)).
// Otras partes de la app (el wrapper de rutas en App.jsx) usan este mismo
// número para reservar espacio y que la barra nunca tape contenido.
export const BOTTOM_NAV_HEIGHT = 64;

function getInitialEnabled() {
  const stored = localStorage.getItem(STORAGE_KEY);
  // Por defecto activada (comportamiento tipo app de celular); el usuario
  // puede desactivarla desde Mi cuenta si prefiere no tener una barra fija.
  if (stored === null) return true;
  return stored === '1';
}

export function BottomNavProvider({ children }) {
  const [enabled, setEnabledState] = useState(getInitialEnabled);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  }, [enabled]);

  const setEnabled = useCallback((value) => setEnabledState(value), []);
  const toggle = useCallback(() => setEnabledState((prev) => !prev), []);

  const value = useMemo(() => ({ enabled, setEnabled, toggle }), [enabled, setEnabled, toggle]);

  return <BottomNavContext.Provider value={value}>{children}</BottomNavContext.Provider>;
}

export function useBottomNav() {
  const ctx = useContext(BottomNavContext);
  if (!ctx) throw new Error('useBottomNav debe usarse dentro de <BottomNavProvider>');
  return ctx;
}
