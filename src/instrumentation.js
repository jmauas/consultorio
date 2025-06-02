// Instrumentation for Vercel deployment optimization
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Pre-load Prisma client to reduce cold start times
    import('@/lib/prisma.js').then(({ prisma }) => {
      // Asegurar que Prisma está conectado
      prisma.$connect().then(() => {
        console.log('Prisma client pre-loaded and connected for serverless optimization');
      }).catch((error) => {
        console.error('Failed to connect Prisma client:', error);
      });
    }).catch((error) => {
      console.error('Failed to pre-load Prisma client:', error);
    });
  }
}
