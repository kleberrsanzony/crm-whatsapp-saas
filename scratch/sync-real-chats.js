const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const axios = require('axios');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- INICIANDO SINCRONIZAÇÃO COMPLETA (UPSERT) ---');

  console.log('--- SINCRONIZANDO CHATS REAIS CORRETAMENTE ---');

  const instanceName = 'SanzonyVoz';
  const instanceToken = '9800BE336E13-43E6-98BA-32C5FE9D6621';
  const evolutionUrl = 'https://api.sanzonyvoz.com.br';

  const instancia = await prisma.instance.findUnique({ where: { instanceName } });
  
  const response = await axios.post(`${evolutionUrl}/chat/findChats/${instanceName}`, {}, {
    headers: { 'apikey': instanceToken }
  });

  const chats = response.data;
  console.log(`Encontrados ${chats.length} chats na API.`);

  let count = 0;
  
  // Filtra contatos e grupos
  const todosChats = chats.filter(chat => {
    const jid = chat.remoteJid;
    return jid && (jid.includes('@s.whatsapp.net') || jid.includes('@g.us'));
  });

  for (const chat of todosChats) {
    const jid = chat.remoteJid;
    const isGroup = jid.includes('@g.us');
    const telefone = jid.split('@')[0];
    
    let nome = chat.pushName || chat.name;
    if (!nome) {
        nome = isGroup ? `Grupo ${telefone.slice(-4)}` : `Contato ${telefone.slice(0, 2)}...${telefone.slice(-4)}`;
    }

    const cliente = await prisma.client.upsert({
      where: { telefone: jid }, // Usar JID completo como identificador único agora é mais seguro para grupos
      update: { nome, tipo: isGroup ? 'grupo' : 'individual' },
      create: { 
        nome, 
        telefone: jid, 
        tipo: isGroup ? 'grupo' : 'individual' 
      }
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
                ultimaMensagem: new Date(chat.updatedAt || Date.now())
            }
        });
        count++;
    }
  }

  console.log(`✅ Sincronizados ${count} contatos reais perfeitamente.`);

  await prisma.$disconnect();
}

main().catch(console.error);
