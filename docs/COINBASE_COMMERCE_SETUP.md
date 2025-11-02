# 🔐 Configuración de Coinbase Commerce

Esta guía te ayudará a configurar Coinbase Commerce para recibir pagos en criptomonedas en tu aplicación FACIL.UNO.

## 📋 Requisitos Previos

1. Tener una cuenta de Coinbase Commerce
2. Acceso a tu panel de administración de Coinbase Commerce
3. Acceso a las variables de entorno de tu aplicación

## 🚀 Pasos de Configuración

### 1. Crear Cuenta en Coinbase Commerce

1. Visita [https://commerce.coinbase.com/](https://commerce.coinbase.com/)
2. Haz clic en "Sign Up" o "Get Started"
3. Crea tu cuenta de negocio
4. Completa el proceso de verificación

### 2. Obtener tu API Key

1. Inicia sesión en tu panel de Coinbase Commerce
2. Ve a **Settings** → **Security**
3. En la sección **API keys**, haz clic en **New API key**
4. Copia tu nueva API key y guárdala de forma segura

### 3. Configurar Variables de Entorno

Agrega la siguiente variable de entorno a tu proyecto:

```env
VITE_COINBASE_COMMERCE_API_KEY=tu_api_key_aqui
```

**Importante:** 
- Reemplaza `tu_api_key_aqui` con la API key que obtuviste en el paso 2
- NO compartas esta key públicamente
- En producción, usa variables de entorno seguras (Vercel, Netlify, etc.)

### 4. Configurar Webhooks (Opcional pero Recomendado)

Los webhooks te permiten recibir notificaciones automáticas cuando se complete un pago:

1. Ve a **Settings** → **Notifications**
2. Haz clic en **Add an endpoint**
3. Ingresa la URL de tu webhook endpoint (ej: `https://tu-dominio.com/api/coinbase-webhook`)
4. Copia el **Webhook Shared Secret** que se genera

**Nota:** Los webhooks requieren un backend para procesar las notificaciones. Por ahora, el sistema verifica manualmente el estado del pago antes de registrar al usuario.

## 🔧 Cómo Funciona

### Flujo de Pago

1. **Usuario hace clic en "Quiero pagar el plan"**
   - Se genera automáticamente un "charge" en Coinbase Commerce
   - Se obtiene un link de pago único

2. **Usuario completa el pago**
   - Se abre la página de Coinbase Commerce
   - El usuario selecciona su criptomoneda preferida
   - Completa la transacción

3. **Usuario confirma sus datos**
   - Completa el formulario de registro
   - El sistema verifica automáticamente el estado del pago

4. **Verificación y activación**
   - Si el pago está completado o pendiente → Usuario registrado con nivel 3
   - Si el pago no ha sido completado → Error

### Estados del Charge

- **NEW**: Charge creado, sin transacciones
- **SIGNED**: Transacción firmada, listo para enviar
- **PENDING**: Transacción detectada en blockchain
- **COMPLETED**: Transacción finalizada y protegida contra forks

## 🔒 Seguridad

### API Key

- Mantén tu API key segura y no la compartas
- Rota la key periódicamente si sospechas de un compromiso
- Usa IP allowlist si es posible

### Verificación de Pagos

- El sistema verifica el estado del charge antes de registrar al usuario
- Solo se aceptan estados PENDING o COMPLETED
- Los pagos incompletos son rechazados automáticamente

## 📊 Monitoreo

### En Coinbase Commerce Dashboard

- Ve a **Payments** para ver todas las transacciones
- Filtra por estado, fecha, monto, etc.
- Exporta reportes para contabilidad

### En tu Aplicación

- Los logs en la consola del navegador muestran el progreso
- Busca mensajes con prefijo `💰 [CoinbaseCommerce]`
- Los errores se muestran claramente al usuario

## 🐛 Solución de Problemas

### "Coinbase Commerce API Key no configurada"

**Causa:** La variable de entorno no está configurada o es incorrecta

**Solución:**
1. Verifica que `VITE_COINBASE_COMMERCE_API_KEY` esté definida
2. Reinicia tu servidor de desarrollo
3. Verifica que estés usando la key correcta

### "Error al crear charge"

**Causa:** Problema con la API key o la conexión a Coinbase

**Solución:**
1. Verifica que la API key sea válida
2. Verifica tu conexión a internet
3. Revisa los logs de Coinbase Commerce para ver si hay errores

### "El pago no ha sido completado"

**Causa:** El usuario no ha completado el pago en Coinbase Commerce

**Solución:**
1. El usuario debe volver a hacer clic en el botón de pago
2. Completar la transacción en Coinbase Commerce
3. Regresar a tu aplicación y completar el registro

## 📚 Referencias

- [Documentación de Coinbase Commerce](https://docs.cdp.coinbase.com/commerce/)
- [Crear un Charge](https://docs.cdp.coinbase.com/commerce/accepting-payment/accepting-payment)
- [Estados de Pago](https://docs.cdp.coinbase.com/commerce/introduction/payment-status)
- [Webhooks](https://docs.cdp.coinbase.com/commerce/api-arcitecture/webhooks-overview)

## 🎉 ¡Listo!

Una vez configurado, tus usuarios podrán pagar con criptomonedas y obtener acceso instantáneo a tu plataforma.

## 📝 Notas Adicionales

### Modo de Prueba vs Producción

- **Sandbox Mode**: Usa el modo sandbox para probar sin dinero real
- **Live Mode**: Activa para recibir pagos reales

### Monedas Soportadas

Coinbase Commerce acepta múltiples criptomonedas:
- Bitcoin (BTC)
- Ethereum (ETH)
- USDC (stablecoin)
- Y muchas más

### Comisiones

- Coinbase Commerce cobra una comisión por transacción
- Verifica las tarifas actuales en tu dashboard

