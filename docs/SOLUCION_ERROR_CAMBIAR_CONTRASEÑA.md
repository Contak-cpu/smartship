# 🔧 Solución al Error: "Failed to execute 'json' on 'Response'"

## Problema

Al intentar cambiar la contraseña desde el panel de administración, aparece el error:
```
Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

## Causa

La API Admin de Supabase requiere la `service_role_key` para actualizar contraseñas directamente. Si no está configurada, la función falla.

## Solución Rápida: Usar SQL Directo (Recomendado)

La forma más rápida y segura de cambiar la contraseña es ejecutar este SQL en Supabase:

### Paso 1: Obtener el ID del usuario

Ejecuta en el SQL Editor de Supabase:

```sql
SELECT id, email FROM auth.users WHERE email = 'doblem2323@hotmail.com';
```

Anota el `id` que aparece.

### Paso 2: Actualizar la contraseña

Ejecuta este SQL (reemplaza `USER_ID_AQUI` con el ID obtenido):

```sql
-- Actualizar contraseña usando crypt de PostgreSQL
UPDATE auth.users
SET 
  encrypted_password = crypt('Facil345', gen_salt('bf')),
  updated_at = now()
WHERE id = 'USER_ID_AQUI';

-- Verificar que se actualizó
SELECT id, email, updated_at 
FROM auth.users 
WHERE id = 'USER_ID_AQUI';
```

### Paso 3: Verificar

El usuario debería poder iniciar sesión con:
- Email: `doblem2323@hotmail.com`
- Contraseña: `Facil345`

---

## Solución Alternativa: Configurar service_role_key (Para desarrollo)

Si quieres usar el panel de administración para cambiar contraseñas, necesitas configurar la `service_role_key`:

### Paso 1: Obtener la service_role_key

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia la **service_role key** (NO la anon/public key)

### Paso 2: Configurar en .env.local

Crea o edita el archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://rycifekzklqsnuczawub.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
VITE_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### Paso 3: Reiniciar el servidor

```bash
# Detén el servidor (Ctrl+C)
npm run dev
```

### Paso 4: Probar nuevamente

Ahora deberías poder cambiar contraseñas desde el panel de administración sin errores.

---

## ⚠️ Importante: Seguridad

**NUNCA** hagas lo siguiente:
- ❌ No subas el archivo `.env.local` al repositorio (ya está en `.gitignore`)
- ❌ No uses la `service_role_key` en producción desde el frontend
- ❌ No expongas la `service_role_key` en el código del cliente

**Para producción**, deberías:
- ✅ Crear una Edge Function de Supabase que maneje el cambio de contraseñas
- ✅ Usar la `service_role_key` solo en el backend/Edge Function
- ✅ Validar permisos en el backend antes de permitir cambios

---

## Verificación Final

Después de cambiar la contraseña (ya sea por SQL o por el panel), verifica que funciona:

1. Cierra sesión si estás logueado
2. Ve a la página de login
3. Ingresa:
   - Email: `doblem2323@hotmail.com`
   - Contraseña: `Facil345`
4. Deberías poder iniciar sesión exitosamente

---

## ¿Necesitas ayuda?

Si el problema persiste, verifica:
1. ✅ Que el usuario exista en `auth.users`
2. ✅ Que el email sea exactamente `doblem2323@hotmail.com` (verifica mayúsculas/minúsculas)
3. ✅ Que la extensión `pgcrypto` esté habilitada en Supabase (normalmente lo está por defecto)
4. ✅ Que tengas permisos de administrador en Supabase



