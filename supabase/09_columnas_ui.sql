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
