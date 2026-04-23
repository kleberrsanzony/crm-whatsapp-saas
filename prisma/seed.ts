/**
 * Seed — Dados iniciais do CRM
 * Cria admin padrão e automações de exemplo
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

function criarClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = criarClient();

async function main() {
  // Usuário admin padrão
  const senhaHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@crm.com',
      senhaHash,
      role: 'admin',
    },
  });

  // Atendente de exemplo
  const senhaAt = await bcrypt.hash('atendente123', 12);
  await prisma.user.upsert({
    where: { email: 'atendente@crm.com' },
    update: {},
    create: {
      nome: 'Maria Silva',
      email: 'atendente@crm.com',
      senhaHash: senhaAt,
      role: 'atendente',
    },
  });

  // Supervisor de exemplo
  const senhaSup = await bcrypt.hash('supervisor123', 12);
  await prisma.user.upsert({
    where: { email: 'supervisor@crm.com' },
    update: {},
    create: {
      nome: 'João Santos',
      email: 'supervisor@crm.com',
      senhaHash: senhaSup,
      role: 'supervisor',
    },
  });

  // Automação de boas-vindas
  await prisma.automation.upsert({
    where: { id: 'auto-boas-vindas' },
    update: {},
    create: {
      id: 'auto-boas-vindas',
      nome: 'Boas-vindas',
      tipo: 'boas_vindas',
      configuracao: JSON.stringify({
        mensagem: 'Olá! 👋 Bem-vindo ao nosso atendimento. Em que posso ajudar?',
      }),
      ativo: true,
    },
  });

  // Automação fora do horário
  await prisma.automation.upsert({
    where: { id: 'auto-fora-horario' },
    update: {},
    create: {
      id: 'auto-fora-horario',
      nome: 'Fora do Horário',
      tipo: 'fora_horario',
      configuracao: JSON.stringify({
        horaInicio: '8',
        horaFim: '18',
        mensagem: 'Nosso horário de atendimento é de 08h às 18h. Retornaremos seu contato no próximo dia útil. 🕐',
      }),
      ativo: true,
    },
  });

  // Respostas rápidas do admin
  const atalhos = [
    { atalho: '/oi', mensagem: 'Olá! Como posso ajudá-lo(a) hoje?' },
    { atalho: '/obg', mensagem: 'Agradeço o contato! Qualquer dúvida, estamos à disposição. 😊' },
    { atalho: '/pix', mensagem: 'Segue nossa chave PIX para pagamento: [inserir chave]' },
    { atalho: '/agenda', mensagem: 'Vou verificar nossa agenda. Um momento, por favor. ⏳' },
  ];

  for (const a of atalhos) {
    await prisma.quickReply.create({
      data: { ...a, userId: admin.id },
    });
  }

  console.info(JSON.stringify({ timestamp: new Date().toISOString(), severity: 'info', context: 'Seed', message: 'Seed executado com sucesso' }));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
