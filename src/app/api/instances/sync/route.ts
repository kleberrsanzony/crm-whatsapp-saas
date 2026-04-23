import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import EvolutionAPI from '@/lib/evolution';
import { formatarTelefone } from '@/lib/utils';
import Logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { instanceId } = await request.json();

    const instancia = await prisma.instance.findUnique({
      where: { id: instanceId },
    });

    if (!instancia) {
      return NextResponse.json({ erro: 'Instância não encontrada' }, { status: 404 });
    }

    Logger.info('Sync', `Iniciando sincronização para ${instancia.instanceName}`);

    const resultado = await EvolutionAPI.buscarChats(instancia.instanceName);

    if (!resultado.sucesso || !Array.isArray(resultado.dados)) {
      return NextResponse.json({ erro: 'Falha ao buscar chats na Evolution API' }, { status: 400 });
    }

    const chats = resultado.dados;
    let novosClientes = 0;
    let novasConversas = 0;

    for (const chat of chats) {
      const jid = chat.id || chat.remoteJid;
      if (!jid || jid.includes('@g.us')) continue; // Ignora grupos por enquanto

      const telefoneRaw = jid.replace('@s.whatsapp.net', '');
      const telefone = formatarTelefone(telefoneRaw);
      const nome = chat.name || `Cliente ${telefone.slice(-4)}`;

      // 1. Garante cliente
      let cliente = await prisma.client.findUnique({ where: { telefone } });
      if (!cliente) {
        cliente = await prisma.client.create({
          data: { nome, telefone },
        });
        novosClientes++;
      }

      // 2. Garante conversa
      const conversaExistente = await prisma.conversation.findFirst({
        where: { clientId: cliente.id, instanceId: instancia.id },
      });

      if (!conversaExistente) {
        await prisma.conversation.create({
          data: {
            clientId: cliente.id,
            instanceId: instancia.id,
            status: 'aberto',
            ultimaMensagem: new Date(),
          },
        });
        novasConversas++;
      }
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: `Sincronização concluída: ${novosClientes} novos clientes e ${novasConversas} novas conversas.`,
    });
  } catch (erro) {
    Logger.error('Sync', 'Erro na sincronização', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
