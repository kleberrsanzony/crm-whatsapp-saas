/**
 * Rota — Atualizar conversa individual
 * PATCH /api/conversations/[id] — Atualiza status, transfere atendente
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extrairUsuario } from '@/lib/auth';
import Logger from '@/lib/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = extrairUsuario(request);
  if (!payload) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const dados = await request.json();
    const atualizacao: Record<string, unknown> = {};

    if (dados.status) atualizacao.status = dados.status;
    if (dados.atendenteId) atualizacao.atendenteId = dados.atendenteId;
    if (dados.mensagensNaoLidas !== undefined) atualizacao.mensagensNaoLidas = dados.mensagensNaoLidas;

    const conversa = await prisma.conversation.update({
      where: { id },
      data: atualizacao,
      include: {
        client: true,
        atendente: { select: { id: true, nome: true, avatar: true } },
      },
    });

    Logger.info('Conversations', `Conversa ${id} atualizada`, {
      userId: payload.userId,
      data: atualizacao,
    });

    return NextResponse.json({ conversa });
  } catch (erro) {
    Logger.error('Conversations', 'Erro ao atualizar conversa', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
      userId: payload.userId,
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
