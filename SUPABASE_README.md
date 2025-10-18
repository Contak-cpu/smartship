# 🚀 Sistema de Autenticación con Supabase

Este documento describe el sistema de autenticación optimizado de FACIL.UNO que utiliza metadata de Supabase Auth para gestión de usuarios y niveles de acceso.

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
hooks/
  └── useAuth.ts               # Hook principal de autenticación
components/
  └── debug/
      └── AuthDebugSimple.tsx  # Componente de debug (opcional)
docs/
  ├── SUPABASE_SETUP.md        # Setup inicial
  ├── SUPABASE_TABLES.md       # Estructura de tablas
  └── MIGRACION_COMPLETA_USUARIOS.sql # Script de migración
```

## 🎯 Sistema de Autenticación

### Hook Principal: useAuth

El sistema utiliza un solo hook optimizado que maneja autenticación y niveles de usuario:

```typescript
import { useAuth } from '../hooks/useAuth';

function MiComponente() {
  const { 
    user, 
    userProfile, 
    isLoading, 
    isAuthenticated, 
    userLevel, 
    username,
    signIn, 
    signOut,
    hasAccess 
  } = useAuth();

  const handleLogin = async () => {
    const { error } = await signIn('email@example.com', 'password');
    if (error) console.error('Error:', error);
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Verificar acceso por nivel
  const canAccessAdmin = hasAccess(999); // Nivel Dios
  const canAccessPro = hasAccess(3);     // Nivel Pro

  return (
    <div>
      {isLoading ? (
        <p>Cargando...</p>
      ) : isAuthenticated ? (
        <div>
          <p>Bienvenido {username}</p>
          <p>Nivel: {userLevel}</p>
          {canAccessAdmin && <p>🔑 Acceso de Administrador</p>}
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Iniciar Sesión</button>
      )}
    </div>
  );
}
```

### Niveles de Usuario

El sistema maneja los siguientes niveles:

- **0**: Básico (acceso a calculadoras)
- **1**: Intermedio (acceso a breakeven/ROAS)
- **2**: Pro (acceso a SmartShip e historial)
- **3**: Pro+ (acceso completo)
- **999**: Dios (acceso de administración)

## 🔄 Migración de Usuarios

### Sistema de Metadata

El sistema utiliza el metadata de Supabase Auth para almacenar información de usuario:

```json
{
  "username": "erick",
  "nivel": 999,
  "email": "erick@gmail.com",
  "email_verified": true
}
```

### Migrar Usuarios Existentes

Para migrar usuarios existentes, ejecuta el script SQL:

```sql
-- Ver docs/MIGRACION_COMPLETA_USUARIOS.sql
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
        'username', up.username,
        'nivel', up.nivel,
        'email', up.email
    )
FROM user_profiles up 
WHERE auth.users.id = up.id;
```

### Sincronización Automática

El sistema incluye un trigger que sincroniza automáticamente cambios en `user_profiles` con el metadata de `auth.users`.

## 🧪 Debug y Diagnóstico

### Componente de Debug

El componente `<AuthDebugSimple />` está disponible para diagnóstico:

```typescript
import AuthDebugSimple from '../components/debug/AuthDebugSimple';

// En cualquier componente
<AuthDebugSimple />
```

Muestra:
- ✅ Estado de conexión con Supabase
- 🔑 Verificación de variables de entorno
- 👤 Información del usuario actual
- 📊 Metadata del usuario

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

