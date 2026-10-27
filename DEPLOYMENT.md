# 🚀 Guía de Despliegue en Cloudflare Pages con Wrangler

## Estado Actual del Proyecto
- ✅ **Frontend**: https://acueducto-los-guaduales.pages.dev/
- ✅ **Backend API**: https://acueducto-losguaduales-server.onrender.com/
- ✅ **Database**: Supabase (conectada al backend)
- ✅ **Build**: Vite (compilado y listo en carpeta `dist/`)

## Configuración Realizada
Se han realizado los siguientes cambios:

### 1. Variables de Entorno
- **`.env`** - Configuración local (desarrollo)
  ```
  VITE_API_BASE_URL=http://localhost:8080
  ```
- **`.env.production`** - Configuración producción
  ```
  VITE_API_BASE_URL=https://acueducto-losguaduales-server.onrender.com
  ```

### 2. Configuración Wrangler
- **`wrangler.toml`** - Configuración para Cloudflare Pages
  ```
  name = "acueducto-los-guaduales"
  type = "javascript"
  ```

### 3. Scripts de Deploy
En `package.json` se agregaron:
```json
"wrangler:login": "wrangler login",
"wrangler:deploy": "wrangler pages deploy dist --project-name=acueducto-los-guaduales"
```

## 🔐 Pasos para Desplegar

### Paso 1: Autenticarse con Cloudflare (Solo primera vez)
Abre una terminal en VS Code y ejecuta:
```bash
pnpm wrangler:login
```

Esto abrirá un navegador para que inicies sesión con tu cuenta de Cloudflare. Una vez autenticado, verás:
```
✅ Logged in successfully
```

### Paso 2: Compilar el proyecto (si no está compilado)
```bash
pnpm build
```

### Paso 3: Desplegar a Cloudflare Pages
```bash
pnpm wrangler:deploy
```

O manualmente:
```bash
pnpm wrangler pages deploy dist --project-name=acueducto-los-guaduales
```

## ✅ Verificación del Despliegue

1. Visita: https://acueducto-los-guaduales.pages.dev/
2. Abre DevTools (F12) > Console
3. Verifica que las llamadas API vayan a: `https://acueducto-losguaduales-server.onrender.com`

## 🔧 Cómo se conecta con el Backend

El proyecto usa `src/api/config.js` que lee la variable `VITE_API_BASE_URL`:

```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
```

**En Producción**: Usa `https://acueducto-losguaduales-server.onrender.com`
**En Desarrollo**: Usa `http://localhost:8080`

## 📝 Cambios Realizados

### Archivos Creados/Modificados:
1. ✅ `.env` - Variables de desarrollo
2. ✅ `.env.production` - Variables de producción
3. ✅ `wrangler.toml` - Configuración de Cloudflare
4. ✅ `package.json` - Scripts de deploy
5. ✅ `.gitignore` - Archivos a excluir del repositorio

### Próximos Pasos:
```bash
# 1. Hacer commit de los cambios
git add .
git commit -m "Configuración de Wrangler y variables de entorno para Cloudflare Pages"

# 2. Push a GitHub
git push

# 3. Login en Wrangler (primera vez)
pnpm wrangler:login

# 4. Desplegar
pnpm wrangler:deploy
```

## 🆘 Solución de Problemas

### ❌ Error: "wrangler: command not found"
**Solución**:
```bash
pnpm install -D wrangler
```

### ❌ Error: "Not authenticated with Cloudflare"
**Solución**:
```bash
pnpm wrangler:login
```

### ❌ Error: "Project not found"
1. Verifica que el nombre en `wrangler.toml` coincida con el proyecto en Cloudflare
2. O crea un nuevo proyecto primero:
```bash
pnpm wrangler pages create --project-name=acueducto-los-guaduales
```

### ❌ El frontend no se conecta al backend
1. Verifica que `VITE_API_BASE_URL` esté configurada correctamente
2. Reconstruye: `pnpm build`
3. Redeploya: `pnpm wrangler:deploy`

## 📚 Referencias
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-modes.html)
