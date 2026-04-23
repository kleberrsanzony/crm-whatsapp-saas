/**
 * Rota — Automações
 * GET /api/automations — Lista automações
 * POST /api/automations — Cria automação
 * PATCH /api/automations — Atualiza automação
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extrairUsuario, verificarPermissao } from '@/lib/auth';
import Logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const payload = extrairUsuario(request);
  if (!payload) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  }

  try {
    const automacoes = await prisma.automation.findMany({
      orderBy: { criadoEm: 'desc' },
    });

    return NextResponse.json({ automacoes });
  } catch (erro) {
    Logger.error('Automations', 'Erro ao listar automações', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const payload = extrairUsuario(request);
  if (!verificarPermissao(payload, ['admin', 'supervisor'])) {
    return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 });
  }

  try {
    const { nome, tipo, configuracao, ativo } = await request.json();

    if (!nome || !tipo) {
      return NextResponse.json({ erro: 'Nome e tipo obrigatórios' }, { status: 400 });
    }

    const automacao = await prisma.automation.create({
      data: {
        nome,
        tipo,
        configuracao: configuracao ? JSON.stringify(configuracao) : '{}',
        ativo: ativo !== false,
      },
    });

    Logger.info('Automations', `Automação criada: ${nome}`, {
      userId: payload?.userId,
    });

    return NextResponse.json({ automacao }, { status: 201 });
  } catch (erro) {
    Logger.error('Automations', 'Erro ao criar automação', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const payload = extrairUsuario(request);
  if (!verificarPermissao(payload, ['admin', 'supervisor'])) {
    return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 });
  }

  try {
    const { id, nome, configuracao, ativo } = await request.json();

    if (!id) {
      return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 });
    }

    const dados: Record<string, unknown> = {};
    if (nome) dados.nome = nome;
    if (configuracao) dados.configuracao = JSON.stringify(configuracao);
    if (ativo !== undefined) dados.ativo = ativo;

    const automacao = await prisma.automation.update({
      where: { id },
      data: dados,
    });

    return NextResponse.json({ automacao });
  } catch (erro) {
    Logger.error('Automations', 'Erro ao atualizar automação', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
