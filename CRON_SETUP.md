# Configuración de Cron Jobs para Vercel

## Descripción
Este proyecto utiliza Vercel Cron Jobs para enviar recordatorios automáticos de turnos por WhatsApp y Email.

## Configuración

### 1. Variable de Entorno
Debes configurar la siguiente variable de entorno en Vercel:

```
CRON_SECRET=tu_clave_secreta_aqui
```

**Para generar una clave secreta segura:**
```bash
# Opción 1: Usar openssl
openssl rand -base64 32

# Opción 2: Usar Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Configuración en Vercel
1. Ve a tu dashboard de Vercel
2. Selecciona tu proyecto
3. Ve a Settings → Environment Variables
4. Agrega `CRON_SECRET` con el valor generado

### 3. Cron Job Schedule
Los cron jobs están configurados para ejecutarse diariamente en zona horaria Argentina (UTC-3):
- **WhatsApp**: `0 12 * * *` (UTC) = 9:00 AM Argentina
  - **Endpoint**: `/api/cron/envios/whatsapp`
- **Email**: `1 12 * * *` (UTC) = 9:01 AM Argentina
  - **Endpoint**: `/api/cron/envios/email`

**Nota**: Los cron jobs de Vercel se ejecutan en UTC, por lo que se configuran para las 12:00 y 12:01 UTC para ejecutarse a las 9:00 y 9:01 en Argentina (UTC-3).

### 4. Funcionamiento
- Cada job verifica la configuración de la base de datos independientemente
- WhatsApp se envía si `envio = true` en la configuración
- Email se envía si `envioMail = true` en la configuración
- Cada job obtiene los turnos según su configuración de `diasEnvio` correspondiente

### 5. Logs
Los logs de cada cron job aparecerán en:
- Vercel Functions dashboard
- Console del navegador si activas las funciones de logging

### 6. Testing
Para testear manualmente, puedes hacer requests GET a:
```
# WhatsApp
https://tu-dominio.vercel.app/api/cron/envios/whatsapp

# Email
https://tu-dominio.vercel.app/api/cron/envios/email
```
Con el header:
```
Authorization: Bearer TU_CRON_SECRET
```

## Migración Completada
✅ Removido `node-cron` del layout.js  
✅ Configurado `vercel.json` con 2 cron jobs separados  
✅ Implementadas API routes `/api/cron/envios/whatsapp` y `/api/cron/envios/email`  
✅ Sistema compatible con Vercel serverless  
✅ Horarios configurados: WhatsApp a las 9:00 AM, Email a las 9:01 AM (Argentina UTC-3)
