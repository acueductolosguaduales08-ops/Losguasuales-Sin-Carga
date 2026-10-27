import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { supabase, toAppUser } from '../lib/supabaseClient';
import { AuthAPI } from '../api/auth';
import { AsociadosAPI } from '../api/asociados';

const AuthContext = createContext(null);
const USER_KEY = 'acueducto_usuario_supabase';

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [estadoServicio, setEstadoServicio] = useState(null);

  // Restaura sesión Supabase al cargar (persistSession)
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (!cancel) {
            setUsuario(null);
            localStorage.removeItem(USER_KEY);
          }
          return;
        }
        const perfil = await AuthAPI.perfil().catch(() => null);
        if (!cancel) {
          if (perfil) {
            setUsuario(perfil);
            localStorage.setItem(USER_KEY, JSON.stringify(perfil));
          } else {
            setUsuario(null);
            localStorage.removeItem(USER_KEY);
          }
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUsuario(null);
        localStorage.removeItem(USER_KEY);
      }
    });
    return () => {
      cancel = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const rol = usuario?.rol || null;
  const isAuthenticated = !!usuario;

  useEffect(() => {
    if (rol !== 'ASOCIADO' || !usuario?.asociadoId) {
      setEstadoServicio(null);
      return;
    }
    let cancelado = false;
    AsociadosAPI.obtener(usuario.asociadoId)
      .then((data) => {
        if (!cancelado) setEstadoServicio(data?.estadoServicio || null);
      })
      .catch(() => {
        if (!cancelado) setEstadoServicio(null);
      });
    return () => {
      cancelado = true;
    };
  }, [rol, usuario?.asociadoId]);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const { usuario: u } = await AuthAPI.login(username, password);
      setUsuario(u);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthAPI.logout();
    } finally {
      localStorage.removeItem(USER_KEY);
      setUsuario(null);
      setEstadoServicio(null);
    }
  }, []);

  const puedeEditar = rol === 'ADMINISTRADOR' || rol === 'TESORERO';

  const value = useMemo(
    () => ({ usuario, rol, isAuthenticated, loading, login, logout, puedeEditar, estadoServicio }),
    [usuario, rol, isAuthenticated, loading, login, logout, puedeEditar, estadoServicio]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

export { toAppUser };
