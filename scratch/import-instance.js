const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- IMPORTANDO INSTÂNCIA EXISTENTE ---');

  const instanceName = 'SanzonyCrm';
  const apiKey = 'A9748430-ABC0-46CF-82B0-FFCBF64E62DB'; // Token retornado pela API

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
