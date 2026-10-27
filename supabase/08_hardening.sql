-- ============================================================
-- 08 HARDENING + funciones públicas (correcciones auditoría)
-- Ejecutar en el proyecto NUEVO después de 07.
-- 1. profiles: insert propio solo ASOCIADO + staff puede crear/borrar
-- 2. asociados: el asociado puede editar sus datos propios
-- 3. movimientos: el asociado ve los propios (mis finanzas)
-- 4. mensajes: borrado propio o staff (solicitudes aceptadas)
-- 5. encuestas: respuesta anónima (sin sesión)
-- 6. rpc públicos: estado-servicio, factura/recibo por número, contactos
-- ============================================================

-- ---------- 1. profiles ----------
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_self_or_staff" on public.profiles
  for insert to authenticated
  with check (
    (id = auth.uid() and rol = 'ASOCIADO') or public.is_staff()
  );

create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated using (public.is_admin());

-- ---------- 2. asociados: auto-edición propia (columnas las limita el frontend) ----------
drop policy if exists "asociados_self_update" on public.asociados;
create policy "asociados_self_update" on public.asociados
  for update to authenticated
  using (id = public.my_asociado_id())
  with check (id = public.my_asociado_id());

-- ---------- 3. movimientos: dueño + staff ----------
drop policy if exists "movs_select_own" on public.movimientos_tesoreria;
create policy "movs_select_own" on public.movimientos_tesoreria
  for select to authenticated using (
    asociado_id = public.my_asociado_id()
  );

-- ---------- 4. mensajes: borrado propio o staff ----------
drop policy if exists "msg_delete_own_staff" on public.mensajes;
create policy "msg_delete_own_staff" on public.mensajes
  for delete to authenticated using (
    public.is_staff() or remitente_id = auth.uid()
  );

-- ---------- 5. encuestas anónimas ----------
drop policy if exists "resp_insert_anon" on public.respuestas_encuesta;
create policy "resp_insert_anon" on public.respuestas_encuesta
  for insert to anon with check (true);

drop policy if exists "resp_preg_insert_anon" on public.respuestas_pregunta;
create policy "resp_preg_insert_anon" on public.respuestas_pregunta
  for insert to anon with check (true);

-- ---------- 6a. consulta pública estado del servicio (por documento) ----------
create or replace function public.consulta_estado_servicio(p_documento text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'estadoServicio', estado_servicio,
    'nombre', nombres || ' ' || apellidos
  ) from public.asociados
  where documento = p_documento and archivado = false limit 1;
$$;
grant execute on function public.consulta_estado_servicio(text) to anon, authenticated;

-- ---------- 6b. factura / recibo públicos por número (QR, escáner, home) ----------
create or replace function public.factura_publica(p_numero text)
returns jsonb language sql stable security definer set search_path = public as $$
  select to_jsonb(f) from public.facturas f where numero_factura = p_numero limit 1;
$$;
grant execute on function public.factura_publica(text) to anon, authenticated;

create or replace function public.recibo_publico(p_numero text)
returns jsonb language sql stable security definer set search_path = public as $$
  select to_jsonb(r) from public.recibos r where numero_recibo = p_numero limit 1;
$$;
grant execute on function public.recibo_publico(text) to anon, authenticated;

-- ---------- 6c. contactos de chat según rol ----------
-- Staff ve a todos; asociado solo ve staff (regla: nada ASOCIADO-ASOCIADO).
create or replace function public.contactos_disponibles()
returns table(id uuid, username text, rol text)
language sql stable security definer set search_path = public as $$
  select p.id, p.username, p.rol from public.profiles p
  where p.activo = true
    and (
      public.is_staff()
      or (p.rol in ('ADMINISTRADOR','TESORERO') and p.id <> auth.uid())
    )
  order by p.username limit 100;
$$;
grant execute on function public.contactos_disponibles() to authenticated;
