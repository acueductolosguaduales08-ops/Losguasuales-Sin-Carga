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
