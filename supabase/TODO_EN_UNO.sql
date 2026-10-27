-- TODO EN UNO: pega TODO este archivo en Supabase SQL Editor (proyecto NUEVO) y dale Run.
-- Orden: 01 > 02 > 03 > 04 > 05 > 06 > 07 > 08 > 09 > 11 (el 10 es importación de datos, separado)

-- ==================== 01_schema.sql ====================
-- ============================================================
-- ACUEDUCTO LOS GUADUALES — Supabase only (Opción A: Auth nativo)
-- Archivo 01: SCHEMA núcleo + comercial + comunidad
-- Ejecutar en Supabase SQL Editor en orden: 01 -> 02 -> 03 -> 04
-- IDs uuid para alinear con auth.users(id). Dinero numeric(12,2).
-- ============================================================

-- Extensiones
create extension if not exists "pgcrypto";

-- ---------- helpers timestamp ----------
-- created_at / updated_at se manejan desde cliente + trigger simple
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ================= NÚCLEO =================

create table public.asociados (
  id uuid primary key default gen_random_uuid(),
  codigo_interno text unique, -- ASO-00001
  tipo_documento text not null default 'CC'
    check (tipo_documento in ('CC','CE','TI','NIT','PASAPORTE')),
  documento text not null unique,
  nombres text not null,
  apellidos text not null,
  fecha_nacimiento date,
  telefono_principal text,
  telefono_alternativo text,
  correo text,
  direccion text not null,
  barrio_vereda text,
  observaciones text,
  estado_servicio text not null default 'ACTIVO'
    check (estado_servicio in ('ACTIVO','SUSPENDIDO','INACTIVO')),
  fecha_afiliacion date not null default current_date,
  fecha_suspension date,
  motivo_suspension text,
  fecha_reactivacion date,
  observaciones_administrativas text,
  archivado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_asociados_doc on public.asociados(documento);
create index idx_asociados_estado on public.asociados(estado_servicio) where archivado = false;

-- Perfiles ligados a Supabase Auth (sustituye tabla usuarios + BCrypt + JWT custom)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  email text,
  rol text not null default 'ASOCIADO'
    check (rol in ('ADMINISTRADOR','TESORERO','ASOCIADO')),
  asociado_id uuid references public.asociados(id) on delete set null,
  activo boolean not null default true,
  motivo_bloqueo text,
  ultimo_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_asociado on public.profiles(asociado_id);
create index idx_profiles_rol on public.profiles(rol);

create table public.medidores (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  asociado_id uuid unique references public.asociados(id) on delete set null,
  estado text not null default 'ACTIVO'
    check (estado in ('ACTIVO','EN_MANTENIMIENTO','DANADO','RETIRADO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.anios_contables (
  id uuid primary key default gen_random_uuid(),
  anio int not null unique,
  estado text not null default 'ACTIVO'
    check (estado in ('ACTIVO','CERRADO','ARCHIVADO')),
  created_at timestamptz not null default now()
);

create table public.meses_contables (
  id uuid primary key default gen_random_uuid(),
  anio_id uuid not null references public.anios_contables(id) on delete cascade,
  mes int not null check (mes between 1 and 12),
  nombre_mes text not null,
  estado text not null default 'ABIERTO'
    check (estado in ('ABIERTO','CERRADO','REABIERTO')),
  fecha_apertura date not null default current_date,
  fecha_cierre date,
  motivo_reapertura text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(anio_id, mes)
);

-- Singleton configuración id=1 (tarifas, banco, numeración, hero, flags)
create table public.configuracion (
  id int primary key check (id = 1),
  nombre_acueducto text not null default 'Acueducto Los Guaduales',
  nit text,
  direccion text,
  telefono_principal text,
  correo text,
  municipio text,
  departamento text,
  banco text,
  tipo_cuenta text,
  numero_cuenta text,
  titular_cuenta text,
  valor_m3 numeric(12,2) not null default 0,
  cargo_fijo_administracion numeric(12,2) not null default 0,
  valor_reconexion numeric(12,2) default 0,
  valor_multa_defecto numeric(12,2) default 0,
  dias_plazo_pago int not null default 15,
  dias_para_suspension int not null default 30,
  siguiente_numero_factura bigint not null default 1,
  siguiente_numero_recibo bigint not null default 1,
  siguiente_numero_entrada bigint not null default 1,
  siguiente_numero_salida bigint not null default 1,
  siguiente_numero_nota_credito bigint not null default 1,
  siguiente_numero_formulario bigint not null default 1,
  siguiente_codigo_asociado bigint not null default 1,
  notas_factura text,
  logo_activo text,
  firma_activa text,
  sello_activo text,
  modo_hero text not null default 'UNICO' check (modo_hero in ('UNICO','ALEATORIO_15MIN')),
  hero_rotacion_actual_id uuid,
  hero_rotacion_desde timestamptz,
  auditoria_activa boolean not null default true,
  edicion_asociados_activa boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.metodos_pago (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.lecturas (
  id uuid primary key default gen_random_uuid(),
  medidor_id uuid not null references public.medidores(id) on delete cascade,
  mes_contable_id uuid not null references public.meses_contables(id) on delete cascade,
  lectura_anterior int not null default 0,
  lectura_actual int not null,
  consumo_m3 int not null,
  factura_generada boolean not null default false,
  anulada boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(medidor_id, mes_contable_id),
  check (lectura_actual >= lectura_anterior)
);

-- ================= COMERCIAL =================

create table public.facturas (
  id uuid primary key default gen_random_uuid(),
  numero_factura text not null unique, -- FAC-000001
  asociado_id uuid not null references public.asociados(id) on delete restrict,
  lectura_id uuid references public.lecturas(id) on delete set null,
  mes_contable_id uuid not null references public.meses_contables(id) on delete restrict,
  fecha_emision date not null default current_date,
  fecha_limite_pago date not null,
  lectura_anterior int,
  lectura_actual int,
  consumo_m3 int,
  valor_m3 numeric(12,2),
  valor_consumo numeric(12,2) not null,
  cargo_administracion numeric(12,2) not null,
  valores_adicionales numeric(12,2) not null default 0,
  total_multas numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  total_pagado numeric(12,2) not null default 0,
  estado text not null default 'PENDIENTE'
    check (estado in ('PENDIENTE','PAGADA_PARCIAL','PAGADA','VENCIDA','ANULADA')),
  codigo_qr text,
  motivo_anulacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(asociado_id, mes_contable_id)
);
create index idx_facturas_asociado on public.facturas(asociado_id);
create index idx_facturas_estado on public.facturas(estado);
create index idx_facturas_mes on public.facturas(mes_contable_id);

create table public.conceptos_factura (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references public.facturas(id) on delete cascade,
  descripcion text not null,
  valor numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table public.multas (
  id uuid primary key default gen_random_uuid(),
  asociado_id uuid not null references public.asociados(id) on delete cascade,
  factura_id uuid references public.facturas(id) on delete set null,
  motivo text not null,
  valor numeric(12,2) not null,
  fecha date not null default current_date,
  estado text not null default 'PENDIENTE'
    check (estado in ('PENDIENTE','PAGADA','ANULADA')),
  independiente boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_multas_asociado on public.multas(asociado_id) where estado = 'PENDIENTE';

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid references public.facturas(id) on delete set null,
  multa_id uuid references public.multas(id) on delete set null,
  asociado_id uuid not null references public.asociados(id) on delete cascade,
  valor numeric(12,2) not null check (valor > 0),
  fecha date not null default current_date,
  metodo_pago text not null default 'EFECTIVO',
  tesorero_id uuid references public.profiles(id) on delete set null,
  anulado boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.recibos (
  id uuid primary key default gen_random_uuid(),
  numero_recibo text not null unique, -- REC-000001
  pago_id uuid references public.pagos(id) on delete set null,
  factura_id uuid references public.facturas(id) on delete set null,
  multa_id uuid references public.multas(id) on delete set null,
  asociado_id uuid not null references public.asociados(id) on delete cascade,
  valor numeric(12,2) not null,
  saldo_pendiente numeric(12,2) not null default 0,
  estado text not null default 'EMITIDO' check (estado in ('EMITIDO','ANULADO')),
  codigo_qr text,
  created_at timestamptz not null default now()
);

create table public.movimientos_tesoreria (
  id uuid primary key default gen_random_uuid(),
  numero text not null, -- ENT-000001 / SAL-000001
  tipo text not null check (tipo in ('ENTRADA','SALIDA')),
  fecha date not null default current_date,
  valor numeric(12,2) not null check (valor > 0),
  metodo_pago text not null default 'EFECTIVO',
  concepto text not null,
  categoria text not null default 'GENERAL',
  asociado_id uuid references public.asociados(id) on delete set null,
  factura_id uuid references public.facturas(id) on delete set null,
  recibo_id uuid references public.recibos(id) on delete set null,
  mes_contable_id uuid references public.meses_contables(id) on delete set null,
  usuario_id uuid references public.profiles(id) on delete set null,
  comprobante_url text,
  anulado boolean not null default false,
  motivo_anulacion text,
  created_at timestamptz not null default now(),
  unique(tipo, numero)
);
create index idx_mov_fecha on public.movimientos_tesoreria(fecha) where anulado = false;

create table public.movimientos_bancarios (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  descripcion text not null,
  valor numeric(12,2) not null,
  referencia text,
  estado text not null default 'PENDIENTE'
    check (estado in ('PENDIENTE','CONCILIADO','SIN_COINCIDENCIA')),
  tesoreria_id uuid references public.movimientos_tesoreria(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.notas_credito (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique, -- NC-000001
  asociado_id uuid not null references public.asociados(id) on delete cascade,
  factura_id uuid references public.facturas(id) on delete set null,
  valor numeric(12,2) not null check (valor > 0),
  motivo text not null,
  estado text not null default 'PENDIENTE'
    check (estado in ('PENDIENTE','APLICADA','ANULADA')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tarifas_historial (
  id uuid primary key default gen_random_uuid(),
  valor_m3 numeric(12,2) not null,
  cargo_fijo numeric(12,2) not null,
  vigente_desde date not null default current_date,
  creado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.enlaces_publicos (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  tipo text not null check (tipo in ('FACTURA','RECIBO')),
  documento_id uuid not null,
  expira_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ================= COMUNIDAD / PORTAL =================

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  created_at timestamptz not null default now()
);

create table public.etiquetas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique
);

create table public.publicaciones (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  contenido text not null,
  categoria_id uuid references public.categorias(id) on delete set null,
  estado text not null default 'BORRADOR'
    check (estado in ('BORRADOR','PUBLICADA','OCULTA')),
  destacada boolean not null default false,
  autor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.publicacion_etiquetas (
  publicacion_id uuid references public.publicaciones(id) on delete cascade,
  etiqueta_id uuid references public.etiquetas(id) on delete cascade,
  primary key (publicacion_id, etiqueta_id)
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  url text not null,
  oculto boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.reacciones_publicacion (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones(id) on delete cascade,
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  tipo text not null default 'LIKE',
  created_at timestamptz not null default now(),
  unique(publicacion_id, usuario_id)
);

create table public.encuestas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique, -- FRM-000001
  titulo text not null,
  descripcion text,
  estado text not null default 'BORRADOR'
    check (estado in ('BORRADOR','ACTIVA','FINALIZADA','ARCHIVADA')),
  publico boolean not null default false,
  requiere_auth boolean not null default true,
  respuesta_unica boolean not null default false,
  respuestas_anonimas boolean not null default false,
  fecha_inicio timestamptz,
  fecha_fin timestamptz,
  codigo_qr text,
  creado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.preguntas_encuesta (
  id uuid primary key default gen_random_uuid(),
  encuesta_id uuid not null references public.encuestas(id) on delete cascade,
  texto text not null,
  tipo text not null check (tipo in ('TEXTO_CORTO','TEXTO_LARGO','OPCION_UNICA','OPCION_MULTIPLE','ESCALA')),
  opciones jsonb not null default '[]',
  obligatoria boolean not null default true,
  orden int not null default 0
);

create table public.respuestas_encuesta (
  id uuid primary key default gen_random_uuid(),
  encuesta_id uuid not null references public.encuestas(id) on delete cascade,
  usuario_id uuid references public.profiles(id) on delete set null,
  anonimo_nombre text,
  created_at timestamptz not null default now()
);

create table public.respuestas_pregunta (
  id uuid primary key default gen_random_uuid(),
  respuesta_id uuid not null references public.respuestas_encuesta(id) on delete cascade,
  pregunta_id uuid not null references public.preguntas_encuesta(id) on delete cascade,
  valor_texto text,
  valores jsonb not null default '[]'
);

create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  mensaje text not null,
  tipo text not null default 'PUBLICA' check (tipo in ('PUBLICA','ASOCIADO')),
  prioridad text not null default 'NORMAL',
  estado text not null default 'ACTIVA' check (estado in ('ACTIVA','OCULTA','PROGRAMADA')),
  asociado_id uuid references public.asociados(id) on delete cascade,
  creado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.notificaciones_lectura (
  notificacion_id uuid references public.notificaciones(id) on delete cascade,
  usuario_id uuid references public.profiles(id) on delete cascade,
  leida_at timestamptz not null default now(),
  primary key (notificacion_id, usuario_id)
);

create table public.reportes_ciudadanos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  mensaje text not null,
  contacto text,
  imagen_url text,
  created_at timestamptz not null default now()
);

create table public.archivos_institucionales (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('LOGO','FIRMA','SELLO')),
  fuente text not null default 'URL' check (fuente in ('STORAGE','URL')),
  ruta text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.hero_links (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  link text not null,
  principal boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  modulo text not null,
  usuario_id uuid references public.profiles(id) on delete set null,
  usuario_nombre text,
  accion text not null,
  detalle jsonb,
  created_at timestamptz not null default now()
);
create index idx_auditoria_modulo on public.auditoria(modulo);
create index idx_auditoria_fecha on public.auditoria(created_at);

create table public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  participante_a uuid not null references public.profiles(id) on delete cascade,
  participante_b uuid not null references public.profiles(id) on delete cascade,
  ultimo_mensaje_at timestamptz,
  created_at timestamptz not null default now(),
  unique(participante_a, participante_b),
  check (participante_a <> participante_b)
);

create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references public.conversaciones(id) on delete cascade,
  remitente_id uuid not null references public.profiles(id) on delete cascade,
  texto text not null check (char_length(texto) <= 2000),
  leido boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_mensajes_conv on public.mensajes(conversacion_id, created_at);

create table public.solicitudes_eliminacion (
  id uuid primary key default gen_random_uuid(),
  mensaje_id uuid not null references public.mensajes(id) on delete cascade,
  solicitado_por uuid not null references public.profiles(id) on delete cascade,
  estado text not null default 'PENDIENTE'
    check (estado in ('PENDIENTE','ACEPTADA','RECHAZADA','CANCELADA')),
  created_at timestamptz not null default now()
);

-- Triggers updated_at
create trigger trg_asociados_u before update on public.asociados
  for each row execute function public.set_updated_at();
create trigger trg_profiles_u before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_facturas_u before update on public.facturas
  for each row execute function public.set_updated_at();
create trigger trg_lecturas_u before update on public.lecturas
  for each row execute function public.set_updated_at();


-- ==================== 02_rls.sql ====================
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


-- ==================== 03_functions.sql ====================
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


-- ==================== 04_seed.sql ====================
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


-- ==================== 05_storage.sql ====================
-- ============================================================
-- 05 STORAGE + REALTIME (ejecutar después de 04)
-- Buckets: comprobantes (privado, staff), reportes (público insert),
-- publicaciones (público lectura). Los logos ya usan ImageUploader.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('comprobantes','comprobantes', false),
       ('reportes','reportes', true),
       ('publicaciones','publicaciones', true)
on conflict (id) do nothing;

-- Limpia políticas viejas si re-ejecutas
drop policy if exists "staff_read_comprobantes" on storage.objects;
drop policy if exists "staff_write_comprobantes" on storage.objects;
drop policy if exists "public_read_publicaciones" on storage.objects;
drop policy if exists "staff_write_publicaciones" on storage.objects;
drop policy if exists "public_insert_reportes" on storage.objects;
drop policy if exists "public_read_reportes" on storage.objects;
drop policy if exists "staff_write_reportes" on storage.objects;

-- comprobantes: solo staff autenticado
create policy "staff_read_comprobantes" on storage.objects
  for select to authenticated using (bucket_id='comprobantes' and public.is_staff());
create policy "staff_write_comprobantes" on storage.objects
  for insert to authenticated with check (bucket_id='comprobantes' and public.is_staff());

-- publicaciones: lectura pública, escritura staff
create policy "public_read_publicaciones" on storage.objects
  for select to anon, authenticated using (bucket_id='publicaciones');
create policy "staff_write_publicaciones" on storage.objects
  for insert to authenticated with check (bucket_id='publicaciones' and public.is_staff());

-- reportes: cualquiera puede subir foto del reporte, lectura staff + pública para mostrar
create policy "public_insert_reportes" on storage.objects
  for insert to anon, authenticated with check (bucket_id='reportes');
create policy "public_read_reportes" on storage.objects
  for select to anon, authenticated using (bucket_id='reportes');
create policy "staff_write_reportes" on storage.objects
  for delete to authenticated using (bucket_id='reportes' and public.is_admin());

-- ---------- REALTIME ----------
-- Activa realtime para chat y notificaciones (supabase channel del frontend)
-- Idempotente: si re-ejecutas el archivo no falla.
do $$ begin
  if not exists (select 1 from pg_publication where pubname='supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='mensajes') then
    alter publication supabase_realtime add table public.mensajes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='conversaciones') then
    alter publication supabase_realtime add table public.conversaciones;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='notificaciones') then
    alter publication supabase_realtime add table public.notificaciones;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='publicaciones') then
    alter publication supabase_realtime add table public.publicaciones;
  end if;
end $$;


-- ==================== 06_cron.sql ====================
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


-- ==================== 07_fix_login.sql ====================
-- ============================================================
-- 07 FIX login por username (anon no puede leer profiles por RLS)
-- Función SECURITY DEFINER: solo devuelve el email para el username.
-- Ejecutar en el proyecto NUEVO (donde sí existe public.profiles).
-- ============================================================

create or replace function public.email_for_username(p_username text)
returns text language sql stable security definer set search_path = public as $$
  select email from public.profiles where username = p_username limit 1;
$$;

-- Permiso para que anon/autenticados la usen en el login
grant execute on function public.email_for_username(text) to anon, authenticated;


-- ==================== 08_hardening.sql ====================
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


-- ==================== 09_columnas_ui.sql ====================
-- ============================================================
-- 09 COLUMNAS UI (la app manda más campos de los creados en 01)
-- publicaciones: imagen_url, descripcion_corta, posicion_imagen
-- notificaciones: descripcion_corta, contenido_completo, enlace_url, fecha_vencimiento
-- Idempotente: se puede correr varias veces.
-- ============================================================

alter table public.publicaciones
  add column if not exists imagen_url text,
  add column if not exists descripcion_corta text,
  add column if not exists posicion_imagen text not null default 'ARRIBA';

alter table public.notificaciones
  add column if not exists descripcion_corta text,
  add column if not exists contenido_completo text,
  add column if not exists enlace_url text,
  add column if not exists fecha_vencimiento timestamptz;


-- ==================== 11_decimales.sql ====================
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

