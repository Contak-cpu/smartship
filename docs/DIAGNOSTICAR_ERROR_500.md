# 🔍 DIAGNÓSTICO: Error 500 en Signup

## 🐛 Problema
```
POST https://rycifekzklqsnuczawub.supabase.co/auth/v1/signup 500 (Internal Server Error)
```

## 🔍 Posibles Causas

### 1. Trigger/Función Faltante
La base de datos podría estar intentando ejecutar un trigger que no existe.

**Ejecuta esto en Supabase SQL Editor:**

```sql
-- Ver triggers en user_profiles
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles';

-- Ver funciones relacionadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%user%' OR routine_name LIKE '%profile%';
```

### 2. Restricción en la Tabla
La tabla user_profiles podría tener restricciones que fallan.

**Verifica la estructura:**

```sql
-- Ver estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
```

### 3. Trigger Conflictivo
Si hay un trigger que intenta crear el perfil automáticamente.

**Deshabilitar triggers temporalmente:**

```sql
-- Ver triggers activos
SELECT * FROM pg_trigger WHERE tgname LIKE '%user%';

-- Si hay un trigger problemático, eliminarlo temporalmente
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON user_profiles;
```

## ✅ Solución Rápida

### Paso 1: Verificar que la tabla existe correctamente

```sql
-- Ver estructura completa
\d user_profiles
```

### Paso 2: Eliminar triggers/funciones conflictivos

```sql
-- Eliminar triggers que puedan causar problemas
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON user_profiles;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Eliminar funciones que puedan causar problemas
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS sync_user_metadata();
```

### Paso 3: Verificar configuración de Supabase

Ve a: **Supabase Dashboard → Authentication → Settings**

Verifica:
- ✅ **Email Auth** está habilitado
- ✅ **Disable signups** NO está marcado
- ✅ **Enable email confirmations** está configurado como quieras

### Paso 4: Intentar Registro Simple

Prueba con este formato mínimo:

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'test@test.com',
  password: 'test123456'
});
```

## 🔧 Solución Alternativa

Si el problema persiste, ejecuta este SQL que crea una tabla limpia:

```sql
-- Crear tabla limpia si no existe
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  nivel INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trial_expires_at TIMESTAMP WITH TIME ZONE
);

-- Eliminar triggers problemáticos
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON user_profiles;

-- No hay triggers automáticos ahora
-- Los perfiles se crearán manualmente desde la app
```

## 📊 Debug en Consola

Abre la consola del navegador y ejecuta:

```javascript
// Ver configuración actual
console.log('Supabase config:', {
  url: 'https://rycifekzklqsnuczawub.supabase.co',
  key: 'anón key configurado'
});

// Probar signup directo
supabase.auth.signUp({
  email: 'test@test.com',
  password: 'test123456'
}).then(console.log).catch(console.error);
```

## 🎯 Checklist de Verificación

- [ ] Tabla user_profiles existe
- [ ] Columna trial_expires_at existe
- [ ] No hay triggers conflictivos
- [ ] Email auth está habilitado en Supabase
- [ ] Signups no están deshabilitados
- [ ] Credenciales son correctas en .env

## 💡 Última Opción

Si nada funciona, prueba crear el usuario manualmente:

```sql
-- Crear usuario manualmente (solo para testing)
INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'test@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW()
);
```

---

**Archivo relacionado:** `docs/DIAGNOSTICAR_ERROR_500.md`


