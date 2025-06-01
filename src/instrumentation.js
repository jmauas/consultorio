// Instrumentation for Vercel deployment optimization
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Pre-load Prisma client to reduce cold start times
    import('@/lib/prisma.js').then(({ prisma }) => {
      // Prisma client is now pre-loaded
      console.log('Prisma client pre-loaded for serverless optimization');
    }).catch((error) => {
      console.error('Failed to pre-load Prisma client:', error);
    });
  }
}
