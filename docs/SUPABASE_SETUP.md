# 🚀 Configuración de Supabase

Este proyecto utiliza Supabase como backend para autenticación y base de datos.

## 📋 Variables de Entorno

Asegúrate de tener configuradas las siguientes variables de entorno en tu archivo `.env.local`:

```env
VITE_SUPABASE_URL=https://rycifekzklqsnuczawub.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

## 🔧 Configuración

El cliente de Supabase está configurado en `lib/supabase.ts` y está listo para usar en cualquier componente:

```typescript
import { supabase } from '../lib/supabase';

// Ejemplo de uso
const { data, error } = await supabase
  .from('tu_tabla')
  .select('*');
```

## 🔐 Autenticación

El cliente está configurado con:
- ✅ Persistencia de sesión
- ✅ Auto-refresh de tokens
- ✅ Detección de sesión en URL
- ✅ Almacenamiento en localStorage

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Dashboard del Proyecto](https://supabase.com/dashboard/project/rycifekzklqsnuczawub)
- [Guía de JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

## 🛠️ Comandos Útiles

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# Construir para producción
npm run build
```

