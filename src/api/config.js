// LEGACY Spring Boot — sin uso en modo supabase-only (Opción A usa supabase.auth).
// Se conserva para syncManager/MiCuenta que aún lo importan; no borrar.
// Configuración base de la API del sistema Acueducto
const DEFAULT_API_URL = import.meta.env.PROD
  ? 'https://acueducto-losguaduales-server.onrender.com'
  : 'http://localhost:8080';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL;

export const TOKEN_KEY = 'acueducto_access_token';
export const REFRESH_KEY = 'acueducto_refresh_token';
export const USER_KEY = 'acueducto_usuario';

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setSession({ accessToken, refreshToken, usuario }) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (usuario) localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}
