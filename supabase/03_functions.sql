-- ============================================================
-- 03 FUNCIONES de negocio (sustituyen Spring Boot services)
-- Todas SECURITY DEFINER con chequeo interno de rol vía public.is_staff()
-- Ejecutar DESPUÉS de 02_rls.sql
-- ============================================================

-- ---------- formato FAC-000001 / ASO-00001 ----------
create or replace function public.fmt_numero(p_prefix text, p_n bigint, p_len int default 6)
returns text language sql immutable as $$
  select p_prefix || lpad(p_n::text, p_len, '0');
$$;

-- Reserva atómica de consecutivos en configuracion singleton.
-- Solo staff. Retorna el texto ya formateado.
create or replace function public.reservar_numero(p_tipo text)
returns text language plpgsql security definer set search_path = public as $$
declare v_n bigint; v_txt text;
begin
  if not public.is_staff() then raise exception 'No autorizado' using errcode='42501'; end if;
  -- bloquea fila singleton
  perform 1 from public.configuracion where id = 1 for update;
  if p_tipo = 'FACTURA' then
    select siguiente_numero_factura into v_n from public.configuracion where id=1;
    update public.configuracion set siguiente_numero_factura = v_n+1 where id=1;
    v_txt := public.fmt_numero('FAC-', v_n, 6);
  elsif p_tipo = 'RECIBO' then
    select siguiente_numero_recibo into v_n from public.configuracion where id=1;
    update public.configuracion set siguiente_numero_recibo = v_n+1 where id=1;
    v_txt := public.fmt_numero('REC-', v_n, 6);
  elsif p_tipo = 'ENTRADA' then
    select siguiente_numero_entrada into v_n from public.configuracion where id=1;
    update public.configuracion set siguiente_numero_entrada = v_n+1 where id=1;
    v_txt := public.fmt_numero('ENT-', v_n, 6);
  elsif p_tipo = 'SALIDA' then
    select siguiente_numero_salida into v_n from public.configuracion where id=1;
    update public.configuracion set siguiente_numero_salida = v_n+1 where id=1;
    v_txt := public.fmt_numero('SAL-', v_n, 6);
  elsif p_tipo = 'NOTA_CREDITO' then
    select siguiente_numero_nota_credito into v_n from public.configuracion where id=1;
    update public.configuracion set siguiente_numero_nota_credito = v_n+1 where id=1;
    v_txt := public.fmt_numero('NC-', v_n, 6);
  elsif p_tipo = 'FORMULARIO' then
    select siguiente_numero_formulario into v_n from public.configuracion where id=1;
    update public.configuracion set siguiente_numero_formulario = v_n+1 where id=1;
    v_txt := public.fmt_numero('FRM-', v_n, 6);
  elsif p_tipo = 'ASOCIADO' then
    select siguiente_codigo_asociado into v_n from public.configuracion where id=1;
    update public.configuracion set siguiente_codigo_asociado = v_n+1 where id=1;
    v_txt := public.fmt_numero('ASO-', v_n, 5);
  else raise exception 'Tipo desconocido %', p_tipo;
  end if;
  return v_txt;
end $$;

-- ---------- crear lectura con validaciones Spring ----------
create or replace function public.crear_lectura(
  p_medidor_id uuid, p_mes_id uuid, p_actual int, p_anterior int default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_med record; v_mes record; v_ant int; v_id uuid;
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
  if p_anterior is not null then v_ant := p_anterior;
  else
    select lectura_actual into v_ant from public.lecturas
      where medidor_id=p_medidor_id order by created_at desc limit 1;
    if v_ant is null then v_ant := 0; end if;
  end if;
  if p_actual < v_ant then raise exception 'Lectura actual (%) menor que anterior (%)', p_actual, v_ant; end if;
  insert into public.lecturas(medidor_id, mes_contable_id, lectura_anterior, lectura_actual, consumo_m3)
    values (p_medidor_id, p_mes_id, v_ant, p_actual, p_actual - v_ant)
    returning id into v_id;
  return v_id;
end $$;

-- ---------- generar facturas del mes ----------
-- Replica FacturaService.generar-mes: filtra asociados ACTIVO no archivados,
-- exige 1 factura por asociado+mes, calcula valorConsumo=valorM3*consumo.
create or replace function public.generar_facturas_mes(p_mes_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare v_mes record; v_conf record; r record; v_count int := 0;
  v_num text; v_limite date; v_multas numeric(12,2);
begin
  if not public.is_admin() then raise exception 'Solo ADMINISTRADOR' using errcode='42501'; end if;
  select * into v_mes from public.meses_contables where id = p_mes_id;
  if not found then raise exception 'Mes no existe'; end if;
  if v_mes.estado = 'CERRADO' then raise exception 'Mes CERRADO'; end if;
  select * into v_conf from public.configuracion where id = 1 for update;
  if not found then raise exception 'Falta fila configuracion id=1'; end if;

  for r in
    select l.id as lectura_id, l.lectura_anterior, l.lectura_actual, l.consumo_m3,
           m.asociado_id
    from public.lecturas l
    join public.medidores m on m.id = l.medidor_id
    where l.mes_contable_id = p_mes_id and l.factura_generada = false and l.anulada = false
  loop
    -- solo asociados ACTIVO y no archivados
    perform 1 from public.asociados a
      where a.id = r.asociado_id and a.estado_servicio='ACTIVO' and a.archivado=false;
    if not found then continue; end if;
    -- evita duplicado asociado+mes
    if exists (select 1 from public.facturas f where f.asociado_id=r.asociado_id and f.mes_contable_id=p_mes_id) then
      continue;
    end if;
    -- multas pendientes no independientes del asociado
    select coalesce(sum(valor),0) into v_multas from public.multas
      where asociado_id=r.asociado_id and estado='PENDIENTE' and independiente=false and factura_id is null;

    v_num := public.fmt_numero('FAC-', v_conf.siguiente_numero_factura, 6);
    v_conf.siguiente_numero_factura := v_conf.siguiente_numero_factura + 1;
    v_limite := current_date + v_conf.dias_plazo_pago;

    insert into public.facturas(
      numero_factura, asociado_id, lectura_id, mes_contable_id,
      fecha_emision, fecha_limite_pago, lectura_anterior, lectura_actual, consumo_m3,
      valor_m3, valor_consumo, cargo_administracion, valores_adicionales, total_multas,
      total, total_pagado, estado
    ) values (
      v_num, r.asociado_id, r.lectura_id, p_mes_id,
      current_date, v_limite, r.lectura_anterior, r.lectura_actual, r.consumo_m3,
      v_conf.valor_m3, round(v_conf.valor_m3 * r.consumo_m3, 2), v_conf.cargo_fijo_administracion, 0, v_multas,
      round(v_conf.valor_m3 * r.consumo_m3, 2) + v_conf.cargo_fijo_administracion + v_multas, 0, 'PENDIENTE'
    );
    update public.lecturas set factura_generada = true where id = r.lectura_id;
    -- vincula multas a la factura recién creada
    update public.multas set factura_id = (select id from public.facturas where numero_factura=v_num)
      where asociado_id=r.asociado_id and estado='PENDIENTE' and independiente=false and factura_id is null;
    v_count := v_count + 1;
  end loop;

  update public.configuracion set siguiente_numero_factura = v_conf.siguiente_numero_factura where id=1;
  return v_count;
end $$;

-- ---------- agregar concepto ----------
create or replace function public.agregar_concepto(p_factura_id uuid, p_desc text, p_valor numeric)
returns void language plpgsql security definer set search_path = public as $$
declare v_est text;
begin
  if not public.is_staff() then raise exception 'No autorizado' using errcode='42501'; end if;
  if p_valor is null or p_valor <= 0 then raise exception 'Valor debe ser > 0'; end if;
  select estado into v_est from public.facturas where id=p_factura_id;
  if not found then raise exception 'Factura no existe'; end if;
  if v_est in ('PAGADA','ANULADA') then raise exception 'No se puede agregar concepto a factura %', v_est; end if;
  insert into public.conceptos_factura(factura_id, descripcion, valor) values (p_factura_id, p_desc, p_valor);
  update public.facturas set valores_adicionales = valores_adicionales + p_valor,
    total = total + p_valor, updated_at = now() where id = p_factura_id;
end $$;

-- ---------- anular factura ----------
create or replace function public.anular_factura(p_factura_id uuid, p_motivo text)
returns void language plpgsql security definer set search_path = public as $$
declare v_est text;
begin
  if not public.is_staff() then raise exception 'No autorizado' using errcode='42501'; end if;
  select estado into v_est from public.facturas where id=p_factura_id;
  if not found then raise exception 'Factura no existe'; end if;
  if v_est = 'PAGADA' then raise exception 'No se puede anular factura PAGADA'; end if;
  if v_est = 'ANULADA' then return; end if;
  update public.facturas set estado='ANULADA', motivo_anulacion=p_motivo where id=p_factura_id;
  update public.multas set factura_id=null where factura_id=p_factura_id;
end $$;

-- ---------- registrar pago de factura (transacción) ----------
-- Retorna id del recibo creado.
create or replace function public.registrar_pago_factura(
  p_factura_id uuid, p_valor numeric, p_metodo text default 'EFECTIVO'
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_f record; v_mes_estado text; v_saldo numeric; v_pago uuid; v_rec uuid;
  v_num_rec text; v_num_mov text; v_conf record;
begin
  if not public.is_staff() then raise exception 'No autorizado' using errcode='42501'; end if;
  if p_valor is null or p_valor <= 0 then raise exception 'Valor debe ser > 0'; end if;
  select * into v_f from public.facturas where id=p_factura_id for update;
  if not found then raise exception 'Factura no existe'; end if;
  if v_f.estado in ('PAGADA','ANULADA') then raise exception 'Factura % no admite pagos', v_f.estado; end if;
  select estado into v_mes_estado from public.meses_contables where id=v_f.mes_contable_id;
  if v_mes_estado = 'CERRADO' then raise exception 'Mes CERRADO, no admite pagos'; end if;
  v_saldo := v_f.total - v_f.total_pagado;
  if p_valor > v_saldo then raise exception 'Valor % mayor al saldo %', p_valor, v_saldo; end if;

  select * into v_conf from public.configuracion where id=1 for update;
  v_num_rec := public.fmt_numero('REC-', v_conf.siguiente_numero_recibo, 6);
  v_num_mov := public.fmt_numero('ENT-', v_conf.siguiente_numero_entrada, 6);
  v_conf.siguiente_numero_recibo := v_conf.siguiente_numero_recibo + 1;
  v_conf.siguiente_numero_entrada := v_conf.siguiente_numero_entrada + 1;
  update public.configuracion set siguiente_numero_recibo=v_conf.siguiente_numero_recibo,
    siguiente_numero_entrada=v_conf.siguiente_numero_entrada where id=1;

  insert into public.pagos(factura_id, asociado_id, valor, metodo_pago, tesorero_id)
    values (p_factura_id, v_f.asociado_id, p_valor, coalesce(p_metodo,'EFECTIVO'), auth.uid())
    returning id into v_pago;

  insert into public.recibos(numero_recibo, pago_id, factura_id, asociado_id, valor, saldo_pendiente)
    values (v_num_rec, v_pago, p_factura_id, v_f.asociado_id, p_valor, v_saldo - p_valor)
    returning id into v_rec;

  insert into public.movimientos_tesoreria(numero, tipo, valor, metodo_pago, concepto, categoria, asociado_id, factura_id, recibo_id, mes_contable_id, usuario_id)
    values (v_num_mov, 'ENTRADA', p_valor, coalesce(p_metodo,'EFECTIVO'), 'PAGO_FACTURA '||v_f.numero_factura, 'RECAUDO', v_f.asociado_id, p_factura_id, v_rec, v_f.mes_contable_id, auth.uid());

  if (v_f.total_pagado + p_valor) >= v_f.total then
    update public.facturas set total_pagado = total_pagado + p_valor, estado='PAGADA' where id=p_factura_id;
  else
    update public.facturas set total_pagado = total_pagado + p_valor, estado='PAGADA_PARCIAL' where id=p_factura_id;
  end if;
  return v_rec;
end $$;

-- ---------- pagar multa independiente ----------
create or replace function public.pagar_multa(
  p_multa_id uuid, p_metodo text default 'EFECTIVO'
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_m record; v_pago uuid; v_rec uuid; v_conf record; v_num_rec text; v_num_mov text;
begin
  if not public.is_staff() then raise exception 'No autorizado' using errcode='42501'; end if;
  select * into v_m from public.multas where id=p_multa_id for update;
  if not found then raise exception 'Multa no existe'; end if;
  if v_m.estado <> 'PENDIENTE' then raise exception 'Multa no está PENDIENTE'; end if;
  select * into v_conf from public.configuracion where id=1 for update;
  v_num_rec := public.fmt_numero('REC-', v_conf.siguiente_numero_recibo, 6);
  v_num_mov := public.fmt_numero('ENT-', v_conf.siguiente_numero_entrada, 6);
  update public.configuracion set siguiente_numero_recibo=siguiente_numero_recibo+1,
    siguiente_numero_entrada=siguiente_numero_entrada+1 where id=1;
  insert into public.pagos(multa_id, asociado_id, valor, metodo_pago, tesorero_id)
    values (p_multa_id, v_m.asociado_id, v_m.valor, coalesce(p_metodo,'EFECTIVO'), auth.uid())
    returning id into v_pago;
  insert into public.recibos(numero_recibo, pago_id, multa_id, asociado_id, valor, saldo_pendiente)
    values (v_num_rec, v_pago, p_multa_id, v_m.asociado_id, v_m.valor, 0)
    returning id into v_rec;
  insert into public.movimientos_tesoreria(numero, tipo, valor, metodo_pago, concepto, categoria, asociado_id, recibo_id, usuario_id)
    values (v_num_mov,'ENTRADA', v_m.valor, coalesce(p_metodo,'EFECTIVO'), 'PAGO_MULTA', 'RECAUDO', v_m.asociado_id, v_rec, auth.uid());
  update public.multas set estado='PAGADA' where id=p_multa_id;
  return v_rec;
end $$;

-- ---------- marcar vencidas (cron) ----------
create or replace function public.marcar_vencidas()
returns int language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  update public.facturas set estado='VENCIDA'
    where estado='PENDIENTE' and fecha_limite_pago < current_date;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- ---------- resumen financiero (replica /resumen-financiero) ----------
create or replace function public.resumen_financiero(p_asociado_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_out jsonb;
begin
  if not (public.is_staff() or p_asociado_id = public.my_asociado_id()) then
    raise exception 'No autorizado' using errcode='42501';
  end if;
  select jsonb_build_object(
    'facturas_pendientes', (select count(*) from public.facturas where asociado_id=p_asociado_id and estado in ('PENDIENTE','PAGADA_PARCIAL','VENCIDA')),
    'saldo_total', (select coalesce(sum(total-total_pagado),0) from public.facturas where asociado_id=p_asociado_id and estado in ('PENDIENTE','PAGADA_PARCIAL','VENCIDA')),
    'multas_pendientes', (select count(*) from public.multas where asociado_id=p_asociado_id and estado='PENDIENTE'),
    'total_multas', (select coalesce(sum(valor),0) from public.multas where asociado_id=p_asociado_id and estado='PENDIENTE'),
    'ultimas_facturas', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
      select numero_factura, total, total_pagado, estado, fecha_limite_pago
      from public.facturas where asociado_id=p_asociado_id order by fecha_emision desc limit 5
    ) x)
  ) into v_out;
  return v_out;
end $$;

-- ---------- enlaces públicos ----------
create or replace function public.crear_enlace_publico(p_tipo text, p_doc_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_tok text;
begin
  if not public.is_staff() then raise exception 'No autorizado' using errcode='42501'; end if;
  -- un solo activo por documento: borra anteriores
  delete from public.enlaces_publicos where tipo=p_tipo and documento_id=p_doc_id;
  v_tok := encode(gen_random_bytes(24),'hex');
  insert into public.enlaces_publicos(token, tipo, documento_id, expira_at)
    values (v_tok, p_tipo, p_doc_id, now() + interval '72 hours');
  return v_tok;
end $$;

create or replace function public.obtener_documento_por_token(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_e record;
begin
  select * into v_e from public.enlaces_publicos where token=p_token;
  if not found or v_e.expira_at < now() then
    raise exception 'Este enlace dejó de estar disponible' using errcode='P0002';
  end if;
  if v_e.tipo = 'FACTURA' then
    return (select to_jsonb(f) from public.facturas f where f.id=v_e.documento_id);
  else
    return (select to_jsonb(r) from public.recibos r where r.id=v_e.documento_id);
  end if;
end $$;

-- ---------- limpieza (cron diario) ----------
create or replace function public.limpieza_diaria()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_rep int; v_enl int; v_aud int;
begin
  delete from public.reportes_ciudadanos where created_at < now() - interval '8 days';
  get diagnostics v_rep = row_count;
  delete from public.enlaces_publicos where expira_at < now();
  get diagnostics v_enl = row_count;
  delete from public.auditoria where created_at < now() - interval '90 days';
  get diagnostics v_aud = row_count;
  perform public.marcar_vencidas();
  return jsonb_build_object('reportes_borrados',v_rep,'enlaces_borrados',v_enl,'auditoria_borrada',v_aud);
end $$;
