-- ============================================================
-- 04 SEED mínimo (ejecutar después de 03)
-- ============================================================

-- Singleton configuración (id=1). Ajusta tarifas y datos reales aquí.
insert into public.configuracion (id, nombre_acueducto, valor_m3, cargo_fijo_administracion, dias_plazo_pago, dias_para_suspension)
values (1, 'Acueducto Los Guaduales', 2500, 8000, 15, 30)
on conflict (id) do nothing;

-- Métodos de pago base
insert into public.metodos_pago (nombre) values
  ('EFECTIVO'), ('NEQUI'), ('BANCOLOMBIA'), ('DAVIPLATA'), ('TRANSFERENCIA')
on conflict (nombre) do nothing;

-- Categorías base portal
insert into public.categorias (nombre) values
  ('Anuncios'), ('Obras'), ('Cortes'), ('Comunidad')
on conflict (nombre) do nothing;

-- NOTA: el usuario ADMIN se crea así (Opción A):
-- 1. En Supabase Dashboard > Authentication > Users > Invite/Create user (email+password)
-- 2. Copia el UUID del usuario y ejecútalo abajo:
-- insert into public.profiles (id, username, email, rol, activo)
-- values ('PEGA-UUID-AQUI', 'admin', 'admin@tudominio.com', 'ADMINISTRADOR', true)
-- on conflict (id) do update set rol='ADMINISTRADOR', activo=true;
--
-- Para TESORERO igual pero rol='TESORERO'.
-- Para ASOCIADO: primero crea el asociado en public.asociados, luego el user auth,
-- luego: insert into public.profiles (id, username, rol, asociado_id) values (...,'ASOCIADO', '<asociado_uuid>');
