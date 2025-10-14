# ⚡ Inicio Rápido - FACIL.UNO con Supabase

## 🎯 Tu aplicación está lista, sigue estos pasos:

### **PASO 1: Ejecutar SQL en Supabase** (5 minutos)

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Navega a **SQL Editor**
4. **Copia y pega** el contenido completo de: `docs/MIGRACION_SUPABASE_AUTH.sql`
5. Click en **RUN** (botón verde)
6. Espera el mensaje de éxito ✅

---

### **PASO 2: Crear Tus Usuarios** (3 minutos)

Ve a **Authentication** → **Users** → **Add user**

#### Usuario 1: Erick (Admin - Nivel 3)
- **Email:** `erick@faciluno.com`
- **Password:** `erick123456`
- **Auto Confirm User:** ✅ Activar
- **User Metadata:**
```json
{
  "username": "Erick",
  "nivel": 3
}
```
Click **Create user**

#### Usuario 2: Yael (Basic - Nivel 2)
- **Email:** `yael@faciluno.com`
- **Password:** `yael123456`
- **Auto Confirm User:** ✅ Activar
- **User Metadata:**
```json
{
  "username": "Yael",
  "nivel": 2
}
```

#### Usuario 3: Pedro (Starter - Nivel 1)
- **Email:** `pedro@faciluno.com`
- **Password:** `pedro123456`
- **Auto Confirm User:** ✅ Activar
- **User Metadata:**
```json
{
  "username": "Pedro",
  "nivel": 1
}
```

---

### **PASO 3: Configurar Email** (1 minuto)

Ve a **Authentication** → **Settings** → **Auth**

Encuentra la sección **Email** y:
- ⚠️ **Desactiva** "Enable email confirmations" (solo para desarrollo)
- Esto permite login sin confirmar email

---

### **PASO 4: Reiniciar Tu Aplicación** (1 minuto)

En tu terminal:

```bash
# Detén el servidor actual (Ctrl+C si está corriendo)
npm run dev
```

---

### **PASO 5: Probar el Login** 🎉

1. **Abre:** http://localhost:3000
2. **Inicia sesión con:**
   - Email: `erick@faciluno.com`
   - Password: `erick123456`
3. **Deberías:**
   - Ver el dashboard
   - Tener acceso a todas las secciones (Nivel 3)

---

### **PASO 6: Probar SmartShip** 📦

1. Ve a **SmartShip**
2. Sube un archivo CSV de ventas
3. Procesa el archivo
4. **Abre la consola del navegador (F12)**
5. Deberías ver:
```
Guardando pedidos en Supabase...
✅ Pedidos procesados: 15 guardados, 0 duplicados, 0 errores
```

---

### **PASO 7: Verificar Datos en Supabase** 🔍

1. Ve a **Table Editor** en Supabase
2. Abre la tabla **`pedidos_procesados`**
3. Deberías ver:
   - Tus pedidos guardados
   - Columna `user_id` con el UUID del usuario
   - Columna `username` con "Erick"

---

### **PASO 8: Ver Estadísticas** 📊

1. En FACIL.UNO, ve a **Información**
2. Deberías ver:
   - Total de pedidos
   - Clientes únicos
   - Distribución domicilio/sucursal
   - Todas las estadísticas actualizadas

---

## 🎨 Características Disponibles

### Por Nivel de Usuario:

#### **Nivel 0 (Invitado)**
- Calculadora de Rentabilidad (sin historial)

#### **Nivel 1 (Starter)**
- ✅ Rentabilidad (con historial)
- ✅ Breakeven & ROAS

#### **Nivel 2 (Basic)**
- ✅ Todo lo anterior
- ✅ SmartShip (transformador de pedidos)
- ✅ Historial de Archivos
- ✅ **Información y Estadísticas** 🆕

#### **Nivel 3 (Pro/Admin)**
- ✅ Todo lo anterior
- ✅ Integrar SKU en Rótulos

---

## 🔄 Nuevas Funcionalidades

### 🆕 Sección Información

**Acceso:** Nivel 2+

**Características:**
- 📊 **Estadísticas en Tiempo Real**
  - Total de pedidos únicos
  - Clientes únicos
  - SKUs diferentes
  - Stock total despachado
  
- 📦 **Control de Pedidos**
  - Lista completa de pedidos
  - Filtro por tipo (domicilio/sucursal)
  - Detección automática de duplicados
  
- 🏷️ **Stock Despachado**
  - Por SKU
  - Cantidad total
  - Historial de despachos
  
- 👥 **Clientes Recurrentes**
  - Detecta clientes que compraron más de una vez
  - Cantidad de compras por cliente
  - Ordenados por frecuencia

---

## 📱 Flujo Completo

```
1. Login con Supabase Auth
   ↓
2. Procesar archivo en SmartShip
   ↓
3. Sistema guarda pedidos en Supabase
   ↓
4. Detecta duplicados automáticamente
   ↓
5. Generar PDF con SKUs
   ↓
6. Registra stock despachado
   ↓
7. Ver todo en sección Información
```

---

## 🔐 Seguridad

Tu aplicación ahora tiene:
- ✅ Autenticación JWT con Supabase
- ✅ Row Level Security (RLS) activo
- ✅ Datos encriptados en la nube
- ✅ Separación total por usuario
- ✅ Sesiones persistentes y seguras
- ✅ Tokens que se refrescan automáticamente

---

## 🆘 ¿Necesitas Ayuda?

### Consola del Navegador (F12)

Revisa los logs para diagnóstico:
```
✅ = Todo bien
⚠️ = Advertencia
❌ = Error
```

### Logs Importantes

```
Archivo guardado en Supabase para Erick: archivo.csv
✅ Pedidos procesados: 15 guardados, 0 duplicados, 0 errores
✅ Stock despachado guardado: 25 items
```

---

## 🚀 Próximos Pasos

1. **Testing:** Prueba todas las secciones
2. **Usuarios:** Crea los usuarios que necesites
3. **Deploy:** Sube a Vercel (las variables de entorno se configuran automáticamente)
4. **Producción:** Activa confirmación de email cuando estés listo

---

**¡Tu aplicación FACIL.UNO está lista para usar!** 🎉

**Desarrollado por pictoN** 🚀

