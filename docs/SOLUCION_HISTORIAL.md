# 🔧 Solución: Historial y Base de Datos no Guarda

## Problema Identificado

Tu aplicación usa **autenticación local** (usuario/contraseña en localStorage), pero las tablas de Supabase tienen políticas RLS (Row Level Security) configuradas para **autenticación de Supabase** con JWT tokens.

### ¿Qué significa esto?

Las políticas actuales verifican `auth.jwt()`, pero como no hay usuarios autenticados en Supabase (solo localmente), las inserciones son **bloqueadas por RLS**.

## ✅ Solución

Tienes 2 opciones:

### **Opción 1: Deshabilitar RLS Temporalmente (Rápido) ⚡**

**Paso 1:** Ve a tu Dashboard de Supabase

**Paso 2:** Para cada tabla, deshabilita RLS temporalmente:

```sql
-- En SQL Editor de Supabase, ejecuta:

ALTER TABLE pedidos_procesados DISABLE ROW LEVEL SECURITY;
ALTER TABLE productos_pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_despachado DISABLE ROW LEVEL SECURITY;
ALTER TABLE historial_smartship DISABLE ROW LEVEL SECURITY;
ALTER TABLE historial_sku DISABLE ROW LEVEL SECURITY;
ALTER TABLE historial_rentabilidad DISABLE ROW LEVEL SECURITY;
```

**Ventajas:**
- ✅ Funciona inmediatamente
- ✅ No requiere cambios de código

**Desventajas:**
- ⚠️ Menos seguridad (cualquiera con tu ANON KEY podría insertar datos)
- ⚠️ Solo recomendado para desarrollo

---

### **Opción 2: Políticas RLS Permisivas (Recomendado) ✅**

**Paso 1:** Ejecuta el SQL del archivo `docs/SUPABASE_FIX_RLS.sql` en tu Dashboard de Supabase

```sql
-- Copia TODO el contenido de SUPABASE_FIX_RLS.sql
-- y ejecútalo en SQL Editor
```

Este script:
1. Elimina las políticas antiguas que verifican JWT
2. Crea políticas nuevas que permiten acceso
3. La separación por usuario se hace en el cliente con el campo `username`

**Ventajas:**
- ✅ RLS permanece habilitado (mejor práctica)
- ✅ Funciona con autenticación local
- ✅ Datos separados por campo `username`

**Desventajas:**
- ⚠️ Necesita migración a Supabase Auth en el futuro para seguridad máxima

---

### **Opción 3: Usar Solo LocalStorage (Alternativa)**

Si prefieres NO usar Supabase por ahora y mantener todo local:

**No hagas nada**, el sistema ya tiene fallback a localStorage. Los datos se guardarán localmente en el navegador.

**Ventajas:**
- ✅ Funciona sin configuración
- ✅ No requiere Supabase

**Desventajas:**
- ❌ Datos solo en el navegador (se pierden si limpias el cache)
- ❌ No hay sincronización entre dispositivos
- ❌ No hay backup en la nube

---

## 🚀 Recomendación

**Para desarrollo/testing:**
1. Ejecuta `SUPABASE_FIX_RLS.sql` (Opción 2)
2. Esto permitirá que funcione inmediatamente
3. Los datos se guardarán correctamente

**Para producción futura:**
1. Considera migrar a Supabase Auth (`SupabaseAuthContext.tsx` ya está creado)
2. Actualiza las políticas RLS para usar `auth.uid()`
3. Máxima seguridad

---

## 🔍 Verificación

Después de aplicar la solución:

1. **Procesa un archivo en SmartShip**
2. **Abre la consola del navegador (F12)**
3. **Busca estos mensajes:**

```
Guardando pedidos en Supabase...
✅ Pedidos procesados: X guardados, Y duplicados, 0 errores
```

4. **Ve a Información** → Deberías ver los pedidos

5. **En Supabase Dashboard:**
   - Ve a Table Editor
   - Abre `pedidos_procesados`
   - Deberías ver tus registros

---

## 📋 Checklist

- [ ] Ejecutar SQL de `SUPABASE_FIX_RLS.sql`
- [ ] Recargar aplicación (Ctrl+Shift+R)
- [ ] Procesar archivo de prueba
- [ ] Verificar logs en consola
- [ ] Revisar tabla en Supabase
- [ ] Verificar sección Información

---

## 🐛 Si Sigue Sin Funcionar

1. **Verifica las credenciales:**
   ```bash
   cat .env.local
   ```
   Asegúrate de que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén correctos

2. **Reinicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

3. **Verifica en Supabase Dashboard:**
   - Que las tablas existen
   - Que RLS está configurado correctamente

4. **Revisa la consola del navegador:**
   - Busca errores rojos
   - Comparte el error completo

---

**Desarrollado por pictoN para FACIL.UNO** 🚀

