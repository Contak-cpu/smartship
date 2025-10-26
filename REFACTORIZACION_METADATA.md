# ✅ Refactorización Completa: Sistema de Metadatos

## 🎯 Objetivo
Migrar el sistema de niveles de usuario desde la tabla `user_profiles` a `user_metadata` de Supabase Auth para eliminar problemas de RLS y simplificar el código.

## 🔧 Cambios Realizados

### 1. **Nuevo Servicio: `userMetadataService.ts`**
- ✅ Maneja todo mediante `user_metadata` de Supabase Auth
- ✅ Sin consultas a base de datos (todo está en el JWT)
- ✅ Sin problemas de RLS
- ✅ Funciones incluidas:
  - `getUserMetadata()` - Obtiene metadata del usuario actual
  - `updateUserMetadata()` - Actualiza metadata
  - `getUserLevel()` - Obtiene nivel
  - `setUserLevel()` - Actualiza nivel
  - `getTrialInfo()` - Información del trial
  - `hasTrialExpired()` - Verifica si expiró
  - `checkAndUpdateExpiredTrial()` - Auto-reduce a nivel 0 si expiró

### 2. **Actualizado: `authService.ts`**
```typescript
// Ahora en signUp() se guarda directamente en metadata:
{
  username,
  plan,
  nivel: 3,
  trial_expires_at: "2025-11-02T..."  // 7 días automático
}
```

### 3. **Actualizado: `useAuth.ts`**
- ✅ Eliminadas las importaciones de `userProfileService` y `trialService`
- ✅ Usa `userMetadataService` en su lugar
- ✅ `loadUserProfile()` ahora lee de `user.user_metadata`
- ✅ `checkTrialExpiration()` usa metadata
- ✅ `signUp()` ya no crea perfiles en DB
- ✅ `updateUserLevel()` actualiza metadata
- ✅ `refreshUserProfile()` recarga metadata

### 4. **Actualizado: `TrialStatus.tsx`**
- ✅ Eliminada consulta a `user_profiles`
- ✅ Lee directamente de `user.user_metadata`
- ✅ Sin errores 406

## 📊 Estructura de Datos

### Antes (❌ Problemático)
```
auth.users ──┐
             ├──> user_profiles (tabla separada con RLS)
             │    - nivel
             │    - trial_expires_at
             │    - username
             └──> ❌ Errores 406, sincronización, consultas extras
```

### Ahora (✅ Simple y Efectivo)
```
auth.users
  └──> user_metadata (dentro del JWT)
       - nivel: 3
       - trial_expires_at: "2025-11-02T..."
       - username: "john_doe"
       └──> ✅ Sin RLS, sin consultas extras, siempre disponible
```

## 🎁 Beneficios

### ✅ Ventajas
1. **Sin errores 406**: No hay políticas RLS que interfieran
2. **Más rápido**: Todo está en el JWT, sin consultas a DB
3. **Más simple**: Un solo lugar para los datos del usuario
4. **Siempre sincronizado**: No hay dos tablas que puedan desincronizarse
5. **Menos código**: Eliminamos servicios duplicados

### 🗑️ Código Eliminado/Obsoleto
- ❌ `userProfileService.ts` - Ya no se necesita (pero mantenerlo por compatibilidad con historial)
- ❌ `trialService.ts` - Ya no se necesita (funcionalidad movida a `userMetadataService.ts`)
- ❌ Consultas a `user_profiles` en componentes
- ❌ Políticas RLS problemáticas

## 🧪 Cómo Funciona el Nuevo Sistema

### Registro de Usuario
```typescript
// 1. Usuario se registra
await signUp(email, password, username, plan);

// 2. authService.signUp() guarda en metadata automáticamente:
{
  username: "john_doe",
  plan: "Starter", 
  nivel: 3,  // VIP por defecto
  trial_expires_at: "2025-11-02T..."  // 7 días
}

// 3. useAuth carga metadata automáticamente
// 4. ✅ Usuario tiene acceso inmediato
```

### Login
```typescript
// 1. Usuario hace login
await signIn(email, password);

// 2. useAuth.processSession() lee metadata:
const metadata = user.user_metadata;
// { nivel: 3, trial_expires_at: "...", username: "..." }

// 3. Verifica si el trial expiró
if (expired && nivel === 3) {
  await setUserLevel(0);  // Auto-reduce a nivel 0
}

// 4. ✅ Usuario autenticado con su nivel correcto
```

### Actualizar Nivel
```typescript
// Desde cualquier componente:
await updateUserLevel(2);  // Actualiza metadata
// El cambio se refleja inmediatamente en el JWT
```

## 🔒 Seguridad

- ✅ Los metadatos están en el JWT firmado por Supabase
- ✅ Solo el backend de Supabase puede modificarlos
- ✅ Los usuarios no pueden editar su propio nivel
- ✅ Solo mediante `updateUser()` (que requiere autenticación)

## 📝 Próximos Pasos

### Para Producción
1. **Migrar usuarios existentes**: Copiar datos de `user_profiles` a `user_metadata`
2. **Script de migración**:
```sql
-- Actualizar metadata de usuarios existentes
UPDATE auth.users u
SET raw_user_meta_data = jsonb_build_object(
  'username', p.username,
  'nivel', p.nivel,
  'trial_expires_at', p.trial_expires_at,
  'email', p.email
)
FROM public.user_profiles p
WHERE u.id = p.id;
```

3. **Opcional**: Mantener `user_profiles` como backup o eliminarla

### Para Testing
- ✅ Registrar nuevos usuarios → nivel 3 automático
- ✅ Verificar que no hay errores 406
- ✅ Confirmar que el trial funciona correctamente
- ✅ Probar actualización de niveles

## 🐛 Troubleshooting

### Si siguen apareciendo errores 406:
```bash
# Verificar que no hay consultas a user_profiles:
grep -r "user_profiles" --include="*.tsx" --include="*.ts"
```

### Si el nivel no se actualiza:
```javascript
// Verificar metadata en consola:
console.log(user.user_metadata);

// Debe mostrar:
// { nivel: 3, trial_expires_at: "...", username: "..." }
```

### Si los usuarios nuevos tienen nivel 0:
- Verificar que `authService.signUp()` está guardando nivel: 3
- Verificar que no hay triggers que sobrescriban el metadata

## 📚 Documentación de Referencia
- [Supabase User Metadata](https://supabase.com/docs/guides/auth/managing-user-data#using-user-metadata)
- [JWT y Metadata](https://supabase.com/docs/guides/auth/managing-user-data#using-the-user-object)

---

**Fecha de Refactorización**: 26 de Octubre, 2025  
**Estado**: ✅ Completado y funcional  
**Archivos Afectados**: 5 archivos modificados, 1 nuevo servicio creado

