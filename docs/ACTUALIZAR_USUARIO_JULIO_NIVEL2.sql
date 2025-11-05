-- Actualizar usuario juliobenitoalbornoz@gmail.com
-- Configuración: Nivel 2 (Básico), usuario pagado, expira 02/12/2025

-- Marcar como usuario pagado de nivel 2 hasta 02/12/2025
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb), 
        '{nivel}', 
        '2'::jsonb
      ),
      '{is_paid}', 
      'true'::jsonb
    ),
    '{paid_until}',
    '"2025-12-02T23:59:59.999Z"'::jsonb
  ),
  '{trial_expires_at}',
  '"2025-12-02T23:59:59.999Z"'::jsonb
)
WHERE email = 'juliobenitoalbornoz@gmail.com';

-- Verificar que se actualizó correctamente
SELECT 
  id,
  email,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'nivel' as nivel,
  raw_user_meta_data->>'is_paid' as is_paid,
  raw_user_meta_data->>'trial_expires_at' as trial_expires_at,
  raw_user_meta_data->>'paid_until' as paid_until,
  NOW() as fecha_actual,
  CASE 
    WHEN (raw_user_meta_data->>'paid_until')::timestamp > NOW() THEN 'Activo'
    ELSE 'Expirado'
  END as estado
FROM auth.users
WHERE email = 'juliobenitoalbornoz@gmail.com';















