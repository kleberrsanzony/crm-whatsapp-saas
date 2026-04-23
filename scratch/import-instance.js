const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- IMPORTANDO INSTÂNCIA EXISTENTE ---');

  const instanceName = 'SanzonyVoz';
  const apiKey = '9800BE336E13-43E6-98BA-32C5FE9D6621'; // Token retornado pela API

  const instancia = await prisma.instance.upsert({
    where: { instanceName },
    update: { status: 'conectado', apiKey },
    create: {
      nome: 'Sanzony Atendimento',
      instanceName,
      apiKey,
      status: 'conectado'
    }
  });

  console.log('✅ Instância importada com sucesso:', instancia.instanceName);

  await prisma.$disconnect();
}

main().catch(console.error);
