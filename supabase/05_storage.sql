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
