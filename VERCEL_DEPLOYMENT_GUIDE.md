# ===== INSTRUCCIONES PARA DEPLOYMENT EN VERCEL =====

## 1. Variables de entorno requeridas en Vercel Dashboard:

### Database (REQUERIDAS)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

### NextAuth (REQUERIDAS)
NEXTAUTH_URL=https://tu-app.vercel.app
NEXTAUTH_SECRET=tu_secret_super_largo_y_seguro

### Prisma Configuration (CRÍTICAS para resolver el error)
PRISMA_CLI_QUERY_ENGINE_TYPE=binary
PRISMA_CLIENT_ENGINE_TYPE=binary

### Optimization (OPCIONAL pero recomendadas)
NEXT_TELEMETRY_DISABLED=1
NPM_CONFIG_PRODUCTION=true

### Otras variables de tu app
CLOUDINARY_URL=cloudinary://...
RESEND_API_KEY=re_...
# etc...

## 2. Configuración de Build en Vercel Dashboard:

Build Command: npm run build:vercel
Output Directory: .next
Install Command: npm install
Node.js Version: 18.x (recomendado)

## 3. IMPORTANTE - NO agregues estas variables:
❌ PRISMA_QUERY_ENGINE_BINARY
❌ PRISMA_SCHEMA_ENGINE_BINARY
❌ PRISMA_INTROSPECTION_ENGINE_BINARY
❌ PRISMA_FMT_BINARY

Vercel las maneja automáticamente cuando detecta los binaryTargets en schema.prisma

## 4. Para debugging:
- Ve a /test/prisma en tu app desplegada
- Revisa los logs de las funciones en Vercel Dashboard
- Los logs incluyen información detallada de debugging

## 5. Si persiste el error:
1. Verifica que todas las variables estén configuradas
2. Revisa que el Build Command sea exactamente: npm run build:vercel
3. Asegúrate de que no hayas agregado las variables de binary paths
4. Verifica los logs en tiempo real en Vercel Dashboard
