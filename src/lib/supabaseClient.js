import { createClient } from '@supabase/supabase-js';

// Cliente único Supabase-only. Ya no hay Spring Boot ni VITE_API_BASE_URL.
// Acepta la key nueva (sb_publishable_...) o la legacy (eyJ...): mismo valor, dos nombres.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'acueducto_supabase_auth',
  },
});

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

export async function getMyProfile() {
  const session = await getSession();
  if (!session?.user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, email, rol, asociado_id, activo')
    .eq('id', session.user.id)
    .single();
  if (error) return null;
  if (data && data.activo === false) {
    await supabase.auth.signOut();
    throw new Error('Cuenta bloqueada. Contacta al administrador.');
  }
  return data;
}

export function toAppUser(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    rol: profile.rol,
    asociadoId: profile.asociado_id || null,
    activo: profile.activo,
  };
}

export default supabase;
