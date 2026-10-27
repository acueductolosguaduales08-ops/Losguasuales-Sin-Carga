-- =============================================================
-- 14_factura_por_lectura.sql  (idempotente; corre después de 13)
--
-- Permite generar la factura de UNA sola lectura al registrarla
-- (flujo del Panel: lectura -> factura de una vez), y refactoriza
-- generar_facturas_mes para que delegue en esa misma función por
-- lectura (una sola verdad de cálculo, mismo resultado que antes).
--
-- generar_factura_lectura NO lanza error por estados "saltables"
-- (ya generada, anulada, mes cerrado, asociado inactivo, duplicado):
-- devuelve {creada:false, motivo, ...} para que el masivo los omita
-- igual que el bulk anterior. Solo lanza error en fallos reales
-- (lectura inexistente, configuracion ausente).
-- =============================================================

-- ---------- 1. Factura individual desde una lectura ----------
create or replace function public.generar_factura_lectura(p_lectura_id uuid)
returns jsonb language plpgsql volatile security definer
set search_path = public as $$
declare
  v_lect public.lecturas%rowtype;
  v_med public.medidores%rowtype;
  v_mes public.meses_contables%rowtype;
  v_conf public.configuracion%rowtype;
  v_fact public.facturas%rowtype;
  v_multas numeric(12,2);
  v_num text;
  v_limite date;
begin
  if not public.is_admin() then
    raise exception 'Solo ADMINISTRADOR' using errcode = '42501';
  end if;

  select * into v_lect from public.lecturas where id = p_lectura_id;
  if not found then
    raise exception 'Lectura no existe' using errcode = 'P0002';
  end if;

  -- Ya tiene factura: devuelve la existente sin crear otra (idempotente).
  if v_lect.factura_generada then
    select * into v_fact from public.facturas where lectura_id = v_lect.id limit 1;
    return jsonb_build_object('creada', false, 'motivo', 'YA_GENERADA',
      'id', v_fact.id, 'numero', v_fact.numero_factura, 'total', v_fact.total);
  end if;

  if v_lect.anulada then
    return jsonb_build_object('creada', false, 'motivo', 'LECTURA_ANULADA');
  end if;

  select * into v_mes from public.meses_contables where id = v_lect.mes_contable_id;
  if not found or v_mes.estado = 'CERRADO' then
    return jsonb_build_object('creada', false, 'motivo', 'MES_CERRADO');
  end if;

  select * into v_med from public.medidores where id = v_lect.medidor_id;
  if v_med.asociado_id is null then
    return jsonb_build_object('creada', false, 'motivo', 'MEDIDOR_SIN_ASOCIADO');
  end if;

  if not exists (
    select 1 from public.asociados a
    where a.id = v_med.asociado_id
      and a.estado_servicio = 'ACTIVO' and a.archivado = false
  ) then
    return jsonb_build_object('creada', false, 'motivo', 'ASOCIADO_INACTIVO');
  end if;

  -- 1 factura por asociado+mes (mismo control que el bulk).
  select * into v_fact from public.facturas
    where asociado_id = v_med.asociado_id
      and mes_contable_id = v_lect.mes_contable_id
    limit 1;
  if found then
    return jsonb_build_object('creada', false, 'motivo', 'YA_TIENE_FACTURA_MES',
      'id', v_fact.id, 'numero', v_fact.numero_factura, 'total', v_fact.total);
  end if;

  select * into v_conf from public.configuracion where id = 1 for update;
  if not found then
    raise exception 'Falta fila configuracion id=1';
  end if;

  -- multas pendientes no independientes del asociado
  select coalesce(sum(valor), 0) into v_multas from public.multas
    where asociado_id = v_med.asociado_id
      and estado = 'PENDIENTE' and independiente = false and factura_id is null;

  v_num := public.fmt_numero('FAC-', v_conf.siguiente_numero_factura, 6);
  v_limite := current_date + v_conf.dias_plazo_pago;

  insert into public.facturas(
    numero_factura, asociado_id, lectura_id, mes_contable_id,
    fecha_emision, fecha_limite_pago, lectura_anterior, lectura_actual, consumo_m3,
    valor_m3, valor_consumo, cargo_administracion, valores_adicionales, total_multas,
    total, total_pagado, estado
  ) values (
    v_num, v_med.asociado_id, v_lect.id, v_lect.mes_contable_id,
    current_date, v_limite, v_lect.lectura_anterior, v_lect.lectura_actual, v_lect.consumo_m3,
    v_conf.valor_m3, round(v_conf.valor_m3 * v_lect.consumo_m3, 2),
    v_conf.cargo_fijo_administracion, 0, v_multas,
    round(v_conf.valor_m3 * v_lect.consumo_m3, 2) + v_conf.cargo_fijo_administracion + v_multas,
    0, 'PENDIENTE'
  ) returning * into v_fact;

  update public.lecturas set factura_generada = true where id = v_lect.id;

  -- vincula multas a la factura recién creada
  update public.multas set factura_id = v_fact.id
    where asociado_id = v_med.asociado_id
      and estado = 'PENDIENTE' and independiente = false and factura_id is null;

  update public.configuracion
    set siguiente_numero_factura = v_conf.siguiente_numero_factura + 1
    where id = 1;

  return jsonb_build_object(
    'creada', true, 'id', v_fact.id, 'numero', v_fact.numero_factura,
    'total', v_fact.total, 'fecha_limite_pago', v_fact.fecha_limite_pago
  );
end $$;
grant execute on function public.generar_factura_lectura(uuid) to authenticated;
revoke execute on function public.generar_factura_lectura(uuid) from public;

-- ---------- 2. Bulk del mes delegado en la individual ----------
-- Mismo comportamiento que antes: cuenta solo las facturas creadas
-- realmente; las lecturas saltables (asociado inactivo, duplicado,
-- etc.) se omiten con {creada:false}. Valida mes cerrado igual que
-- la versión anterior.
create or replace function public.generar_facturas_mes(p_mes_id uuid)
returns int language plpgsql volatile security definer
set search_path = public as $$
declare
  r record;
  v_est text;
  v_res jsonb;
  v_count int := 0;
begin
  if not public.is_admin() then
    raise exception 'Solo ADMINISTRADOR' using errcode = '42501';
  end if;
  select estado into v_est from public.meses_contables where id = p_mes_id;
  if not found then
    raise exception 'Mes no existe';
  end if;
  if v_est = 'CERRADO' then
    raise exception 'Mes CERRADO';
  end if;
  for r in
    select l.id from public.lecturas l
    where l.mes_contable_id = p_mes_id
      and l.factura_generada = false
      and l.anulada = false
  loop
    v_res := public.generar_factura_lectura(r.id);
    if coalesce((v_res->>'creada')::boolean, false) then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end $$;
grant execute on function public.generar_facturas_mes(uuid) to authenticated;
revoke execute on function public.generar_facturas_mes(uuid) from public;

-- ---------- Verificación (pegar después en el SQL Editor) ----------
-- select public.generar_factura_lectura((select id from public.lecturas where factura_generada=false and anulada=false limit 1)) as prueba;
-- Debe devolver {creada: true, ...} con el número FAC-XXXXXX.
-- Si no hay lecturas pendientes, devuelve null (prueba no aplicable).
