# 🚀 Guía de Migración a Supabase Auth - FACIL.UNO

## ✅ Cambios Completados

Tu aplicación ha sido **completamente migrada** a Supabase Auth con RLS. Ahora todos los datos se almacenan de forma segura en la nube.

### 📋 Resumen de Cambios

1. ✅ **Autenticación:** Migrado de localStorage a Supabase Auth
2. ✅ **Base de datos:** Todas las tablas usan `user_id` (UUID) en lugar de `username`
3. ✅ **RLS:** Políticas de seguridad configuradas con `auth.uid()`
4. ✅ **Componentes:** Actualizados para usar `useAuth` con Supabase
5. ✅ **Servicios:** Usan `userId` para todas las operaciones

---

## 🔧 Pasos para Completar la Configuración

### **PASO 1: Ejecutar SQL en Supabase** ⚡

Ve a tu Dashboard de Supabase → SQL Editor y ejecuta este SQL:

```sql
-- Copia TODO el contenido de:
docs/MIGRACION_SUPABASE_AUTH.sql
```

Este SQL creará:
- ✅ Tabla `user_profiles`
- ✅ Columna `user_id` en todas las tablas
- ✅ Políticas RLS con `auth.uid()`
- ✅ Trigger automático para crear perfiles
- ✅ Funciones actualizadas

---

### **PASO 2: Crear Usuarios de Prueba** 👥

#### Opción A: Desde Dashboard de Supabase (Recomendado)

1. Ve a **Authentication** → **Users** en tu Dashboard
2. Click en **Add user** → **Create new user**
3. Completa los datos:
   - **Email:** `erick@test.com`
   - **Password:** `123456` (mínimo 6 caracteres)
   - **User Metadata (JSON):**
   ```json
   {
     "username": "Erick",
     "nivel": 3
   }
   ```
4. **Confirm email:** Desactiva (para testing)

5. Repite para los otros usuarios:

   **Usuario Yael:**
   - Email: `yael@test.com`
   - Password: `123456`
   - Metadata: `{"username": "Yael", "nivel": 2}`

   **Usuario Pedro:**
   - Email: `pedro@test.com`
   - Password: `123456`
   - Metadata: `{"username": "Pedro", "nivel": 1}`

#### Opción B: Desde SQL

```sql
-- Insertar usuarios (requiere acceso al SQL con permisos de admin)
-- Nota: Esto es más avanzado, usa la opción A si es más simple
```

---

### **PASO 3: Configurar Email Confirmación** 📧

Para testing local, **desactiva** la confirmación de email:

1. Ve a **Authentication** → **Settings** → **Email Templates**
2. En **Email auth** encuentra **Confirm email**
3. Desactiva "Enable email confirmations" (solo para desarrollo)

O usa un servicio de email de prueba como Ethereal Email.

---

### **PASO 4: Reiniciar Servidor de Desarrollo** 🔄

```bash
# Detén el servidor actual (Ctrl+C)
npm run dev
```

Esto asegurará que las variables de entorno se carguen correctamente.

---

## 🔐 Niveles de Acceso

Los niveles se configuran en el `user_metadata.nivel` de cada usuario:

- **Nivel 0:** Invitado (solo calculadoras básicas)
- **Nivel 1:** Starter (calculadoras + Breakeven/ROAS)
- **Nivel 2:** Basic (todo excepto admin)
- **Nivel 3:** Pro/Admin (acceso completo)

---

## 🎯 Cómo Funciona Ahora

### Login
1. Usuario ingresa email y contraseña
2. Supabase Auth verifica credenciales
3. Si es correcto, obtiene el `user.id` (UUID)
4. Extrae `username` y `nivel` del `user_metadata`
5. La sesión se guarda automáticamente

### Almacenamiento de Datos
1. Cada operación usa `userId` (UUID de Supabase)
2. RLS verifica automáticamente con `auth.uid()`
3. Solo se ven los datos propios del usuario
4. Separación total de datos por usuario

### Historial y Pedidos
- SmartShip guarda pedidos con `user_id`
- PDF Generator guarda stock con `user_id`
- Información muestra solo datos del usuario autenticado
- Control automático de duplicados

---

## 🧪 Testing

### 1. Crear Usuario

En Supabase Dashboard → Authentication → Users:
```json
{
  "username": "TestUser",
  "nivel": 2
}
```

### 2. Iniciar Sesión

- Email: El que configuraste
- Password: La que configuraste
- Debe redirigir al dashboard automáticamente

### 3. Procesar Archivo

- Ve a SmartShip
- Sube un CSV
- Procesa el archivo
- **Revisa la consola:** Deberías ver logs de Supabase

### 4. Verificar en Supabase

- Ve a Table Editor → `pedidos_procesados`
- Deberías ver tus registros con `user_id` poblado

### 5. Ver Estadísticas

- Ve a la sección **Información**
- Deberías ver tus pedidos, stock y estadísticas

---

## 🐛 Troubleshooting

### Error: "Failed to fetch"

**Causa:** Las variables de entorno no están cargadas

**Solución:**
1. Verifica que `.env.local` existe
2. Reinicia el servidor: `npm run dev`
3. Verifica en consola que las variables están presentes

### Error: "new row violates row-level security policy"

**Causa:** Las políticas RLS no se ejecutaron correctamente

**Solución:**
1. Ejecuta `docs/MIGRACION_SUPABASE_AUTH.sql` completo
2. Verifica en Supabase → Authentication que el usuario existe
3. Verifica que estás autenticado (check en consola)

### Error: "null value in column user_id"

**Causa:** El userId no está llegando desde el hook

**Solución:**
1. Verifica que iniciaste sesión correctamente
2. En consola del navegador escribe: `localStorage.getItem('sb-...session')`
3. Debería haber una sesión activa

### No se ven datos en Información

**Causa:** Los datos se guardaron antes de la migración

**Solución:**
1. Procesa un archivo nuevo después de la migración
2. Verifica en consola los logs de guardado
3. Revisa en Supabase Table Editor

---

## 📊 Verificación de Migración

Ejecuta este checklist:

- [ ] SQL ejecutado en Supabase (`MIGRACION_SUPABASE_AUTH.sql`)
- [ ] Usuarios creados en Authentication
- [ ] Variables de entorno en `.env.local`
- [ ] Servidor reiniciado
- [ ] Login funciona correctamente
- [ ] Dashboard se muestra después de login
- [ ] Procesar archivo muestra logs en consola
- [ ] Datos aparecen en Supabase Table Editor
- [ ] Sección Información muestra estadísticas
- [ ] Logout funciona correctamente

---

## 🔄 Migración de Datos Antiguos (Opcional)

Si tienes datos en localStorage que quieres migrar:

```javascript
// En consola del navegador:
const oldData = JSON.parse(localStorage.getItem('historial_smartship_Erick') || '[]');
console.log('Datos antiguos:', oldData.length);

// Luego procesa esos archivos nuevamente con la nueva autenticación
// Los datos se guardarán automáticamente en Supabase
```

---

## 🎉 ¡Listo!

Tu aplicación ahora:
- ✅ Usa autenticación segura de Supabase
- ✅ Almacena datos en la nube
- ✅ Tiene RLS activo (máxima seguridad)
- ✅ Detecta duplicados automáticamente
- ✅ Controla stock despachado
- ✅ Identifica clientes recurrentes
- ✅ Genera estadísticas en tiempo real

---

**FACIL.UNO - Desarrollado por pictoN** 🚀

