# 🔐 Instrucciones para Cambiar Contraseña de Usuario

## Opción 1: Usar el Panel de Administración (Recomendado)

1. Inicia sesión con un usuario de nivel **Dios (999)**
2. Ve al **Panel de Administración**
3. Busca el usuario `doblem2323@hotmail.com`
4. Haz clic en el botón de **Editar** (ícono de lápiz)
5. En el formulario de edición, verás una sección para **Cambiar Contraseña (Opcional)**
6. Ingresa la nueva contraseña: `Facil345`
7. Confirma la contraseña
8. Haz clic en **Guardar Cambios**

## Opción 2: Usar SQL Directo (Solo si la Opción 1 no funciona)

Si el panel de administración no funciona, puedes ejecutar este SQL directamente en el **SQL Editor** de Supabase:

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Navega a **SQL Editor**
4. Copia y pega el siguiente código:

```sql
-- Actualizar contraseña para doblemm2323@hotmail.com
-- IMPORTANTE: Esto requiere permisos de administrador en Supabase

UPDATE auth.users
SET 
  encrypted_password = crypt('Facil345', gen_salt('bf')),
  updated_at = now()
WHERE email = 'doblem2323@hotmail.com';

-- Verificar que se actualizó correctamente
SELECT id, email, updated_at 
FROM auth.users 
WHERE email = 'doblem2323@hotmail.com';
```

5. Haz clic en **RUN** (botón verde)
6. Verifica que se ejecutó correctamente

## Opción 3: Usar la API REST de Supabase (Avanzado)

Si tienes acceso a la `service_role_key`, puedes usar este script:

```bash
curl -X PUT 'https://rycifekzklqsnuczawub.supabase.co/auth/v1/admin/users/USER_ID' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"password": "Facil345"}'
```

Reemplaza:
- `USER_ID` con el ID del usuario (puedes obtenerlo con la consulta SQL de la Opción 2)
- `YOUR_SERVICE_ROLE_KEY` con tu service_role_key de Supabase

## Notas de Seguridad

⚠️ **IMPORTANTE**: 
- La contraseña `Facil345` es débil. Recomienda al usuario cambiarla después de iniciar sesión.
- Nunca expongas la `service_role_key` en el frontend o en repositorios públicos.
- Para producción, considera crear una Edge Function de Supabase para manejar cambios de contraseña de forma segura.

## Verificación

Después de cambiar la contraseña, el usuario debería poder:
1. Ir a la página de login
2. Ingresar el email: `doblem2323@hotmail.com`
3. Ingresar la contraseña: `Facil345`
4. Iniciar sesión exitosamente









