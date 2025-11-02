# 🔐 Configurar API Key de Coinbase Commerce en Vercel

## 📋 Instrucciones Rápidas

Tu API Key de Coinbase Commerce ya está lista para configurar:

```
3814de1d-49e3-43ff-abb8-8ac977d98fb7
```

## 🚀 Pasos para Configurar en Vercel

### Opción 1: Desde el Dashboard de Vercel (Recomendado)

1. Ve a tu dashboard de Vercel: https://vercel.com/dashboard
2. Selecciona el proyecto **smartship** (o el proyecto que corresponda)
3. Navega a **Settings** → **Environment Variables**
4. Haz clic en **Add New**
5. Completa los siguientes campos:
   - **Key:** `VITE_COINBASE_COMMERCE_API_KEY`
   - **Value:** `3814de1d-49e3-43ff-abb8-8ac977d98fb7`
   - **Environment:** Selecciona todas las opciones:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
6. Haz clic en **Save**
7. Ve a **Deployments** y haz clic en **...** → **Redeploy** en el último deployment

### Opción 2: Desde la Terminal (Si tienes Vercel CLI)

```bash
vercel env add VITE_COINBASE_COMMERCE_API_KEY production
```

Cuando te pida el valor, ingresa: `3814de1d-49e3-43ff-abb8-8ac977d98fb7`

Repite para los otros ambientes:
```bash
vercel env add VITE_COINBASE_COMMERCE_API_KEY preview
vercel env add VITE_COINBASE_COMMERCE_API_KEY development
```

Luego redeploy:
```bash
vercel --prod
```

## ✅ Verificación

Una vez configurada, verifica que funciona:

1. Haz un redeploy del proyecto en Vercel
2. Visita https://facil.uno/precios
3. Haz clic en "💳 Quiero pagar el plan" en cualquier plan
4. Deberías ver el botón de "Pagar con Coinbase Commerce"

Si ves un error de "API Key no configurada", verifica que:
- ✅ La variable de entorno esté correctamente nombrada
- ✅ Haya hecho redeploy después de agregar la variable
- ✅ La variable esté disponible en el ambiente correcto (Production/Preview/Development)

## 🔒 Seguridad

- ✅ Esta API Key solo debe usarse en el frontend (es segura)
- ✅ Nunca compartas esta key públicamente
- ✅ Si sospechas de un compromiso, genera una nueva en Coinbase Commerce

## 📚 Referencias

- [Coinbase Commerce Dashboard](https://commerce.coinbase.com/)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Configuración de Coinbase Commerce](./COINBASE_COMMERCE_SETUP.md)

---

**Configurado por:** Auto (Cursor AI)  
**Fecha:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

