/**
 * Cliente Prisma — Singleton com adapter SQLite para Prisma 7
 * @module lib/prisma
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalParaPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function criarClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalParaPrisma.prisma ?? criarClient();

if (process.env.NODE_ENV !== 'production') {
  globalParaPrisma.prisma = prisma;
}

export default prisma;
