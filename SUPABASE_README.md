# 🚀 Integración de Supabase

Este documento describe la integración de Supabase en el proyecto FACIL.UNO para autenticación y gestión de base de datos.

## 📦 Instalación

La dependencia de Supabase ya está instalada:

```bash
npm install @supabase/supabase-js
```

## 🔧 Configuración

### Variables de Entorno

El proyecto utiliza las siguientes variables de entorno en `.env.local`:

```env
VITE_SUPABASE_URL=https://rycifekzklqsnuczawub.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

**Nota:** El archivo `.env.local` está en `.gitignore` por seguridad y no se sube al repositorio.

### Estructura de Archivos

```
lib/
  └── supabase.ts              # Cliente de Supabase configurado
contexts/
  ├── AuthContext.tsx          # Context de autenticación local (actual)
  └── SupabaseAuthContext.tsx  # Context de autenticación con Supabase (nuevo)
hooks/
  ├── useAuth.ts               # Hook para autenticación local (actual)
  └── useSupabaseAuth.ts       # Hook para autenticación con Supabase (nuevo)
components/
  └── SupabaseTest.tsx         # Componente de prueba de conexión
docs/
  └── SUPABASE_SETUP.md        # Documentación detallada
```

## 🎯 Uso Básico

### Cliente de Supabase

```typescript
import { supabase } from '../lib/supabase';

// Consultar datos
const { data, error } = await supabase
  .from('tabla')
  .select('*');

// Insertar datos
const { data, error } = await supabase
  .from('tabla')
  .insert({ columna: 'valor' });

// Actualizar datos
const { data, error } = await supabase
  .from('tabla')
  .update({ columna: 'nuevo_valor' })
  .eq('id', 123);

// Eliminar datos
const { data, error } = await supabase
  .from('tabla')
  .delete()
  .eq('id', 123);
```

### Autenticación con Supabase

```typescript
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

function MiComponente() {
  const { user, signIn, signOut } = useSupabaseAuth();

  const handleLogin = async () => {
    const { error } = await signIn('email@example.com', 'password');
    if (error) console.error('Error:', error);
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div>
      {user ? (
        <p>Bienvenido {user.email}</p>
      ) : (
        <button onClick={handleLogin}>Iniciar Sesión</button>
      )}
    </div>
  );
}
```

## 🔄 Migración del Sistema Actual

El proyecto actualmente usa autenticación local con `localStorage`. Para migrar a Supabase:

### Opción 1: Reemplazar completamente (Recomendado)

1. En `App.tsx`, reemplazar `AuthProvider` por `SupabaseAuthProvider`
2. Actualizar los componentes para usar `useSupabaseAuth` en lugar de `useAuth`
3. Configurar políticas de seguridad (RLS) en Supabase

### Opción 2: Mantener ambos sistemas

- Usar `useAuth` para autenticación local (actual)
- Usar `useSupabaseAuth` para funciones que requieran backend
- Sincronizar ambos sistemas cuando sea necesario

## 🧪 Prueba de Conexión

El componente `<SupabaseTest />` está disponible en el Dashboard y muestra:
- ✅ Estado de conexión con Supabase
- 🔑 Verificación de variables de entorno
- 📊 Diagnóstico de problemas

## 🔐 Seguridad

### Row Level Security (RLS)

Es **importante** configurar políticas de seguridad en Supabase:

1. Ve al Dashboard de Supabase
2. Selecciona tu tabla
3. Habilita RLS
4. Crea políticas según tus necesidades

Ejemplo de política básica:

```sql
-- Permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden leer"
ON tabla_nombre
FOR SELECT
TO authenticated
USING (true);

-- Permitir inserción solo de sus propios datos
CREATE POLICY "Usuarios pueden insertar sus datos"
ON tabla_nombre
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

## 📊 Esquema de Base de Datos Sugerido

### Tabla: users

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  username text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### Tablas para FACIL.UNO

Para ver el esquema completo de las tablas requeridas (historial_smartship, historial_sku, historial_rentabilidad), consulta:

📋 **[docs/SUPABASE_TABLES.md](docs/SUPABASE_TABLES.md)** - Esquema detallado de todas las tablas

Las tablas incluyen:
- `historial_smartship` - Archivos procesados de SmartShip
- `historial_sku` - PDFs generados con SKU
- `historial_rentabilidad` - Cálculos de rentabilidad

## 🌐 Deploy en Vercel

Las variables de entorno deben configurarse en Vercel:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 🔗 Recursos

- [Documentación oficial de Supabase](https://supabase.com/docs)
- [JavaScript Client Library](https://supabase.com/docs/reference/javascript/introduction)
- [Dashboard del proyecto](https://supabase.com/dashboard/project/rycifekzklqsnuczawub)
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

## 🐛 Troubleshooting

### Error: "supabaseUrl is required"

Asegúrate de que las variables de entorno estén configuradas en `.env.local`

### Error: "Invalid API key"

Verifica que la `VITE_SUPABASE_ANON_KEY` sea correcta

### RLS: No se pueden leer/escribir datos

Configura las políticas de Row Level Security en tu tabla

### Variables de entorno no se cargan en desarrollo

Reinicia el servidor de desarrollo con `npm run dev`

## 📝 Notas Importantes

- ⚠️ Nunca expongas tu `service_role_key` en el frontend
- ✅ Usa solo `anon_key` para el cliente
- 🔒 Siempre habilita RLS en tablas de producción
- 📦 Las variables de entorno en Vite deben tener el prefijo `VITE_`

---

**Desarrollado por pictoN** 🚀
**FACIL.UNO - Herramientas para Ecommerce**

