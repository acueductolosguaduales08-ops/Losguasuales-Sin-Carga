-- ============================================================
-- 07 FIX login por username (anon no puede leer profiles por RLS)
-- Función SECURITY DEFINER: solo devuelve el email para el username.
-- Ejecutar en el proyecto NUEVO (donde sí existe public.profiles).
-- ============================================================

create or replace function public.email_for_username(p_username text)
returns text language sql stable security definer set search_path = public as $$
  select email from public.profiles where username = p_username limit 1;
$$;

-- Permiso para que anon/autenticados la usen en el login
grant execute on function public.email_for_username(text) to anon, authenticated;
