/**
 * Rota — Conversas
 * GET /api/conversations — Lista conversas (com filtro por status)
 * POST /api/conversations — Cria nova conversa
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extrairUsuario } from '@/lib/auth';
import Logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const payload = extrairUsuario(request);
  if (!payload) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const busca = searchParams.get('busca');
  const tipo = searchParams.get('tipo');

  try {
    const where: any = {};

    if (status && status !== 'todos') {
      where.status = status;
    }

    if (tipo && tipo !== 'todos') {
      where.client = { tipo };
    }

    // Atendentes veem apenas suas conversas; supervisores e admins veem todas
    if (payload.role === 'atendente') {
      where.atendenteId = payload.userId;
    }

    const conversas = await prisma.conversation.findMany({
      where,
      include: {
        client: true,
        atendente: {
          select: { id: true, nome: true, avatar: true },
        },
        mensagens: {
          orderBy: { criadoEm: 'desc' },
          take: 1,
        },
      },
      orderBy: { ultimaMensagem: 'desc' },
    });

    // Filtro por busca (nome/telefone do cliente)
    let resultado = conversas;
    if (busca) {
      const termo = busca.toLowerCase();
      resultado = conversas.filter(
        (c) =>
          c.client.nome.toLowerCase().includes(termo) ||
          c.client.telefone.includes(termo)
      );
    }

    return NextResponse.json({ conversas: resultado });
  } catch (erro) {
    Logger.error('Conversations', 'Erro ao listar conversas', {
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
    const { clientId, instanceId } = await request.json();

    if (!clientId) {
      return NextResponse.json({ erro: 'clientId obrigatório' }, { status: 400 });
    }

    const conversa = await prisma.conversation.create({
      data: {
        clientId,
        atendenteId: payload.userId,
        instanceId: instanceId || null,
      },
      include: {
        client: true,
        atendente: { select: { id: true, nome: true, avatar: true } },
      },
    });

    return NextResponse.json({ conversa }, { status: 201 });
  } catch (erro) {
    Logger.error('Conversations', 'Erro ao criar conversa', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
      userId: payload.userId,
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
