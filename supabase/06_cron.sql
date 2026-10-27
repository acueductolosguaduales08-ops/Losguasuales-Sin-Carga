-- ============================================================
-- 06 CRONS (sustituyen @Scheduled Spring)
-- Opción 1 (recomendada, sin extensiones): Supabase Dashboard >
-- Edge Functions / Cron Jobs > programa llamada diaria a la función
-- SQL public.limpieza_diaria() (ya creada en 03_functions.sql).
--
-- Equivale a: 00:10 vencidas, 00:20 reportes>8d, 00:40 enlaces,
-- 01:00 auditoría>90d, 01:10 notifs, 08:00 recordatorios.
-- ============================================================

-- Limpieza diaria: reportes>8d, enlaces expirados, auditoría>90d + marcar vencidas
-- Ejecútalo manual para probar:
-- select public.limpieza_diaria();

-- Opción 2: pg_cron (si tu proyecto lo tiene habilitado)
-- Descomenta en SQL Editor:
-- create extension if not exists pg_cron;
-- select cron.schedule('acueducto-limpieza-diaria', '10 0 * * *', $$select public.limpieza_diaria()$$);

-- Recordatorio de vencimiento (facturas que vencen en ≤3 días).
-- El frontend puede llamarla al cargar el dashboard admin:
create or replace function public.facturas_por_vencer()
returns setof public.facturas language sql stable security definer set search_path = public as $$
  select * from public.facturas
  where estado = 'PENDIENTE'
    and fecha_limite_pago between current_date and current_date + 3;
$$;
