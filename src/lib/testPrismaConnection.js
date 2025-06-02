"use server";

export async function testPrismaConnection() {
  try {
    console.log('🔍 [Prisma Debug] Testing Prisma connection...');
    console.log('🔍 [Prisma Debug] Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
    });

    // Import Prisma after logging environment
    const { prisma } = await import('@/lib/prisma');
    console.log('🔍 [Prisma Debug] Prisma client imported successfully');
    
    // Test basic connection
    await prisma.$connect();
    console.log('🔍 [Prisma Debug] Prisma connected successfully');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('🔍 [Prisma Debug] Test query result:', result);
    
    // Test model access
    const userCount = await prisma.user.count();
    console.log('🔍 [Prisma Debug] User count:', userCount);
    
    await prisma.$disconnect();
    console.log('🔍 [Prisma Debug] Prisma disconnected successfully');
    
    return {
      success: true,
      message: 'Prisma connection test successful',
      userCount
    };
    
  } catch (error) {
    console.error('❌ [Prisma Debug] Connection test failed:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    
    return {
      success: false,
      error: error.message,
      name: error.name,
      code: error.code
    };
  }
}
