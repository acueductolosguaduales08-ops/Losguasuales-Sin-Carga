-- ============================================================
-- 02 RLS + helpers de rol (Opción A: Supabase Auth nativo)
-- Ejecutar DESPUÉS de 01_schema.sql
-- Modelo: profiles.id = auth.uid(). Roles en profiles.rol
-- ============================================================

-- Habilitar RLS en todo
alter table public.asociados enable row level security;
alter table public.profiles enable row level security;
alter table public.medidores enable row level security;
alter table public.anios_contables enable row level security;
alter table public.meses_contables enable row level security;
alter table public.configuracion enable row level security;
alter table public.metodos_pago enable row level security;
alter table public.lecturas enable row level security;
alter table public.facturas enable row level security;
alter table public.conceptos_factura enable row level security;
alter table public.multas enable row level security;
alter table public.pagos enable row level security;
alter table public.recibos enable row level security;
alter table public.movimientos_tesoreria enable row level security;
alter table public.movimientos_bancarios enable row level security;
alter table public.notas_credito enable row level security;
alter table public.tarifas_historial enable row level security;
alter table public.enlaces_publicos enable row level security;
alter table public.categorias enable row level security;
alter table public.etiquetas enable row level security;
alter table public.publicaciones enable row level security;
alter table public.publicacion_etiquetas enable row level security;
alter table public.videos enable row level security;
alter table public.reacciones_publicacion enable row level security;
alter table public.encuestas enable row level security;
alter table public.preguntas_encuesta enable row level security;
alter table public.respuestas_encuesta enable row level security;
alter table public.respuestas_pregunta enable row level security;
alter table public.notificaciones enable row level security;
alter table public.notificaciones_lectura enable row level security;
alter table public.reportes_ciudadanos enable row level security;
alter table public.archivos_institucionales enable row level security;
alter table public.hero_links enable row level security;
alter table public.auditoria enable row level security;
alter table public.conversaciones enable row level security;
alter table public.mensajes enable row level security;
alter table public.solicitudes_eliminacion enable row level security;

-- ---------- helpers (SECURITY DEFINER para evitar recursión RLS) ----------
create or replace function public.my_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select auth.uid();
$$;

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select rol from public.profiles where id = auth.uid();
$$;

create or replace function public.my_asociado_id()
returns uuid language sql stable security definer set search_path = public as $$
  select asociado_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol in ('ADMINISTRADOR','TESORERO') and activo = true
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'ADMINISTRADOR' and activo = true
  );
$$;

-- ---------- PROFILES ----------
-- Cada usuario lee/actualiza su propio perfil. Staff lee todos.
create policy "profiles_select_own_or_staff"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own_or_admin"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ---------- ASOCIADOS ----------
-- Asociado ve su propia ficha. Staff full.
create policy "asociados_select"
  on public.asociados for select to authenticated
  using (public.is_staff() or id = public.my_asociado_id());

create policy "asociados_staff_write"
  on public.asociados for insert to authenticated with check (public.is_staff());
create policy "asociados_staff_update"
  on public.asociados for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "asociados_staff_delete"
  on public.asociados for delete to authenticated using (public.is_admin());

-- ---------- MEDIDORES / LECTURAS / PERIODOS ----------
create policy "staff_read_all_medidores" on public.medidores
  for select to authenticated using (public.is_staff() or true);
-- Lecturas: asociado puede ver las de su medidor vía join indirecto; simplificamos:
-- lectura visible si staff o si el medidor pertenece a mi asociado.
create policy "lecturas_select" on public.lecturas
  for select to authenticated using (
    public.is_staff() or exists (
      select 1 from public.medidores m
      where m.id = lecturas.medidor_id and m.asociado_id = public.my_asociado_id()
    )
  );
create policy "lecturas_staff_write" on public.lecturas
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "medidores_staff_write" on public.medidores
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "periodos_select_auth" on public.anios_contables
  for select to authenticated using (true);
create policy "periodos_admin_write" on public.anios_contables
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "meses_select_auth" on public.meses_contables
  for select to authenticated using (true);
create policy "meses_admin_write" on public.meses_contables
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- CONFIGURACION / PAGOS / FACTURAS ----------
-- Config: lectura autenticada (tarifas se muestran en facturación), escritura solo admin.
create policy "config_select" on public.configuracion
  for select to authenticated using (true);
create policy "config_select_anon" on public.configuracion
  for select to anon using (true);
create policy "config_admin_write" on public.configuracion
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "metodos_select" on public.metodos_pago
  for select to authenticated using (true);
create policy "metodos_staff_write" on public.metodos_pago
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Facturas: dueño o staff. Escritura staff (generar/anular vía rpc con definer).
create policy "facturas_select" on public.facturas
  for select to authenticated using (
    public.is_staff() or asociado_id = public.my_asociado_id()
  );
create policy "facturas_staff_write" on public.facturas
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "conceptos_select" on public.conceptos_factura
  for select to authenticated using (true);
create policy "conceptos_staff_write" on public.conceptos_factura
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "multas_select" on public.multas
  for select to authenticated using (
    public.is_staff() or asociado_id = public.my_asociado_id()
  );
create policy "multas_staff_write" on public.multas
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "pagos_select" on public.pagos
  for select to authenticated using (
    public.is_staff() or asociado_id = public.my_asociado_id()
  );
create policy "pagos_staff_write" on public.pagos
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "recibos_select" on public.recibos
  for select to authenticated using (
    public.is_staff() or asociado_id = public.my_asociado_id()
  );
create policy "recibos_staff_write" on public.recibos
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "movs_select_staff" on public.movimientos_tesoreria
  for select to authenticated using (public.is_staff());
create policy "movs_write_staff" on public.movimientos_tesoreria
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "movbanc_staff" on public.movimientos_bancarios
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "nc_select" on public.notas_credito
  for select to authenticated using (
    public.is_staff() or asociado_id = public.my_asociado_id()
  );
create policy "nc_staff_write" on public.notas_credito
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "tarifas_select" on public.tarifas_historial
  for select to authenticated using (public.is_staff());
create policy "tarifas_admin_write" on public.tarifas_historial
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Enlaces públicos: lectura pública por token se hace vía función definer (ver 03).
create policy "enlaces_staff" on public.enlaces_publicos
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------- PORTAL público ----------
-- Publicaciones publicadas visibles para todos (incl. anon). Borradores solo staff.
create policy "pub_select" on public.publicaciones
  for select to anon, authenticated using (
    estado = 'PUBLICADA' or public.is_staff()
  );
create policy "pub_staff_write" on public.publicaciones
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "cat_select_all" on public.categorias
  for select to anon, authenticated using (true);
create policy "cat_staff_write" on public.categorias
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "etiq_select_all" on public.etiquetas
  for select to anon, authenticated using (true);
create policy "etiq_staff_write" on public.etiquetas
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "pubetiq_select" on public.publicacion_etiquetas
  for select to anon, authenticated using (true);
create policy "pubetiq_staff_write" on public.publicacion_etiquetas
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "videos_select" on public.videos
  for select to anon, authenticated using (oculto = false or public.is_staff());
create policy "videos_staff_write" on public.videos
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "reacc_select" on public.reacciones_publicacion
  for select to authenticated using (true);
create policy "reacc_write_own" on public.reacciones_publicacion
  for all to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Encuestas: públicas visibles según flags; resto staff. Responder vía rpc.
create policy "enc_select" on public.encuestas
  for select to anon, authenticated using (
    public.is_staff() or (estado = 'ACTIVA' and (publico = true or requiere_auth = false))
    or (estado = 'ACTIVA' and auth.uid() is not null)
  );
create policy "enc_staff_write" on public.encuestas
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "preg_select" on public.preguntas_encuesta
  for select to anon, authenticated using (true);
create policy "preg_staff_write" on public.preguntas_encuesta
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "resp_select_staff" on public.respuestas_encuesta
  for select to authenticated using (public.is_staff() or usuario_id = auth.uid());
create policy "resp_insert" on public.respuestas_encuesta
  for insert to authenticated with check (true);
create policy "resp_preg_all_auth" on public.respuestas_pregunta
  for all to authenticated using (true) with check (true);

-- Notificaciones públicas + propias
create policy "notif_select" on public.notificaciones
  for select to authenticated using (
    public.is_staff() or estado = 'ACTIVA'
  );
create policy "notif_select_anon" on public.notificaciones
  for select to anon using (tipo = 'PUBLICA' and estado = 'ACTIVA');
create policy "notif_staff_write" on public.notificaciones
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "notif_lectura_own" on public.notificaciones_lectura
  for all to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Reportes: crear público (anon), ver/borrar staff
create policy "reportes_insert_public" on public.reportes_ciudadanos
  for insert to anon, authenticated with check (true);
create policy "reportes_select_staff" on public.reportes_ciudadanos
  for select to authenticated using (public.is_staff());
create policy "reportes_delete_admin" on public.reportes_ciudadanos
  for delete to authenticated using (public.is_admin());

create policy "archivos_select" on public.archivos_institucionales
  for select to anon, authenticated using (true);
create policy "archivos_admin_write" on public.archivos_institucionales
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "hero_select" on public.hero_links
  for select to anon, authenticated using (true);
create policy "hero_admin_write" on public.hero_links
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "auditoria_staff" on public.auditoria
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Chat: participantes o staff. ASOCIADO no puede iniciar con otro ASOCIADO (se valida en rpc).
create policy "conv_select" on public.conversaciones
  for select to authenticated using (
    public.is_staff() or participante_a = auth.uid() or participante_b = auth.uid()
  );
create policy "conv_write" on public.conversaciones
  for all to authenticated using (
    public.is_staff() or participante_a = auth.uid() or participante_b = auth.uid()
  ) with check (
    public.is_staff() or participante_a = auth.uid() or participante_b = auth.uid()
  );

create policy "msg_select" on public.mensajes
  for select to authenticated using (
    public.is_staff() or exists (
      select 1 from public.conversaciones c
      where c.id = mensajes.conversacion_id
      and (c.participante_a = auth.uid() or c.participante_b = auth.uid())
    )
  );
create policy "msg_insert" on public.mensajes
  for insert to authenticated with check (remitente_id = auth.uid());
create policy "msg_update_own" on public.mensajes
  for update to authenticated using (remitente_id = auth.uid()) with check (remitente_id = auth.uid());

create policy "sol_select" on public.solicitudes_eliminacion
  for select to authenticated using (true);
create policy "sol_write" on public.solicitudes_eliminacion
  for all to authenticated using (true) with check (true);
