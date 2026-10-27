-- ============================================================
-- 11 DECIMALES en lecturas (los medidores marcan ej. 3.07 m³)
-- Cambia int -> numeric(10,2) y recrea crear_lectura con numeric.
-- Los datos existentes se conservan (12 -> 12.00).
-- Idempotente en columnas; la función se borra y recrea.
-- ============================================================

alter table public.lecturas
  alter column lectura_anterior type numeric(10,2),
  alter column lectura_actual type numeric(10,2),
  alter column consumo_m3 type numeric(10,2);

alter table public.facturas
  alter column lectura_anterior type numeric(10,2),
  alter column lectura_actual type numeric(10,2),
  alter column consumo_m3 type numeric(10,2);

-- La firma cambia (int -> numeric): hay que borrar la anterior,
-- si no Postgres crea una sobrecarga y el frontend llamaría la vieja.
drop function if exists public.crear_lectura(uuid, uuid, integer, integer);

create or replace function public.crear_lectura(
  p_medidor_id uuid, p_mes_id uuid, p_actual numeric, p_anterior numeric default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_med record; v_mes record; v_ant numeric; v_id uuid;
begin
  if not public.is_staff() then raise exception 'No autorizado' using errcode='42501'; end if;
  select * into v_med from public.medidores where id = p_medidor_id;
  if not found then raise exception 'Medidor no existe' using errcode='P0002'; end if;
  if v_med.estado <> 'ACTIVO' then raise exception 'Medidor no está ACTIVO'; end if;
  if v_med.asociado_id is null then raise exception 'Medidor sin asociado'; end if;
  select * into v_mes from public.meses_contables where id = p_mes_id;
  if not found then raise exception 'Mes no existe' using errcode='P0002'; end if;
  if v_mes.estado = 'CERRADO' then raise exception 'Mes CERRADO, no admite lecturas'; end if;
  if exists (select 1 from public.lecturas where medidor_id=p_medidor_id and mes_contable_id=p_mes_id and anulada=false) then
    raise exception 'Ya existe lectura para ese medidor y mes';
  end if;
  if p_actual is null or p_actual < 0 then raise exception 'Lectura actual inválida'; end if;
  if p_anterior is not null then v_ant := round(p_anterior, 2);
  else
    select lectura_actual into v_ant from public.lecturas
      where medidor_id=p_medidor_id order by created_at desc limit 1;
    if v_ant is null then v_ant := 0; end if;
  end if;
  if round(p_actual, 2) < v_ant then raise exception 'Lectura actual (%) menor que anterior (%)', p_actual, v_ant; end if;
  insert into public.lecturas(medidor_id, mes_contable_id, lectura_anterior, lectura_actual, consumo_m3)
    values (p_medidor_id, p_mes_id, v_ant, round(p_actual, 2), round(p_actual, 2) - v_ant)
    returning id into v_id;
  return v_id;
end $$;
