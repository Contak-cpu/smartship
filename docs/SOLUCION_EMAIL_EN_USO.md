# 🔧 SOLUCIÓN: Email ya en uso

## 🐛 Problema

Al intentar registrarse, aparece el error "Email ya en uso" pero cuando revisas la tabla `user_profiles` en Supabase, no encuentras el email.

## 🔍 Causa

Este problema ocurre cuando un usuario fue creado en `auth.users` (tabla interna de Supabase) pero no se creó su perfil en `user_profiles`. Esto puede pasar si:

1. El registro se interrumpió antes de crear el perfil
2. Hubo un error al crear el perfil
3. Eliminaste el perfil manualmente pero no el usuario de `auth.users`

## ✅ Solución

### Opción 1: Limpiar usuarios huérfanos (RECOMENDADO)

Ejecuta este SQL en Supabase SQL Editor:

```sql
-- Primero, VER usuarios huérfanos
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- Luego, ELIMINAR solo usuarios sin email confirmado
DELETE FROM auth.users
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.id
  WHERE up.id IS NULL
    AND au.email_confirmed_at IS NULL
);
```

**⚠️ Importante:** Esto solo elimina usuarios que NO han confirmado su email. Es seguro.

### Opción 2: Recrear perfiles faltantes

Si quieres reutilizar esos usuarios existentes en lugar de eliminarlos:

```sql
INSERT INTO user_profiles (id, username, email, nivel, created_at, updated_at, trial_expires_at)
SELECT 
  au.id,
  SPLIT_PART(au.email, '@', 1) || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT AS username,
  au.email,
  3 AS nivel,
  au.created_at,
  NOW(),
  au.created_at + INTERVAL '7 days' AS trial_expires_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
```

### Opción 3: Eliminar SOLO el usuario problemático

Si solo necesitas eliminar un email específico:

```sql
-- Reemplaza 'tu@email.com' con tu email
DELETE FROM auth.users
WHERE email = 'tu@email.com';
```

## 📊 Archivo SQL Completo

He creado un archivo con todas las opciones:
- `docs/LIMPIAR_USUARIOS_HUERFANOS.sql`

Este archivo contiene:
1. Script para VER usuarios huérfanos
2. Script para ELIMINAR usuarios sin confirmar
3. Script para ELIMINAR todos los usuarios huérfanos
4. Script para RECREAR perfiles faltantes
5. Script de VERIFICACIÓN

## 🚀 Pasos para Solucionar

### Paso 1: Ir a Supabase
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto

### Paso 2: Abrir SQL Editor
1. Click en "SQL Editor" en el menú lateral
2. Click en "New query"

### Paso 3: Ejecutar Limpieza
1. Copia el contenido de `docs/LIMPIAR_USUARIOS_HUERFANOS.sql`
2. Pégalo en el editor
3. Ejecuta solo la sección "OPCIÓN 1" (más seguro)
4. Click en "Run"

### Paso 4: Verificar
1. Ejecuta la sección "VERIFICACIÓN POST-MIGRACIÓN"
2. Deberías ver "usuarios_huérfanos: 0"

### Paso 5: Intentar Registro de Nuevo
1. Vuelve a tu aplicación
2. Intenta registrarte con el mismo email
3. Ahora debería funcionar

## 💡 Prevención

Para evitar este problema en el futuro:

1. **Siempre confirma que el perfil se creó** después del registro
2. **No elimines manualmente** perfiles sin eliminar usuarios de `auth.users`
3. **Usa transacciones SQL** para operaciones que modifican múltiples tablas

## 📝 Notas Adicionales

- La tabla `auth.users` es el sistema interno de autenticación de Supabase
- La tabla `user_profiles` es tu tabla personalizada para perfiles
- Ambas tablas están vinculadas por el campo `id`
- Si eliminas un perfil manualmente, el usuario sigue en `auth.users`
- Por eso necesitas limpiar ambos para registrar de nuevo

## ✅ Verificación Final

Después de ejecutar el script, verifica:

```sql
-- No debería haber usuarios huérfanos
SELECT COUNT(*) as usuarios_huérfanos
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
-- Debe retornar: 0
```

---

**¿Todavía tienes problemas?**
1. Revisa la consola del navegador para errores
2. Verifica que ejecutaste el SQL correctamente
3. Asegúrate de que la tabla `user_profiles` existe


