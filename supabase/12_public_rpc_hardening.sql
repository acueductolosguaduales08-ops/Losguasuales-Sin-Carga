-- =============================================================
-- 12_public_rpc_hardening.sql  (idempotente; corre después de 08)
--
-- Endurece las RPC públicas de documentos:
--  1) factura_publica / recibo_publico  -> jsonb enriquecido, camelCase,
--     superset de las llaves que consume QueryCards.jsx
--     (numeroFactura/numeroRecibo, estado, total, total_pagado,
--      saldoPendiente, valor, fechaEmision) + asociado + conceptos +
--      multas + pagos, en lugar del to_jsonb(fila) plano.
--  2) obtener_documento_por_token -> mantiene el contrato de
--     enlaces_publicos (token aleatorio de 24 bytes, expira 72h) pero
--     devuelve { tipo, contenido:{...enriquecido..., institucional} }
--     listo para renderDocumentoPublicoDesdeRPC().
-- =============================================================

-- ---------- 1. factura pública por número ----------
create or replace function public.factura_publica(p_numero text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', f.id,
    'numero_factura', f.numero_factura,
    'numeroFactura', f.numero_factura,
    'asociado_id', f.asociado_id,
    'fecha_emision', f.fecha_emision,
    'fechaEmision', f.fecha_emision,
    'fecha_limite_pago', f.fecha_limite_pago,
    'fechaLimitePago', f.fecha_limite_pago,
    'lectura_anterior', f.lectura_anterior,
    'lectura_actual', f.lectura_actual,
    'consumo_m3', f.consumo_m3,
    'valor_m3', f.valor_m3,
    'valor_consumo', f.valor_consumo,
    'valorConsumo', f.valor_consumo,
    'cargo_administracion', f.cargo_administracion,
    'cargoAdministracion', f.cargo_administracion,
    'valores_adicionales', f.valores_adicionales,
    'total_multas', f.total_multas,
    'total', f.total,
    'total_pagado', f.total_pagado,
    'totalPagado', f.total_pagado,
    'saldoPendiente', f.total - f.total_pagado,
    'estado', f.estado,
    'createdAt', f.created_at,
    'asociado', to_jsonb(a),
    'asociadoNombre', a.nombres || ' ' || a.apellidos,
    'medidor', (select md.numero from public.medidores md where md.asociado_id = f.asociado_id limit 1),
    'conceptos', coalesce((
      select jsonb_agg(to_jsonb(jsonb_build_object(
        'descripcion', c.descripcion, 'valor', c.valor)) order by c.created_at)
      from public.conceptos_factura c where c.factura_id = f.id
    ), '[]'::jsonb),
    'multas', coalesce((
      select jsonb_agg(to_jsonb(jsonb_build_object(
        'motivo', m.motivo, 'valor', m.valor, 'fecha', m.fecha, 'estado', m.estado)))
      from public.multas m where m.factura_id = f.id
    ), '[]'::jsonb),
    'pagos', coalesce((
      select jsonb_agg(to_jsonb(jsonb_build_object(
        'valor', pg.valor, 'fecha', pg.fecha, 'metodo_pago', pg.metodo_pago)) order by pg.fecha)
      from public.pagos pg where pg.factura_id = f.id and pg.anulado = false
    ), '[]'::jsonb)
  )
  from public.facturas f
  join public.asociados a on a.id = f.asociado_id
  where f.numero_factura = p_numero
  limit 1;
$$;
grant execute on function public.factura_publica(text) to anon, authenticated;
revoke execute on function public.factura_publica(text) from public;

-- ---------- 2. recibo público por número ----------
create or replace function public.recibo_publico(p_numero text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', r.id,
    'numero_recibo', r.numero_recibo,
    'numeroRecibo', r.numero_recibo,
    'created_at', r.created_at,
    'fechaPago', (r.created_at)::date,
    'fecha_emision', r.created_at,
    'valor', r.valor,
    'saldo_pendiente', r.saldo_pendiente,
    'saldoPendiente', r.saldo_pendiente,
    'estado', r.estado,
    'asociado_id', r.asociado_id,
    'asociado', to_jsonb(a),
    'asociadoNombre', a.nombres || ' ' || a.apellidos,
    'factura', case when f.id is not null then to_jsonb(jsonb_build_object(
      'numeroFactura', f.numero_factura,
      'fecha_emision', f.fecha_emision,
      'total', f.total,
      'total_pagado', f.total_pagado,
      'estado', f.estado
    )) end,
    'numeroFactura', f.numero_factura,
    'multa', case when m.id is not null then to_jsonb(jsonb_build_object(
      'motivo', m.motivo, 'valor', m.valor, 'fecha', m.fecha, 'estado', m.estado
    )) end,
    'pago', case when pg.id is not null then to_jsonb(jsonb_build_object(
      'metodo_pago', pg.metodo_pago, 'fecha', pg.fecha, 'valor', pg.valor
    )) end,
    'conceptos', '[]'::jsonb,
    'multas', coalesce((
      select case when m.id is not null
        then jsonb_build_array(to_jsonb(jsonb_build_object(
          'motivo', m.motivo, 'valor', m.valor, 'fecha', m.fecha, 'estado', m.estado)))
        else '[]'::jsonb end
      from public.multas m2 where m2.id = r.multa_id
    ), '[]'::jsonb),
    'pagos', case when pg.id is not null then jsonb_build_array(to_jsonb(jsonb_build_object(
      'valor', pg.valor, 'fecha', pg.fecha, 'metodo_pago', pg.metodo_pago))) else '[]'::jsonb end
  )
  from public.recibos r
  join public.asociados a on a.id = r.asociado_id
  left join public.facturas f on f.id = r.factura_id
  left join public.multas m on m.id = r.multa_id
  left join public.pagos pg on pg.id = r.pago_id
  where r.numero_recibo = p_numero
  limit 1;
$$;
grant execute on function public.recibo_publico(text) to anon, authenticated;
revoke execute on function public.recibo_publico(text) from public;

-- ---------- 3. documento por token de enlace compartido ----------
create or replace function public.obtener_documento_por_token(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_e public.enlaces_publicos%rowtype;
  v_inst jsonb;
begin
  select * into v_e from public.enlaces_publicos where token = p_token;
  if not found or v_e.expira_at < now() then
    raise exception 'Este enlace dejó de estar disponible' using errcode = 'P0002';
  end if;

  select to_jsonb(c.*) into v_inst from (
    select nombre_acueducto, nit, direccion, telefono_principal, correo, banco,
           tipo_cuenta, numero_cuenta, titular_cuenta, notas_factura,
           logo_activo, firma_activa, sello_activo
    from public.configuracion where id = 1
  ) c;

  if v_e.tipo = 'FACTURA' then
    return jsonb_build_object(
      'tipo', 'FACTURA',
      'contenido', public.factura_publica((
        select f.numero_factura from public.facturas f where f.id = v_e.documento_id
      )) || jsonb_build_object('institucional', v_inst)
    );
  else
    return jsonb_build_object(
      'tipo', 'RECIBO',
      'contenido', public.recibo_publico((
        select r.numero_recibo from public.recibos r where r.id = v_e.documento_id
      )) || jsonb_build_object('institucional', v_inst)
    );
  end if;
end $$;
grant execute on function public.obtener_documento_por_token(text) to anon, authenticated;
revoke execute on function public.obtener_documento_por_token(text) from public;
