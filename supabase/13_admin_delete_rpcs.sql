-- =============================================================
-- 13_admin_delete_rpcs.sql  (idempotente; corre después de 12)
--
-- Borrado en cascada REAL (datos de prueba): cada RPC security
-- definer + public.is_admin() elimina la entidad y TODOS sus
-- dependientes (enlaces, pagos, recibos, movimientos, notas de
-- crédito, multas, facturas, lecturas, medidores). Devuelven
-- jsonb con conteos para mostrar en la UI.
--
-- Bloqueos de seguridad:
--  * factura con pagos/recibos → ADEMÁS los elimina (cascada total).
--  * lectura con factura_generada → bloqueada (inconsistencia).
--  * mes/año con dependientes → elimina TODO (cascada total).
-- =============================================================

-- ===================== CUENTA =====================
-- Borra la cuenta completa: auth.users (cascade elimina profiles).
create or replace function public.admin_eliminar_cuenta(p_id uuid)
returns jsonb language plpgsql volatile security definer
set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_id = auth.uid() then
    raise exception 'No puedes eliminar tu propia cuenta desde aquí.';
  end if;
  delete from public.profiles where id = p_id;
  delete from auth.users where id = p_id;
  if not found then
    raise exception 'Cuenta no encontrada.' using errcode = 'P0002';
  end if;
  return jsonb_build_object('ok', true, 'tipo', 'CUENTA');
end $$;

-- ===================== ASOCIADO =====================
create or replace function public.admin_eliminar_asociado(p_id uuid)
returns jsonb language plpgsql volatile security definer
set search_path = public as $$
declare
  v_facs int; v_rec int; v_pag int; v_mov int;
  v_nc int; v_mul int; v_lect int; v_med int; v_enl int; v_tmp int;
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if not exists (select 1 from public.asociados where id = p_id) then
    raise exception 'Asociado no encontrado.' using errcode = 'P0002';
  end if;

  -- Enlaces públicos de sus documentos
  delete from public.enlaces_publicos e
    where e.documento_id in (select f.id from public.facturas f where f.asociado_id = p_id);
  get diagnostics v_enl = row_count;
  delete from public.enlaces_publicos e
    where e.documento_id in (select r.id from public.recibos r where r.asociado_id = p_id);
  get diagnostics v_tmp = row_count;
  v_enl = v_enl + v_tmp;

  -- Historial financiero (cascada total, datos de prueba)
  delete from public.pagos where asociado_id = p_id;
  get diagnostics v_pag = row_count;
  delete from public.movimientos_tesoreria where asociado_id = p_id
    or recibo_id in (select r.id from public.recibos r where r.asociado_id = p_id)
    or factura_id in (select f.id from public.facturas f where f.asociado_id = p_id);
  get diagnostics v_mov = row_count;
  delete from public.recibos where asociado_id = p_id;
  get diagnostics v_rec = row_count;
  delete from public.notas_credito where asociado_id = p_id;
  get diagnostics v_nc = row_count;

  -- Facturas y dependientes
  delete from public.multas where asociado_id = p_id;
  get diagnostics v_mul = row_count;
  delete from public.facturas where asociado_id = p_id;
  get diagnostics v_facs = row_count;

  -- Medidor (lecturas en cascade)
  delete from public.medidores where asociado_id = p_id;
  get diagnostics v_med = row_count;

  -- Lecturas huérfanas posibles
  delete from public.lecturas where medidor_id not in (select id from public.medidores);
  get diagnostics v_lect = row_count;

  delete from public.asociados where id = p_id;
  if not found then
    raise exception 'No se pudo eliminar el asociado.';
  end if;

  return jsonb_build_object(
    'ok', true, 'tipo', 'ASOCIADO', 'cascada', true,
    'facturas', v_facs, 'recibos', v_rec, 'pagos', v_pag,
    'movimientos', v_mov, 'notas_credito', v_nc,
    'multas', v_mul, 'lecturas', v_lect, 'medidores', v_med,
    'enlaces', v_enl
  );
end $$;

-- ===================== FACTURA =====================
create or replace function public.admin_eliminar_factura(p_id uuid)
returns jsonb language plpgsql volatile security definer
set search_path = public as $$
declare
  v_enl int; v_rec int; v_pag int; v_mov int;
  v_nc int; v_mul int; v_con int;
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if not exists (select 1 from public.facturas where id = p_id) then
    raise exception 'Factura no encontrada.' using errcode = 'P0002';
  end if;

  delete from public.enlaces_publicos where tipo = 'FACTURA' and documento_id = p_id;
  get diagnostics v_enl = row_count;

  delete from public.pagos where factura_id = p_id;
  get diagnostics v_pag = row_count;
  delete from public.movimientos_tesoreria where factura_id = p_id
    or recibo_id in (select r.id from public.recibos r where r.factura_id = p_id);
  get diagnostics v_mov = row_count;
  delete from public.recibos where factura_id = p_id;
  get diagnostics v_rec = row_count;
  delete from public.notas_credito where factura_id = p_id;
  get diagnostics v_nc = row_count;
  delete from public.multas where factura_id = p_id;
  get diagnostics v_mul = row_count;
  delete from public.conceptos_factura where factura_id = p_id;
  get diagnostics v_con = row_count;

  delete from public.facturas where id = p_id;
  if not found then
    raise exception 'No se pudo eliminar la factura.';
  end if;

  return jsonb_build_object(
    'ok', true, 'tipo', 'FACTURA', 'cascada', true,
    'pagos', v_pag, 'recibos', v_rec, 'movimientos', v_mov,
    'notas_credito', v_nc, 'multas', v_mul, 'conceptos', v_con,
    'enlaces', v_enl
  );
end $$;

-- ===================== MULTA =====================
create or replace function public.admin_eliminar_multa(p_id uuid)
returns jsonb language plpgsql volatile security definer
set search_path = public as $$
declare
  v_pag int; v_rec int; v_mov int;
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if not exists (select 1 from public.multas where id = p_id) then
    raise exception 'Multa no encontrada.' using errcode = 'P0002';
  end if;

  -- Movimientos que apuntan a los recibos de esta multa (antes de borrar recibos)
  delete from public.movimientos_tesoreria mov
    where mov.recibo_id in (select id from public.recibos where multa_id = p_id);
  get diagnostics v_mov = row_count;

  delete from public.pagos where multa_id = p_id;
  get diagnostics v_pag = row_count;
  delete from public.recibos where multa_id = p_id;
  get diagnostics v_rec = row_count;

  delete from public.multas where id = p_id;
  if not found then
    raise exception 'No se pudo eliminar la multa.';
  end if;

  return jsonb_build_object(
    'ok', true, 'tipo', 'MULTA', 'cascada', true,
    'pagos', v_pag, 'recibos', v_rec, 'movimientos', v_mov
  );
end $$;

-- ===================== LECTURA =====================
create or replace function public.admin_eliminar_lectura(p_id uuid)
returns jsonb language plpgsql volatile security definer
set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if exists (select 1 from public.lecturas where id = p_id and factura_generada = true) then
    raise exception 'No se puede eliminar: la lectura ya generó una factura. Anula la factura primero.';
  end if;
  delete from public.lecturas where id = p_id;
  if not found then
    raise exception 'Lectura no encontrada.' using errcode = 'P0002';
  end if;
  return jsonb_build_object('ok', true, 'tipo', 'LECTURA');
end $$;

-- ===================== PERIODO (MES) =====================
create or replace function public.admin_eliminar_periodo(p_id uuid)
returns jsonb language plpgsql volatile security definer
set search_path = public as $$
declare
  v_facs int; v_lect int; v_mov int; v_facs_ids uuid[];
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if not exists (select 1 from public.meses_contables where id = p_id) then
    raise exception 'Período no encontrado.' using errcode = 'P0002';
  end if;

  select coalesce(array_agg(f.id), '{}'::uuid[]) into v_facs_ids
    from public.facturas f where f.mes_contable_id = p_id;

  v_facs := 0;
  if coalesce(array_length(v_facs_ids, 1), 0) > 0 then
    delete from public.enlaces_publicos where tipo = 'FACTURA' and documento_id = any(v_facs_ids);
    delete from public.pagos where factura_id = any(v_facs_ids);
    delete from public.movimientos_tesoreria where factura_id = any(v_facs_ids)
      or recibo_id in (select r.id from public.recibos r where r.factura_id = any(v_facs_ids));
    delete from public.recibos where factura_id = any(v_facs_ids);
    delete from public.notas_credito where factura_id = any(v_facs_ids);
    delete from public.multas where factura_id = any(v_facs_ids);
    delete from public.facturas where id = any(v_facs_ids);
    get diagnostics v_facs = row_count;
  end if;

  delete from public.movimientos_tesoreria where mes_contable_id = p_id;
  get diagnostics v_mov = row_count;
  delete from public.lecturas where mes_contable_id = p_id;
  get diagnostics v_lect = row_count;

  delete from public.meses_contables where id = p_id;
  if not found then
    raise exception 'No se pudo eliminar el período.';
  end if;

  return jsonb_build_object(
    'ok', true, 'tipo', 'PERIODO_CONTABLE', 'cascada', true,
    'facturas', v_facs, 'lecturas', v_lect, 'movimientos', v_mov
  );
end $$;

-- ===================== AÑO CONTABLE =====================
create or replace function public.admin_eliminar_anio(p_anio_id uuid)
returns jsonb language plpgsql volatile security definer
set search_path = public as $$
declare
  v_ids uuid[]; v_meses int;
  v_out jsonb; v_res jsonb; i int;
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if not exists (select 1 from public.anios_contables where id = p_anio_id) then
    raise exception 'Año no encontrado.' using errcode = 'P0002';
  end if;
  select coalesce(array_agg(m.id), '{}'::uuid[]) into v_ids
    from public.meses_contables m where m.anio_id = p_anio_id;
  v_meses := coalesce(array_length(v_ids, 1), 0);
  if v_meses = 0 then
    delete from public.anios_contables where id = p_anio_id;
    return jsonb_build_object('ok', true, 'tipo', 'ANIO_CONTABLE', 'meses', 0);
  end if;
  -- Cascada: delega en admin_eliminar_periodo por cada mes.
  v_out := jsonb_build_object('facturas', 0, 'lecturas', 0, 'movimientos', 0);
  for i in 1..array_length(v_ids, 1) loop
    v_res := public.admin_eliminar_periodo(v_ids[i]);
    v_out := jsonb_build_object(
      'facturas', (v_out->>'facturas')::int + coalesce((v_res->>'facturas')::int, 0),
      'lecturas', (v_out->>'lecturas')::int + coalesce((v_res->>'lecturas')::int, 0),
      'movimientos', (v_out->>'movimientos')::int + coalesce((v_res->>'movimientos')::int, 0)
    );
  end loop;
  delete from public.anios_contables where id = p_anio_id;
  return jsonb_build_object('ok', true, 'tipo', 'ANIO_CONTABLE',
    'meses', v_meses, 'cascada', v_out);
end $$;

-- ===================== MEDIDOR =====================
create or replace function public.admin_eliminar_medidor(p_id uuid)
returns jsonb language plpgsql volatile security definer
set search_path = public as $$
declare v_lect int;
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if not exists (select 1 from public.medidores where id = p_id) then
    raise exception 'Medidor no encontrado.' using errcode = 'P0002';
  end if;
  delete from public.lecturas where medidor_id = p_id;
  get diagnostics v_lect = row_count;
  delete from public.medidores where id = p_id;
  if not found then
    raise exception 'No se pudo eliminar el medidor.';
  end if;
  return jsonb_build_object('ok', true, 'tipo', 'MEDIDOR', 'lecturas', v_lect);
end $$;

-- ===================== RECIBO =====================
create or replace function public.admin_eliminar_recibo(p_id uuid)
returns jsonb language plpgsql volatile security definer
set search_path = public as $$
declare v_enl int; v_mov int;
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if not exists (select 1 from public.recibos where id = p_id) then
    raise exception 'Recibo no encontrado.' using errcode = 'P0002';
  end if;
  delete from public.movimientos_tesoreria where recibo_id = p_id;
  get diagnostics v_mov = row_count;
  delete from public.enlaces_publicos where tipo = 'RECIBO' and documento_id = p_id;
  get diagnostics v_enl = row_count;
  delete from public.recibos where id = p_id;
  if not found then
    raise exception 'No se pudo eliminar el recibo.';
  end if;
  return jsonb_build_object('ok', true, 'tipo', 'RECIBO', 'movimientos', v_mov, 'enlaces', v_enl);
end $$;

-- ===================== PAGO =====================
create or replace function public.admin_eliminar_pago(p_id uuid)
returns jsonb language plpgsql volatile security definer
set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if not exists (select 1 from public.pagos where id = p_id) then
    raise exception 'Pago no encontrado.' using errcode = 'P0002';
  end if;
  delete from public.pagos where id = p_id;
  if not found then
    raise exception 'No se pudo eliminar el pago.';
  end if;
  return jsonb_build_object('ok', true, 'tipo', 'PAGO');
end $$;

-- ===================== MOVIMIENTO =====================
create or replace function public.admin_eliminar_movimiento(p_id uuid)
returns jsonb language plpgsql volatile security definer
set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  delete from public.movimientos_tesoreria where id = p_id;
  if not found then
    raise exception 'Movimiento no encontrado.' using errcode = 'P0002';
  end if;
  return jsonb_build_object('ok', true, 'tipo', 'MOVIMIENTO');
end $$;

-- ===================== NOTIFICACIÓN =====================
create or replace function public.admin_eliminar_notificacion(p_id uuid)
returns jsonb language plpgsql volatile security definer
set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  delete from public.notificaciones where id = p_id;
  if not found then
    raise exception 'Notificación no encontrada.' using errcode = 'P0002';
  end if;
  return jsonb_build_object('ok', true, 'tipo', 'NOTIFICACION');
end $$;

-- ===================== FORMULARIO / ENCUESTA =====================
create or replace function public.admin_eliminar_formulario(p_id uuid)
returns jsonb language plpgsql volatile security definer
set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  delete from public.respuestas_pregunta where pregunta_id in (
    select id from public.preguntas_encuesta where encuesta_id = p_id);
  delete from public.preguntas_encuesta where encuesta_id = p_id;
  delete from public.respuestas_encuesta where encuesta_id = p_id;
  delete from public.encuestas where id = p_id;
  if not found then
    raise exception 'Formulario no encontrado.' using errcode = 'P0002';
  end if;
  return jsonb_build_object('ok', true, 'tipo', 'FORMULARIO');
end $$;

-- ---------- grants ----------
grant execute on function
  public.admin_eliminar_cuenta(uuid),
  public.admin_eliminar_asociado(uuid),
  public.admin_eliminar_factura(uuid),
  public.admin_eliminar_multa(uuid),
  public.admin_eliminar_lectura(uuid),
  public.admin_eliminar_periodo(uuid),
  public.admin_eliminar_anio(uuid),
  public.admin_eliminar_medidor(uuid),
  public.admin_eliminar_recibo(uuid),
  public.admin_eliminar_pago(uuid),
  public.admin_eliminar_movimiento(uuid),
  public.admin_eliminar_notificacion(uuid),
  public.admin_eliminar_formulario(uuid)
to authenticated;
