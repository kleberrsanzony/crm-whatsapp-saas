const { PrismaClient } = require('@prisma/client');
const { BetterSqlite3Adapter } = require('@prisma/adapter-better-sqlite3');
const sqlite = require('better-sqlite3');

async function main() {
  const db = new sqlite('dev.db');
  const adapter = new BetterSqlite3Adapter(db);
  const prisma = new PrismaClient({ adapter });
  
  const instances = await prisma.instance.findMany();
  console.log(JSON.stringify(instances, null, 2));
  
  await prisma.$disconnect();
}

main().catch(console.error);
