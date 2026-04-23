/**
 * Cliente Prisma — Singleton com adapter SQLite para Prisma 7
 * @module lib/prisma
 */
import { PrismaClient } from '@prisma/client';

const globalParaPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalParaPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalParaPrisma.prisma = prisma;
}

export default prisma;
