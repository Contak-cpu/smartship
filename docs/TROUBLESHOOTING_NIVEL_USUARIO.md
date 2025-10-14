# 🔧 Troubleshooting - Nivel de Usuario

## Problema: El nivel del usuario baja a 0 después de un tiempo

### ✅ **Solución Implementada**

Se han implementado 3 mecanismos para mantener el nivel sincronizado:

#### 1. **Recarga automática al refrescar token**
- Cuando Supabase refresca el token (cada ~60 minutos), el perfil se recarga automáticamente
- Evento: `TOKEN_REFRESHED`

#### 2. **Verificación periódica (cada 5 minutos)**
- El sistema verifica el perfil cada 5 minutos
- Si detecta cambios, actualiza automáticamente

#### 3. **Recarga en eventos importantes**
- `SIGNED_IN` - Al iniciar sesión
- `TOKEN_REFRESHED` - Al refrescar token
- `USER_UPDATED` - Al actualizar usuario

---

## 🔍 **Cómo Verificar que Funciona**

### 1. Abre la consola del navegador (F12)

Deberías ver estos mensajes:

**Al iniciar sesión:**
```
🔄 Inicializando autenticación...
👤 Usuario autenticado, cargando perfil...
✅ Perfil de usuario cargado correctamente: {nivel: 999}
✅ Autenticación inicializada
```

**Cuando se refresca el token (cada ~60 min):**
```
🔔 Auth event: TOKEN_REFRESHED
👤 Cargando perfil después de evento de auth... TOKEN_REFRESHED
✅ Perfil recargado: 999
```

**Cada 5 minutos:**
```
🔄 Verificación periódica del perfil...
```

---

## 🐛 **Si Sigue Bajando a Nivel 0**

### Paso 1: Verificar en Supabase

```sql
-- Ver el nivel actual en la base de datos
SELECT 
  au.email,
  up.nivel,
  up.updated_at
FROM auth.users au
JOIN user_profiles up ON up.id = au.id
WHERE au.email = 'erick@gmail.com';
```

**Debería mostrar:** `nivel: 999`

---

### Paso 2: Limpiar caché del navegador

1. Presiona `Ctrl + Shift + Delete`
2. Selecciona:
   - ✅ Cookies y datos de sitios
   - ✅ Imágenes y archivos en caché
3. Limpia datos
4. Cierra TODAS las pestañas
5. Abre una nueva ventana incógnito
6. Inicia sesión

---

### Paso 3: Verificar políticas RLS

```sql
-- Ver políticas activas
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
AND cmd = 'SELECT';
```

**Debe mostrar:**
- `read_own_profile` o `usuarios_pueden_leer_su_perfil`

Si no aparece, ejecuta:

```sql
CREATE POLICY "usuarios_pueden_leer_su_perfil"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
```

---

### Paso 4: Forzar recarga del perfil

En la consola del navegador (F12), ejecuta:

```javascript
// Recargar perfil manualmente
window.location.reload(true);
```

O simplemente presiona `Ctrl + Shift + R`

---

## 📊 **Monitoreo en Tiempo Real**

### Agregar este código en la consola para monitorear el nivel:

```javascript
// Monitorear nivel cada 10 segundos
const monitorInterval = setInterval(() => {
  const level = window.localStorage.getItem('userLevel');
  console.log('📊 Nivel actual:', level, new Date().toLocaleTimeString());
}, 10000);

// Para detener el monitoreo:
// clearInterval(monitorInterval);
```

---

## 🔐 **Verificar Variables de Entorno**

Asegúrate de que tu archivo `.env.local` tenga:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

**NUNCA** uses la `service_role_key` en el frontend.

---

## 🚨 **Errores Comunes**

### Error: "500 Internal Server Error"

**Causa:** Políticas RLS conflictivas

**Solución:**
```sql
-- Eliminar todas las políticas y recrear
DROP POLICY IF EXISTS "usuarios_pueden_leer_su_perfil" ON user_profiles;

CREATE POLICY "usuarios_pueden_leer_su_perfil"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
```

---

### Error: "userProfile is null"

**Causa:** El perfil no existe en `user_profiles`

**Solución:**
```sql
-- Crear perfil manualmente
INSERT INTO user_profiles (id, username, email, nivel)
SELECT 
  id,
  SPLIT_PART(email, '@', 1),
  email,
  999
FROM auth.users
WHERE email = 'erick@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  nivel = 999,
  updated_at = NOW();
```

---

### Error: "Nivel baja después de 1 hora exacta"

**Causa:** Token de Supabase expira y no se recarga el perfil

**Solución:** Ya está implementada en el código. Si persiste:

1. Verifica que estés usando la última versión del código
2. Limpia caché del navegador
3. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

## 📝 **Logs de Debugging**

Para ver logs detallados en la consola:

1. Abre DevTools (F12)
2. Pestaña "Console"
3. Filtra por:
   - `Auth event` - Ver eventos de autenticación
   - `Perfil` - Ver carga de perfil
   - `Verificación` - Ver verificaciones periódicas

---

## ✅ **Checklist de Verificación**

- [ ] Nivel en Supabase es 999
- [ ] Políticas RLS están activas
- [ ] No hay errores en consola del navegador
- [ ] Se ve el badge "DIOS" en la navegación
- [ ] Se ve "👑 Panel Admin" en el sidebar
- [ ] Al abrir consola se ven los logs correctos
- [ ] Después de 10 minutos el nivel sigue siendo 999
- [ ] Después de 1 hora el nivel sigue siendo 999

---

## 🆘 **Si Nada Funciona**

### Solución Nuclear:

1. **Cerrar sesión**
2. **Ejecutar en Supabase:**
   ```sql
   -- Eliminar perfil
   DELETE FROM user_profiles WHERE email = 'erick@gmail.com';
   
   -- Recrear perfil
   INSERT INTO user_profiles (id, username, email, nivel)
   SELECT id, 'erick', email, 999
   FROM auth.users
   WHERE email = 'erick@gmail.com';
   ```
3. **Limpiar localStorage:**
   ```javascript
   localStorage.clear();
   ```
4. **Cerrar TODAS las pestañas del navegador**
5. **Abrir ventana incógnito**
6. **Iniciar sesión nuevamente**

---

## 📞 **Contacto**

Si después de seguir todos estos pasos el problema persiste, provee:

1. Screenshot de la consola con los logs
2. Screenshot del resultado de la query SQL del nivel
3. Navegador y versión que estás usando
4. ¿Cuánto tiempo pasa antes de que baje a nivel 0?

---

**Desarrollado por pictoN** 🚀

