-- ============================================================
-- 00 DIAGNOSTICO: ¿esquema viejo (Spring) o nuevo (supabase-only)?
-- Ejecuta esto en el SQL Editor del proyecto y mira el resultado.
-- ============================================================

-- Si existe 'profiles' (uuid) => esquema NUEVO listo para la copia.
-- Si existe 'usuarios' (bigint) y asociados.id es integer => esquema VIEJO Spring.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles','usuarios','asociados','configuracion','publicaciones','auth_users_view')
order by table_name;

-- Tipos de id: viejo = bigint/integer, nuevo = uuid
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('asociados','profiles','usuarios')
  and column_name = 'id';

-- Conteo rápido (viejo trae datos del backend)
select 'asociados' as tabla, count(*) as n from public.asociados
union all select 'publicaciones', count(*) from public.publicaciones
union all select 'configuracion', count(*) from public.configuracion;
