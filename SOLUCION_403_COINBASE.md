# 🔧 Solución al Error 403 de Coinbase Commerce

## ❌ Problema Actual

Estás obteniendo un error 403 Forbidden al intentar crear un charge en Coinbase Commerce:

```
POST https://api.commerce.coinbase.com/charges/ 403 (Forbidden)
```

## 🔍 Causas Posibles

### 1. Variable de Entorno No Configurada en Preview (MÁS PROBABLE)

La rama `coinbase` genera **preview deployments** en Vercel. Si solo configuraste la variable en Production, no estará disponible en Preview.

**Solución:**
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto **smartship**
3. Settings → Environment Variables
4. Busca `VITE_COINBASE_COMMERCE_API_KEY`
5. Asegúrate de que esté seleccionada para:
   - ✅ Production
   - ✅ **Preview** ← IMPORTANTE
   - ✅ Development
6. Guarda y haz redeploy

### 2. API Key Incorrecta o No Configurada

Tu API Key: `3814de1d-49e3-43ff-abb8-8ac977d98fb7`

**Verifica que:**
- ✅ La API key sea de **Coinbase Commerce** (commerce.coinbase.com)
- ✅ NO sea del Coinbase Developer Platform (CDP)
- ✅ NO sea de Coinbase App o Coinbase Business
- ✅ Sea una API key de **producción** (no sandbox/test)

**Cómo obtenerla:**
1. Ve a https://commerce.coinbase.com/
2. Inicia sesión
3. Settings → Security → API keys
4. Haz clic en "New API key"
5. Copia la key generada

### 3. Cuenta No Verificada

Tu cuenta de Coinbase Commerce podría no estar completamente verificada.

**Verifica:**
1. Ve a https://commerce.coinbase.com/
2. Revisa si hay notificaciones pendientes
3. Completa cualquier proceso de verificación requerido

### 4. Modo Sandbox vs Producción

Si estás en modo sandbox/test, necesitas usar la API key correspondiente.

**Verifica:**
1. Ve a https://commerce.coinbase.com/
2. Settings → General
3. Revisa si dice "Test Mode" o "Live Mode"
4. Si está en Test Mode, cambia a Live Mode o usa la API key de test

## 🚀 Solución Rápida Recomendada

### Opción A: Configurar Variable en Preview

1. Ve a https://vercel.com/dashboard
2. Tu proyecto **smartship**
3. Settings → Environment Variables
4. Edita `VITE_COINBASE_COMMERCE_API_KEY`
5. Selecciona **Preview** además de Production
6. Guarda
7. Ve a Deployments y haz Redeploy del último deployment de la rama coinbase

### Opción B: Merge a Main para Usar Production

Si prefieres probar en producción directamente:

```bash
# Cambia a main
git checkout main

# Merge de coinbase
git merge coinbase

# Push a main
git push origin main
```

Esto usará las variables de entorno de Production.

## 🔍 Cómo Verificar

Después de configurar la variable, verifica en la consola del navegador:

```
✅ [CoinbaseCommerce] API Key cargada: 3814de1d...
```

Si ves esto, la API key está configurada correctamente.

Si ves:

```
⚠️ [CoinbaseCommerce] API Key no configurada
```

Entonces la variable NO está disponible en ese deployment.

## 📝 Checklist de Verificación

- [ ] API Key obtenida de commerce.coinbase.com (NO del CDP)
- [ ] Variable configurada en Vercel para **Preview**, Production y Development
- [ ] Redeply hecho después de configurar la variable
- [ ] Cuenta de Coinbase Commerce completamente verificada
- [ ] En modo Live (no Test/Sandbox)
- [ ] API key de producción (no de prueba)

## 🐛 Debug

Si el problema persiste:

1. Abre la consola del navegador (F12)
2. Busca el mensaje que indica si la API key está cargada
3. Si dice "API Key no configurada", la variable no está disponible
4. Si dice "API Key cargada: 3814de1d..." pero sigue dando 403:
   - La API key es incorrecta o inválida
   - Contacta con Coinbase Commerce soporte

---

**¿Aún tienes problemas?**  
Verifica los logs de deployment en Vercel para ver si la variable está siendo inyectada durante el build.

