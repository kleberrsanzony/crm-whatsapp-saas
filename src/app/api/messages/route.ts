/**
 * Rota — Mensagens de uma conversa
 * GET /api/messages?conversationId=xxx — Lista mensagens
 * POST /api/messages — Envia mensagem (salva + envia via Evolution API)
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extrairUsuario } from '@/lib/auth';
import { enviarTexto } from '@/lib/evolution';
import Logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const payload = extrairUsuario(request);
  if (!payload) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json({ erro: 'conversationId obrigatório' }, { status: 400 });
  }

  try {
    const mensagens = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { criadoEm: 'asc' },
    });

    // Marca mensagens como lidas
    await prisma.message.updateMany({
      where: { conversationId, lido: false, remetenteId: null },
      data: { lido: true },
    });

    // Zera contador de não lidas
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { mensagensNaoLidas: 0 },
    });

    return NextResponse.json({ mensagens });
  } catch (erro) {
    Logger.error('Messages', 'Erro ao listar mensagens', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
      userId: payload.userId,
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const payload = extrairUsuario(request);
  if (!payload) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { conversationId, conteudo, tipo } = await request.json();

    if (!conversationId || !conteudo) {
      return NextResponse.json(
        { erro: 'conversationId e conteudo são obrigatórios' },
        { status: 400 }
      );
    }

    // Busca conversa com dados do cliente e instância
    const conversa = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { client: true, instance: true },
    });

    if (!conversa) {
      return NextResponse.json({ erro: 'Conversa não encontrada' }, { status: 404 });
    }

    // Salva mensagem no banco
    const mensagem = await prisma.message.create({
      data: {
        conversationId,
        remetenteId: payload.userId,
        tipo: tipo || 'texto',
        conteudo,
        enviadoPeloSistema: false,
      },
    });

    // Atualiza timestamp da conversa
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { ultimaMensagem: new Date(), status: 'aberto' },
    });

    // Envia via Evolution API se houver instância conectada
    if (conversa.instance?.instanceName) {
      const resultado = await enviarTexto(conversa.instance.instanceName, {
        number: conversa.client.telefone,
        text: conteudo,
      });

      if (!resultado.sucesso) {
        Logger.warn('Messages', `Falha ao enviar via WhatsApp: ${resultado.erro}`, {
          userId: payload.userId,
          data: { conversationId },
        });
      }
    }

    Logger.info('Messages', 'Mensagem enviada', {
      userId: payload.userId,
      data: { conversationId, tipo },
    });

    return NextResponse.json({ mensagem }, { status: 201 });
  } catch (erro) {
    Logger.error('Messages', 'Erro ao enviar mensagem', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
      userId: payload.userId,
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
