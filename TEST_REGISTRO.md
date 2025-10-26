# ✅ TEST: Verificar Registro y Login

## 🧪 Pasos para Probar

### 1. Registro de Nuevo Usuario
1. Ve a: `http://localhost:5173` (o tu URL de desarrollo)
2. Click en **"Acceder Gratis"** en cualquier plan
3. Completa el formulario:
   - Username
   - Email
   - Password
   - Confirma Password
4. Click en **"🚀 Crear cuenta y empezar prueba gratis"**

### 2. Verificar en Supabase

```sql
-- Ver el nuevo usuario creado
SELECT 
  up.username,
  up.email,
  up.nivel,
  up.trial_expires_at,
  NOW() as ahora,
  up.trial_expires_at - NOW() as dias_restantes
FROM user_profiles up
ORDER BY up.created_at DESC
LIMIT 5;
```

**Resultado esperado:**
- ✅ Username correcto
- ✅ Email correcto
- ✅ Nivel = 3 (Cliente VIP)
- ✅ trial_expires_at = fecha_actual + 7 días

### 3. Login

1. Cierra sesión (si estás logueado)
2. Ve a: `/login`
3. Ingresa email y password
4. Click en **"Iniciar Sesión"**
5. Deberías ser redirigido al dashboard

### 4. Verificar Trial Activo

```sql
-- Ver información del trial
SELECT 
  up.username,
  up.email,
  up.nivel,
  up.trial_expires_at,
  CASE 
    WHEN up.trial_expires_at > NOW() THEN 'Activo'
    ELSE 'Expirado'
  END as estado_trial,
  EXTRACT(DAY FROM (up.trial_expires_at - NOW()))::INTEGER as dias_restantes
FROM user_profiles up
WHERE up.email = 'tu@email.com';
```

## ✅ Checklist de Verificación

- [ ] Registro funciona sin "email en uso"
- [ ] Usuario se crea con nivel 3 (VIP)
- [ ] trial_expires_at se establece correctamente (+7 días)
- [ ] Login funciona correctamente
- [ ] Dashboard se muestra correctamente
- [ ] Usuario tiene acceso a todas las funciones (nivel 3)

## 🐛 Si Algo No Funciona

### Error: "Email ya en uso"
1. Ejecuta de nuevo el SQL de limpiar usuarios huérfanos
2. Verifica en Supabase Dashboard → Authentication → Users

### Error: "No se puede crear perfil"
```sql
-- Verificar si el usuario tiene perfil
SELECT * FROM user_profiles WHERE email = 'tu@email.com';

-- Si no existe, crear manualmente
INSERT INTO user_profiles (id, username, email, nivel, created_at, updated_at, trial_expires_at)
VALUES (
  'user_id_de_supabase',
  'tu_usuario',
  'tu@email.com',
  3,
  NOW(),
  NOW(),
  NOW() + INTERVAL '7 days'
);
```

### Error: "Login no funciona"
1. Verifica que el usuario existe en `auth.users`
2. Verifica credenciales en Supabase Dashboard → Authentication
3. Revisa consola del navegador para errores

## 📊 Ver Todos los Usuarios

```sql
-- Ver todos los usuarios con su estado
SELECT 
  au.email,
  up.username,
  up.nivel,
  up.trial_expires_at,
  au.email_confirmed_at,
  CASE 
    WHEN up.id IS NULL THEN 'Sin perfil'
    WHEN up.trial_expires_at > NOW() THEN 'Trial activo'
    WHEN up.trial_expires_at <= NOW() THEN 'Trial expirado'
    ELSE 'Sin trial'
  END as estado
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;
```

## 🎉 Éxito

Si todo funciona:
- ✅ **Registro exitoso**
- ✅ **Login funcional**
- ✅ **Trial de 7 días activo**
- ✅ **Usuario con nivel 3 (Cliente VIP)**

---

**Archivos importantes:**
- `services/authService.ts` - Maneja autenticación
- `services/trialService.ts` - Maneja trial de 7 días
- `services/userProfileService.ts` - Maneja perfiles
- `hooks/useAuth.ts` - Hook principal

**Documentación:**
- `SISTEMA_AUTENTICACION_MODULAR.md` - Documentación completa
- `RESUMEN_REFACTORIZACION.md` - Resumen del sistema
- `ORDER_OF_MIGRATION.md` - Orden de ejecución SQL


