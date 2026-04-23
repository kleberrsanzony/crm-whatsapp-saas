import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const instances = await prisma.instance.findMany();
  console.log('Instances no banco:', instances.map(i => i.instanceName));

  await prisma.$disconnect();
}

main().catch(console.error);
