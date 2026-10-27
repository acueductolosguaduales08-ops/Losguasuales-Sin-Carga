# Acueducto Supabase Only — migración sin Spring Boot

Copia independiente de `acueducto-original`. Funciona **solo con React + Supabase** (Opción A: Auth nativo). No necesita Render ni `VITE_API_BASE_URL`.

## Paso 1 — Crear proyecto Supabase NUEVO (Opción A, 10 min)

> NO uses el proyecto viejo del backend (tiene tablas Spring con ids integer).
> Crea uno nuevo para no romper Render mientras migras.

1. Ve a https://supabase.com/dashboard > New project (plan Free basta). Anota la password de la DB.
2. Settings > API: copia `Project URL` y `anon public key`.
3. SQL Editor > New query: pega y ejecuta EN ORDEN, uno por uno (cada uno debe decir Success):
   - `supabase/00_diagnostico.sql` (debe mostrar 0 tablas nuestras = proyecto limpio)
   - `supabase/01_schema.sql`
   - `supabase/02_rls.sql`
   - `supabase/03_functions.sql`
   - `supabase/04_seed.sql`
   - `supabase/05_storage.sql`
   - `supabase/06_cron.sql`
   - `supabase/07_fix_login.sql`
   - `supabase/08_hardening.sql` (permisos + consultas públicas + contactos chat)
   - `supabase/09_columnas_ui.sql` (imagen y descripción en publicaciones/notificaciones)
   - `supabase/10_importar_asociados.sql` (solo una vez, con tus datos)
   - `supabase/11_decimales.sql` (lecturas con decimales ej. 3.07)
   - `supabase/07_fix_login.sql`
   - Repite `00_diagnostico.sql`: ahora debe listar `profiles` y `asociados` con `data_type = uuid`.
4. Authentication > Providers > Email: actívalo y DESACTIVA `Confirm email` (si no, el login dirá "Email sin confirmar").
5. Authentication > Users > Add user > Create new user: email + password (8+ caracteres, marca `Auto Confirm user`). Copia el `UUID (UID)`.
6. SQL Editor, con tu UUID real:
```sql
insert into public.profiles (id, username, email, rol, activo)
values ('PEGA-UUID-AQUI', 'admin', 'tu-email@ejemplo.com', 'ADMINISTRADOR', true);
```
7. Verifica: `select * from public.profiles;` debe traer 1 fila.

## Paso 2 — Configurar frontend

```bash
cd acueducto-supabase-only
npm install
```

Edita `.env`, `.env.development` y `.env.production` con los datos del proyecto NUEVO:

```
VITE_SUPABASE_URL=https://tu-nuevo-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_BACKEND_MODE=supabase
```

> Ya NO se usa `VITE_API_BASE_URL`. Si existe, se ignora.
> Luego `npm run dev` y entra con tu username o email + password.

## Paso 3 — Cómo funciona el código

- `src/lib/supabaseClient.js`: singleton `createClient` + helpers `getSession, getMyProfile, isStaff`.
- `src/context/AuthContext.jsx`: **reemplazado** — usa `supabase.auth.signInWithPassword / signOut / getSession` + tabla `profiles`. Misma firma `{usuario, rol, isAuthenticated, loading, login, logout, puedeEditar, estadoServicio}` para no romper páginas.
- `src/api/supabase/*.js`: reemplazos directos de `src/api/*.js` (auth, asociados, configuracion, facturas...). Los viejos `client.js/config.js` quedan como `*.legacy.js` por referencia, pero ninguna página los importa en modo supabase.
- Funciones críticas (`generar_facturas_mes`, `registrar_pago_factura`, `pagar_multa`, `resumen_financiero`) son `rpc()` Postgres, no JS suelto — evita saldos rotos por doble clic.

## Paso 4 — Storage (ya lo tenías)

Reutiliza el bucket que usa `ImageUploader.jsx`. Crea si falta:

- Bucket `publicaciones` público lectura.
- Bucket `comprobantes` privado (solo staff).
- Bucket `reportes` público insert.

## Paso 5 — Crons (reemplazan @Scheduled Spring)

En Supabase Dashboard > Edge Functions o `pg_cron` programa diario:

```sql
select public.limpieza_diaria(); -- reportes>8d, enlaces expirados, auditoría>90d + marcar vencidas
```

Equivale a los jobs `00:10 vencidas, 00:20 reportes, 00:40 enlaces, 01:00 auditoría`.

## Estado de migración por módulo

- [x] Paso 0: copia + limpieza node_modules/dist
- [x] Paso 1: schema + RLS + functions + seed
- [x] Paso 2: Auth nativo + supabaseClient
- [ ] Paso 3: asociados, medidores, lecturas, periodos (siguiente)
- [ ] Paso 4: facturas, tesorería, recibos, multas, notas crédito
- [ ] Paso 5: portal (publicaciones, encuestas, notificaciones, chat realtime, reportes)
- [ ] Paso 6: informes PDF/QR lado cliente + enlaces públicos 72h

Si algo falla, la carpeta original `acueducto-original/` sigue intacta.
