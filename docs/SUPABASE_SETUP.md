# 📋 Configuración de Supabase - FACIL.UNO

## Variables de Entorno Requeridas

Para que la aplicación funcione correctamente con Supabase, necesitas crear un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
VITE_SUPABASE_URL=https://rycifekzklqsnuczawub.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

## 🔧 Pasos para Configurar

### 1. Crear el archivo `.env.local`

En la raíz del proyecto, crea un nuevo archivo llamado `.env.local`

### 2. Obtener las credenciales de Supabase

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia los siguientes valores:
   - **Project URL** → esto es tu `VITE_SUPABASE_URL`
   - **anon/public key** → esto es tu `VITE_SUPABASE_ANON_KEY`

### 3. Completar el archivo `.env.local`

Pega las credenciales en tu archivo `.env.local`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Reiniciar el servidor de desarrollo

```bash
npm run dev
```

## ⚠️ Importante

- **NUNCA** uses la `service_role_key` en el frontend
- El archivo `.env.local` está en `.gitignore` y NO se debe subir al repositorio
- Para producción en Vercel, configura estas variables en:
  - Settings → Environment Variables

## 🔐 Seguridad

### Variables que SÍ se pueden usar en el frontend:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY` (anon/public key)

### Variables que NO se deben usar en el frontend:
- ❌ `service_role_key`
- ❌ API keys privadas

## 🚀 Deploy en Vercel

Para configurar las variables en Vercel:

1. Ve a tu proyecto en Vercel
2. Navega a **Settings** → **Environment Variables**
3. Agrega cada variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://tu-proyecto.supabase.co`
   - Environment: Production, Preview, Development
4. Repite para `VITE_SUPABASE_ANON_KEY`
5. Haz un nuevo deploy

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Variables de entorno en Vite](https://vitejs.dev/guide/env-and-mode.html)
- [Dashboard de Supabase](https://supabase.com/dashboard)

---

**FACIL.UNO - Desarrollado por pictoN** 🚀

