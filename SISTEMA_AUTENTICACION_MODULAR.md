# 🔐 Sistema de Autenticación Modular - DOCUMENTACIÓN

## 📋 Resumen del Sistema

El sistema de autenticación ha sido completamente refactorizado para ser **completamente modular**, separando las responsabilidades en servicios especializados:

### 🎯 Arquitectura Modular

```
┌─────────────────────────────────────────┐
│            hook/useAuth.ts              │
│     (Orquestador Principal)             │
└────────────┬────────────────────────────┘
             │
             ├─────────────────────┬───────────────────────┐
             │                     │                       │
    ┌────────▼─────────┐  ┌────────▼────────┐  ┌─────────▼─────────┐
    │  authService.ts  │  │  trialService.ts│  │userProfileService.ts│
    │                  │  │                  │  │                    │
    │ - signIn()       │  │ - getTrialInfo() │  │ - createUserProfile│
    │ - signUp()       │  │ - hasActiveTrial()│ │ - getUserProfile() │
    │ - signOut()      │  │ - initializeTrial│ │ - updateUserProfile│
    │ - getSession()   │  │ - checkExpiration│ │ - setUserLevel()   │
    └──────────────────┘  └──────────────────┘  └─────────────────────┘
```

---

## 🗂️ Servicios Creados

### 1. `services/authService.ts`
**Responsabilidad:** Manejar autenticación con Supabase

**Funciones:**
- `signIn(email, password)` - Inicia sesión
- `signUp(email, password, username, plan)` - Registra nuevo usuario
- `signOut()` - Cierra sesión
- `getCurrentSession()` - Obtiene sesión actual
- `getCurrentUser()` - Obtiene usuario actual
- `onAuthStateChange(callback)` - Escucha cambios de auth
- `resendConfirmationEmail(email)` - Reenvía email de confirmación

**Uso:**
```typescript
import { authService } from '../services/authService';

const result = await authService.signIn(email, password);
if (result.success) {
  console.log('✅ Login exitoso');
} else {
  console.error('❌ Error:', result.error);
}
```

---

### 2. `services/trialService.ts`
**Responsabilidad:** Sistema de prueba gratuita de 7 días

**Funciones:**
- `getTrialInfo(userId)` - Obtiene info del trial (días restantes, estado)
- `initializeTrial(userId)` - Inicializa trial para nuevo usuario
- `hasActiveTrial(userId)` - Verifica si tiene trial activo
- `updateLevelOnTrialExpiration(userId)` - Reduce nivel a 0 si el trial expiró
- `extendTrial(userId, days)` - Extiende el trial (solo admin)

**Interfaz TrialInfo:**
```typescript
interface TrialInfo {
  isActive: boolean;      // ¿Está activo?
  daysRemaining: number; // Días restantes
  startDate: string;     // Fecha inicio
  endDate: string;       // Fecha fin
  hasExpired: boolean;   // ¿Ya expiró?
}
```

**Uso:**
```typescript
import { getTrialInfo, hasActiveTrial } from '../services/trialService';

const trialInfo = await getTrialInfo(userId);
console.log(`Días restantes: ${trialInfo.daysRemaining}`);

if (await hasActiveTrial(userId)) {
  console.log('✅ Usuario tiene trial activo');
}
```

---

### 3. `services/userProfileService.ts`
**Responsabilidad:** Gestión de perfiles de usuario

**Funciones:**
- `createUserProfile(data)` - Crea perfil de usuario
- `getUserProfile(userId)` - Obtiene perfil de usuario
- `updateUserProfile(userId, updates)` - Actualiza perfil
- `deleteUserProfile(userId)` - Elimina perfil
- `getUserLevel(userId)` - Obtiene nivel de usuario
- `setUserLevel(userId, nivel)` - Establece nivel de usuario

**Interfaz UserProfile:**
```typescript
interface UserProfile {
  id: string;
  username: string;
  email: string;
  nivel: number;
  created_at?: string;
  updated_at?: string;
  trial_expires_at?: string; // ⭐ NUEVO: Campo para vencimiento
}
```

**Uso:**
```typescript
import { createUserProfile, getUserProfile } from '../services/userProfileService';

// Crear perfil
await createUserProfile({
  userId: user.id,
  username: 'usuario123',
  email: 'usuario@email.com',
  nivel: 3 // Cliente VIP
});

// Obtener perfil
const { profile } = await getUserProfile(userId);
console.log(`Nivel: ${profile.nivel}`);
```

---

## 🔧 Hook `useAuth` Refactorizado

### Cambios Principales:

1. **Sincronización Automática:**
   - Escucha cambios de autenticación en tiempo real
   - Carga automática de perfil al iniciar sesión
   - Verificación automática de vencimiento de trial

2. **Gestión de Estado:**
   ```typescript
   const { user, userProfile, isAuthenticated, isLoading } = useAuth();
   ```

3. **Funciones Simplificadas:**
   ```typescript
   await signIn(email, password);
   await signUp(email, password, username, plan);
   await signOut();
   ```

---

## 🔄 Flujo de Registro (7 días gratis)

```
1. Usuario hace clic en "Acceder Gratis"
   ↓
2. Se abre RegisterModal
   ↓
3. Usuario completa formulario
   ↓
4. signUp() crea usuario en Supabase Auth
   ↓
5. createUserProfile() crea perfil con nivel 3 (VIP)
   ↓
6. initializeTrial() establece trial_expires_at (7 días)
   ↓
7. Usuario accede inmediatamente
   ↓
8. Sistema verifica trial en cada login
   ↓
9. Si trial expiró → nivel = 0 (sin acceso)
```

---

## 🔄 Flujo de Login

```
1. Usuario ingresa email y password
   ↓
2. authService.signIn() valida credenciales
   ↓
3. Si exitoso → Supabase crea sesión
   ↓
4. useAuth detecta cambio → processSession()
   ↓
5. loadUserProfile() carga perfil desde DB
   ↓
6. checkTrialExpiration() verifica vencimiento
   ↓
7. Si trial expiró → updateLevelOnTrialExpiration()
   ↓
8. Usuario redirigido al dashboard
```

---

## 🚨 Sistema de Vencimiento

### ¿Cómo Funciona?

1. **Al crear cuenta:**
   - `trial_expires_at` = fecha actual + 7 días

2. **En cada login:**
   - Sistema verifica si `trial_expires_at` ya pasó
   - Si expiró Y el usuario tiene nivel 3 → reduce a nivel 0

3. **Para extender trial (admin):**
   ```typescript
   await extendTrial(userId, 7); // Agrega 7 días más
   ```

---

## 📊 Tabla `user_profiles` Actualizada

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  nivel INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trial_expires_at TIMESTAMP WITH TIME ZONE -- ⭐ NUEVO
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_user_profiles_trial ON user_profiles(trial_expires_at);
```

---

## ✅ Ventajas del Sistema Modular

### 1. **Separación de Responsabilidades**
- Cada servicio tiene un propósito específico
- Fácil de testear y mantener

### 2. **Reutilizable**
- Los servicios pueden usarse en cualquier parte de la app
- No dependen de React (pueden usarse fuera de componentes)

### 3. **Escalable**
- Agregar nuevas funcionalidades es simple
- No requiere tocar código existente

### 4. **Type-Safe**
- Todos los servicios están tipados con TypeScript
- Interfaces claras y documentadas

### 5. **Logging Integrado**
- Cada operación tiene logs descriptivos
- Fácil debuggear problemas

---

## 🐛 Solución de Problemas

### Problema: "Login no funciona"
**Solución:** Verifica que:
1. Las credenciales sean correctas
2. El usuario exista en `auth.users`
3. El perfil exista en `user_profiles`

### Problema: "Trial no inicializa"
**Solución:** Verifica que:
1. La columna `trial_expires_at` exista en la tabla
2. El usuario tenga un perfil creado
3. `initializeTrial()` se llame después de crear perfil

### Problema: "Usuario tiene nivel incorrecto"
**Solución:** Verifica que:
1. `updateLevelOnTrialExpiration()` se ejecute en cada login
2. El nivel se actualice correctamente en la DB
3. El perfil se recargue después de actualizar

---

## 📝 Migración SQL Requerida

Para que el sistema funcione completamente, ejecuta este SQL en Supabase:

```sql
-- Agregar columna trial_expires_at si no existe
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_expires_at 
ON user_profiles(trial_expires_at);

-- Actualizar registros existentes con trial_expires_at (opcional)
UPDATE user_profiles 
SET trial_expires_at = created_at + INTERVAL '7 days'
WHERE trial_expires_at IS NULL;
```

---

## 🎯 Próximos Pasos

1. ✅ Servicios modulares creados
2. ✅ `useAuth` refactorizado
3. ✅ Componentes actualizados
4. 🔲 Agregar tests unitarios
5. 🔲 Implementar renovación de trial
6. 🔲 Dashboard con días restantes de trial
7. 🔲 Notificaciones de vencimiento

---

## 📞 Soporte

Si tienes problemas con el sistema de autenticación:
1. Revisa los logs en la consola del navegador
2. Verifica que las tablas estén correctamente creadas
3. Asegúrate de ejecutar la migración SQL
4. Consulta la documentación de Supabase

---

**FACIL.UNO - Sistema de Autenticación Modular** 🚀


