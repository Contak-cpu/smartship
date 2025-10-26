# Cómo Marcar Usuarios como Pagados

Como no tenemos un sistema de pagos integrado, necesitas marcar manualmente los usuarios que han pagado su plan actualizando sus metadatos en Supabase.

## Opción 1: Desde el Panel de Supabase (Recomendado)

1. Ve a tu panel de Supabase
2. Navega a Authentication > Users
3. Encuentra el usuario que quieres marcar como pagado
4. Haz clic en "User Metadata"
5. Agrega o actualiza el campo `is_paid` con el valor `true`
6. Guarda los cambios

## Opción 2: Con SQL en Supabase

Ejecuta el siguiente comando en el SQL Editor de Supabase para marcar un usuario específico como pagado:

```sql
-- Marcar un usuario específico como pagado por email (sin fecha de expiración)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{is_paid}', 
  'true'::jsonb
)
WHERE email = 'usuario@ejemplo.com';

-- Marcar un usuario como pagado hasta una fecha específica
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb), 
    '{is_paid}', 
    'true'::jsonb
  ),
  '{paid_until}',
  '"2025-11-26T23:59:59.000Z"'::jsonb
)
WHERE email = 'usuario@ejemplo.com';

-- Marcar un usuario específico como pagado por ID
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{is_paid}', 
  'true'::jsonb
)
WHERE id = 'ID_DEL_USUARIO';

-- Marcar TODOS los usuarios como pagados (usa con cuidado)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{is_paid}', 
  'true'::jsonb
)
WHERE email IS NOT NULL;

-- Desmarcar un usuario como pagado (ponerlo en trial nuevamente)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{is_paid}', 
  'false'::jsonb
)
WHERE email = 'usuario@ejemplo.com';
```

## Opción 3: Consultar el Estado de Pago de Usuarios

Para ver qué usuarios están marcados como pagados:

```sql
-- Ver todos los usuarios y su estado de pago
SELECT 
  id,
  email,
  raw_user_meta_data->>'is_paid' as is_paid,
  raw_user_meta_data->>'nivel' as nivel,
  raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;
```

## Verificación

Después de actualizar el estado de pago de un usuario, ese usuario podrá:
- Ver la sección "Cupones de Descuento" en su dashboard
- Copiar los códigos de cupón: `S054-CACOMERCIORE30%` y `S051-CUPONESTARAL30%`
- Acceder a la página `/cupones` sin restricciones

## Notas Importantes

- Los usuarios nuevos por defecto tienen `is_paid: false` (están en trial de 7 días)
- Solo los usuarios con `is_paid: true` pueden acceder a los cupones
- El campo `is_paid` se verifica en tiempo real cada vez que el usuario intenta acceder a la sección de cupones
- No confundas `is_paid` con el nivel (`nivel`) del usuario. Son conceptos separados:
  - `nivel`: Determina qué funcionalidades puede usar (0-3)
  - `is_paid`: Determina si puede acceder a cupones exclusivos

