import { PrismaClient } from '../generated/prisma/index.js';

// Configuración del cliente Prisma con patrón singleton
const globalForPrisma = globalThis;

const createPrismaClient = () => {
  return new PrismaClient({
    // log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Configuración específica para Vercel
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configuración específica para serverless/edge
    __internal: {
      engine: {
        binaryTarget: process.env.VERCEL ? 'rhel-openssl-3.0.x' : undefined,
      },
    },
  });
};

// Usar singleton para evitar múltiples instancias en desarrollo
const client = globalForPrisma.prisma ?? createPrismaClient();

// Guardar instancia globalmente solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = client;
}

export { client as prisma };