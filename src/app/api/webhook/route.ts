/**
 * Rota — Webhook da Evolution API
 * POST /api/webhook — Recebe eventos de mensagens e conexão
 * Cadastra clientes automaticamente e distribui por round-robin
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatarTelefone } from '@/lib/utils';
import Logger from '@/lib/logger';

/**
 * Distribuição round-robin: busca o atendente ativo com menos conversas abertas
 */
async function obterProximoAtendente(): Promise<string | null> {
  const atendentes = await prisma.user.findMany({
    where: { ativo: true, role: { in: ['atendente', 'supervisor'] } },
    include: {
      _count: {
        select: { conversas: { where: { status: 'aberto' } } },
      },
    },
    orderBy: { criadoEm: 'asc' },
  });

  if (atendentes.length === 0) return null;

  // Ordena por número de conversas abertas (menor primeiro)
  atendentes.sort((a, b) => a._count.conversas - b._count.conversas);
  return atendentes[0].id;
}

/**
 * Processa automações de boas-vindas e palavras-chave
 */
async function processarAutomacoes(
  textoRecebido: string,
  _telefone: string,
  _instanceName: string
): Promise<string | null> {
  // Busca automação de boas-vindas ativa
  const automacoes = await prisma.automation.findMany({
    where: { ativo: true },
  });

  for (const auto of automacoes) {
    const config = JSON.parse(auto.configuracao || '{}');

    if (auto.tipo === 'palavra_chave' && config.palavras) {
      const palavras = (config.palavras as string).split(',').map((p: string) => p.trim().toLowerCase());
      const textoLower = textoRecebido.toLowerCase();
      if (palavras.some((p: string) => textoLower.includes(p))) {
        return config.resposta || null;
      }
    }

    if (auto.tipo === 'fora_horario' && config.horaInicio && config.horaFim) {
      const agora = new Date();
      const hora = agora.getHours();
      const inicio = parseInt(config.horaInicio);
      const fim = parseInt(config.horaFim);
      if (hora < inicio || hora >= fim) {
        return config.mensagem || null;
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const evento = await request.json();
    const tipoEvento = evento.event;

    Logger.info('Webhook', `Evento recebido: ${tipoEvento}`, {
      data: { event: tipoEvento, instance: evento.instance },
    });

    // Processa mensagens recebidas
    if (tipoEvento === 'messages.upsert') {
      const msgData = evento.data;
      if (!msgData || msgData.key?.fromMe) {
        return NextResponse.json({ status: 'ignorado' });
      }

      const telefoneRaw = msgData.key?.remoteJid?.replace('@s.whatsapp.net', '') || '';
      const telefone = formatarTelefone(telefoneRaw);
      const instanceName = evento.instance;
      const textoRecebido =
        msgData.message?.conversation ||
        msgData.message?.extendedTextMessage?.text ||
        msgData.message?.imageMessage?.caption ||
        '[Mídia]';
      const whatsappMsgId = msgData.key?.id || '';

      // Tipo de mídia
      let tipoMensagem = 'texto';
      if (msgData.message?.imageMessage) tipoMensagem = 'imagem';
      if (msgData.message?.audioMessage) tipoMensagem = 'audio';
      if (msgData.message?.documentMessage) tipoMensagem = 'arquivo';

      // 1. Cadastro automático do cliente
      let cliente = await prisma.client.findUnique({ where: { telefone } });
      if (!cliente) {
        const nomeContato = msgData.pushName || `Cliente ${telefone.slice(-4)}`;
        cliente = await prisma.client.create({
          data: { nome: nomeContato, telefone },
        });
        Logger.info('Webhook', `Novo cliente cadastrado: ${telefone}`, {
          data: { clienteId: cliente.id },
        });
      }

      // 2. Busca ou cria conversa
      let conversa = await prisma.conversation.findFirst({
        where: {
          clientId: cliente.id,
          status: { in: ['aberto', 'aguardando'] },
        },
      });

      if (!conversa) {
        // Busca instância no banco
        const instancia = await prisma.instance.findFirst({
          where: { instanceName },
        });

        // Distribuição round-robin
        const atendenteId = await obterProximoAtendente();

        conversa = await prisma.conversation.create({
          data: {
            clientId: cliente.id,
            atendenteId,
            instanceId: instancia?.id || null,
            status: 'aberto',
          },
        });

        // Cria lead automaticamente para nova conversa
        await prisma.lead.create({
          data: {
            clientId: cliente.id,
            atendenteId,
            etapa: 'novo',
            titulo: `Lead - ${cliente.nome}`,
          },
        });

        Logger.info('Webhook', `Nova conversa e lead criados para ${telefone}`, {
          data: { conversaId: conversa.id },
        });
      }

      // 3. Salva mensagem
      await prisma.message.create({
        data: {
          conversationId: conversa.id,
          remetenteId: null, // mensagem do cliente
          tipo: tipoMensagem,
          conteudo: textoRecebido,
          whatsappMsgId,
          enviadoPeloSistema: false,
        },
      });

      // 4. Atualiza conversa
      await prisma.conversation.update({
        where: { id: conversa.id },
        data: {
          ultimaMensagem: new Date(),
          mensagensNaoLidas: { increment: 1 },
          status: 'aberto',
        },
      });

      // 5. Processa automações
      await processarAutomacoes(textoRecebido, telefone, instanceName);
    }

    // Processa atualizações de conexão
    if (tipoEvento === 'connection.update') {
      const { state, instance: instanceName } = evento;
      if (instanceName && state) {
        await prisma.instance.updateMany({
          where: { instanceName },
          data: {
            status: state === 'open' ? 'conectado' : 'desconectado',
          },
        });
      }
    }

    return NextResponse.json({ status: 'processado' });
  } catch (erro) {
    Logger.error('Webhook', 'Erro ao processar webhook', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
