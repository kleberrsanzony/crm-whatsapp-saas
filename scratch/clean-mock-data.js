const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

async function main() {
  const dbPath = path.join(process.cwd(), 'dev.db');
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  const prisma = new PrismaClient({ adapter });

  console.log('--- LIMPANDO DADOS MOCKADOS ---');

  // Ordem correta para evitar erros de Foreign Key
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.internalNote.deleteMany();
  await prisma.client.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.quickReply.deleteMany();

  console.log('✅ Dados mockados removidos com sucesso!');
  console.log('ℹ️ As instâncias cadastradas foram mantidas.');

  await prisma.$disconnect();
}

main().catch(console.error);
