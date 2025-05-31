import { prisma } from '@/lib/prisma.js';

const globalForPrisma = globalThis;
globalForPrisma.prisma = globalForPrisma.prisma || undefined;

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma