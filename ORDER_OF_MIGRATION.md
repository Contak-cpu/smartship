# 🔄 ORDEN DE EJECUCIÓN DE LAS MIGRACIONES SQL

## ⚠️ IMPORTANTE: Ejecuta los SQL en este orden

### PASO 1: Agregar columna trial_expires_at (SÍ o SÍ primero)

```sql
-- Agregar columna trial_expires_at a user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- Crear índice para búsquedas rápidas de usuarios con trial activo
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_expires_at 
ON user_profiles(trial_expires_at);

-- Actualizar registros existentes con trial_expires_at
UPDATE user_profiles 
SET trial_expires_at = created_at + INTERVAL '7 days'
WHERE trial_expires_at IS NULL;

-- Comentario en la columna para documentación
COMMENT ON COLUMN user_profiles.trial_expires_at IS 
'Fecha de vencimiento del trial de 7 días gratis. Cuando expire, el usuario será degradado a nivel 0.';
```

**Ejecuta esto PRIMERO en Supabase SQL Editor**

---

### PASO 2: Limpiar usuarios huérfanos (Opcional)

Después del PASO 1, ejecuta:

```sql
-- Ver usuarios huérfanos (usuarios en auth.users sin perfil en user_profiles)
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- Eliminar SOLO usuarios sin email confirmado (MÁS SEGURO)
DELETE FROM auth.users
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.id
  WHERE up.id IS NULL
    AND au.email_confirmed_at IS NULL  -- Solo usuarios sin confirmar
);
```

---

### PASO 3: Verificación

```sql
-- Verificar que la columna existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'trial_expires_at';

-- Verificar que no hay usuarios huérfanos
SELECT COUNT(*) as usuarios_huérfanos
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
-- Debe retornar: 0
```

---

## 📝 RESUMEN

1. **SIEMPRE primero**: Ejecuta el PASO 1 para agregar la columna `trial_expires_at`
2. **Luego opcionalmente**: Ejecuta el PASO 2 para limpiar usuarios huérfanos
3. **Finalmente**: Ejecuta el PASO 3 para verificar

---

## 🚀 Enlace Rápido

Ejecuta los SQL en: https://supabase.com/dashboard/project/rycifekzklqsnuczawub
- SQL Editor → New query


