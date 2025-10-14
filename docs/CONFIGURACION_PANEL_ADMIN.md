# 🔐 Configuración del Panel de Administración Dios

Este documento explica cómo configurar el Panel de Administración para usuarios nivel **Dios (999)**.

## 📋 Índice

1. [Requisitos previos](#requisitos-previos)
2. [Configuración de Supabase](#configuración-de-supabase)
3. [Asignar nivel Dios a tu usuario](#asignar-nivel-dios-a-tu-usuario)
4. [Funcionalidades del Panel Admin](#funcionalidades-del-panel-admin)
5. [Solución de problemas](#solución-de-problemas)

---

## ✅ Requisitos Previos

Antes de empezar, asegúrate de tener:

- ✅ Proyecto de Supabase configurado
- ✅ Tabla `user_profiles` creada (ver `docs/MIGRACION_SUPABASE_AUTH.sql`)
- ✅ Usuario registrado en la aplicación
- ✅ Acceso al SQL Editor de Supabase

---

## 🗄️ Configuración de Supabase

### Paso 1: Ejecutar el script de configuración

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Crea un nuevo query
4. Copia y pega el contenido completo de `docs/ADMIN_DIOS_SETUP.sql`
5. Haz clic en **Run** para ejecutar el script

Este script creará:
- ✅ Políticas RLS para que usuarios Dios puedan gestionar todos los perfiles
- ✅ Función `get_all_users_admin()` - Para obtener todos los usuarios
- ✅ Función `update_user_level()` - Para actualizar niveles de usuarios

### Paso 2: Verificar que las políticas se crearon

Ejecuta este comando en SQL Editor:

```sql
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
```

Deberías ver políticas como:
- `Usuarios Dios pueden ver todos los perfiles`
- `Usuarios Dios pueden actualizar cualquier perfil`
- `Usuarios Dios pueden crear perfiles`
- `Usuarios Dios pueden eliminar perfiles`

---

## 👤 Asignar Nivel Dios a tu Usuario

### Opción 1: Por Email (Recomendado)

```sql
-- 1. Encuentra tu usuario
SELECT id, email, username 
FROM auth.users 
WHERE email = 'TU_EMAIL@ejemplo.com';

-- 2. Actualiza el nivel a 999
UPDATE user_profiles 
SET nivel = 999, updated_at = NOW() 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'TU_EMAIL@ejemplo.com'
);

-- 3. Verifica que se actualizó
SELECT up.username, up.email, up.nivel 
FROM user_profiles up
WHERE up.nivel = 999;
```

### Opción 2: Por ID de Usuario

Si ya conoces tu ID de usuario:

```sql
UPDATE user_profiles 
SET nivel = 999, updated_at = NOW() 
WHERE id = 'TU_USER_ID_AQUI'::uuid;
```

### Importante ⚠️

- Después de actualizar el nivel a 999, **cierra sesión y vuelve a iniciar sesión** para que los cambios se reflejen
- Solo otorga nivel Dios a usuarios de confianza - tienen control total del sistema

---

## 🎛️ Funcionalidades del Panel Admin

Una vez que tengas nivel Dios, tendrás acceso a:

### 1. **Ver todos los usuarios** 📊
- Lista completa de usuarios registrados
- Email, nombre de usuario, nivel, último acceso
- Estado de verificación de email
- Fecha de creación

### 2. **Crear nuevos usuarios** ➕
- Crear usuarios con email y contraseña
- Asignar nivel de acceso inmediatamente
- Autoconfirmación de email
- Los usuarios reciben notificación por email

### 3. **Editar usuarios** ✏️
- Cambiar nombre de usuario
- Actualizar nivel de acceso
- Modificar permisos

### 4. **Gestionar niveles** 🎯

Los niveles disponibles son:

| Nivel | Nombre | Acceso |
|-------|--------|--------|
| 0 | Invitado | Calculadoras básicas |
| 1 | Starter | Calculadoras + funciones básicas |
| 2 | Básico | SmartShip + Historial |
| 3 | Intermedio | PDF Generator completo |
| 4 | Pro | Acceso total a funcionalidades |
| 999 | **Dios** | Control total del sistema |

### 5. **Resetear contraseñas** 🔑
- Enviar email de reseteo de contraseña
- El usuario recibe un link seguro para cambiar su contraseña

### 6. **Eliminar usuarios** 🗑️
- Eliminar usuarios del sistema
- ⚠️ Acción irreversible

### 7. **Ver estadísticas** 📈
- Total de usuarios
- Usuarios recientes (últimos 30 días)
- Usuarios por nivel
- Usuarios Dios

---

## 🚀 Acceso al Panel Admin

### Desde la navegación

Si eres usuario Dios, verás un botón especial en la barra de navegación:

```
[Panel Admin] <- Botón rojo/morado con gradiente
```

También tendrás un badge "DIOS" junto a tu nombre de usuario.

### Por URL directa

También puedes acceder directamente a:
```
https://tu-app.com/admin
```

Si no tienes nivel 999, verás un mensaje de "Acceso Denegado".

---

## 🛠️ Solución de Problemas

### Problema: "No puedo ver el botón Panel Admin"

**Soluciones:**

1. Verifica que tu nivel es 999:
```sql
SELECT username, nivel 
FROM user_profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'TU_EMAIL');
```

2. Cierra sesión y vuelve a iniciar sesión
3. Borra la caché del navegador (Ctrl+Shift+Del)

### Problema: "Acceso denegado al panel"

Verifica que las políticas RLS están creadas:

```sql
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND policyname LIKE '%Dios%';
```

Si no hay resultados, ejecuta de nuevo el script `ADMIN_DIOS_SETUP.sql`.

### Problema: "No puedo ver todos los usuarios"

Verifica que la función existe:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_all_users_admin';
```

Si no existe, ejecuta la sección de funciones del script SQL.

### Problema: "Error al crear usuario"

Esto puede pasar si:
- El email ya está registrado
- La contraseña es muy corta (mínimo 6 caracteres)
- Las políticas RLS no están configuradas correctamente

Verifica los errores en la consola del navegador (F12 > Console).

---

## 🔐 Seguridad

### Buenas Prácticas

1. ✅ **Otorga nivel Dios solo a usuarios de confianza**
2. ✅ **Usa contraseñas fuertes para usuarios Dios**
3. ✅ **Activa autenticación de dos factores (2FA) en Supabase**
4. ✅ **Revisa regularmente los usuarios con nivel Dios**
5. ✅ **Mantén un registro de cambios importantes**

### Auditoría

Para ver todos los usuarios Dios:

```sql
SELECT 
  up.username,
  up.email,
  up.nivel,
  au.created_at,
  au.last_sign_in_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.nivel = 999
ORDER BY au.created_at DESC;
```

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa la consola del navegador (F12 > Console)
2. Revisa los logs de Supabase (Dashboard > Logs)
3. Verifica que las políticas RLS estén activas
4. Asegúrate de tener la última versión del código

---

## 🎨 Personalización

### Cambiar niveles disponibles

Edita el archivo `services/adminService.ts` y modifica el array `NIVELES`:

```typescript
const NIVELES = [
  { value: 0, label: 'Invitado', description: '...' },
  { value: 1, label: 'Starter', description: '...' },
  // Agrega más niveles aquí
];
```

### Cambiar permisos por nivel

Edita `routes/routes.tsx` y modifica el `requiredLevel` de cada ruta:

```typescript
{
  path: '/mi-funcion',
  element: (
    <LevelProtectedRoute requiredLevel={2} sectionName="Mi Función">
      <MiFuncionPage />
    </LevelProtectedRoute>
  ),
}
```

---

## ✅ Checklist de Configuración

Usa esta checklist para asegurarte de que todo está configurado:

- [ ] Script `ADMIN_DIOS_SETUP.sql` ejecutado en Supabase
- [ ] Políticas RLS verificadas y activas
- [ ] Funciones `get_all_users_admin` y `update_user_level` creadas
- [ ] Usuario con nivel 999 creado
- [ ] Cerrado sesión y vuelto a iniciar sesión
- [ ] Botón "Panel Admin" visible en navegación
- [ ] Puede acceder a `/admin` sin problemas
- [ ] Puede ver lista de usuarios
- [ ] Puede crear nuevo usuario de prueba
- [ ] Puede editar usuario de prueba
- [ ] Puede eliminar usuario de prueba

---

**¡Todo listo!** 🎉

Ya tienes tu Panel de Administración Dios completamente funcional.

**Desarrollado por pictoN** 🚀


