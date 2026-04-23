const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const axios = require('axios');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- SINCRONIZANDO CHATS REAIS (COM TOKEN DA INSTÂNCIA) ---');

  const instanceName = 'SanzonyCrm';
  const instanceToken = 'A9748430-ABC0-46CF-82B0-FFCBF64E62DB';
  const evolutionUrl = 'https://api.sanzonyvoz.com.br';

  // 1. Busca instância no DB
  const instancia = await prisma.instance.findUnique({ where: { instanceName } });
  
  // 2. Busca chats na Evolution usando o token da instância
  const response = await axios.get(`${evolutionUrl}/chat/fetchChats/${instanceName}`, {
    headers: { 'apikey': instanceToken }
  });

  const chats = response.data;
  console.log(`Encontrados ${chats.length} chats.`);

  let count = 0;
  for (const chat of chats.slice(0, 50)) {
    const jid = chat.id || chat.remoteJid;
    if (!jid || jid.includes('@g.us')) continue;

    const telefone = jid.replace('@s.whatsapp.net', '');
    const nome = chat.name || `Contato ${telefone.slice(-4)}`;

    const cliente = await prisma.client.upsert({
      where: { telefone },
      update: { nome },
      create: { nome, telefone }
    });

    const existe = await prisma.conversation.findFirst({
        where: { clientId: cliente.id, instanceId: instancia.id }
    });

    if (!existe) {
        await prisma.conversation.create({
            data: { 
                clientId: cliente.id, 
                instanceId: instancia.id, 
                status: 'aberto',
                ultimaMensagem: new Date()
            }
        });
        count++;
    }
  }

  console.log(`✅ Sincronizados ${count} contatos reais.`);

  await prisma.$disconnect();
}

main().catch(console.error);
