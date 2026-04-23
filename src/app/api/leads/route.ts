/**
 * Rota — Leads / Pipeline
 * GET /api/leads — Lista todos os leads com filtros
 * POST /api/leads — Cria novo lead
 * PATCH /api/leads — Atualiza lead (mover etapa, editar)
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
  const etapa = searchParams.get('etapa');

  try {
    const where: Record<string, unknown> = {};
    if (etapa) where.etapa = etapa;
    if (payload.role === 'atendente') where.atendenteId = payload.userId;

    const leads = await prisma.lead.findMany({
      where,
      include: {
        client: true,
        atendente: { select: { id: true, nome: true, avatar: true } },
      },
      orderBy: { atualizadoEm: 'desc' },
    });

    return NextResponse.json({ leads });
  } catch (erro) {
    Logger.error('Leads', 'Erro ao listar leads', {
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
    const { clientId, titulo, valor, etapa, observacoes, tags } = await request.json();

    if (!clientId) {
      return NextResponse.json({ erro: 'clientId obrigatório' }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        clientId,
        atendenteId: payload.userId,
        titulo: titulo || 'Novo Lead',
        valor: valor || 0,
        etapa: etapa || 'novo',
        observacoes,
        tags: tags ? JSON.stringify(tags) : '[]',
      },
      include: { client: true },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (erro) {
    Logger.error('Leads', 'Erro ao criar lead', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
      userId: payload.userId,
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const payload = extrairUsuario(request);
  if (!payload) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { id, etapa, valor, titulo, observacoes, tags, atendenteId } = await request.json();

    if (!id) {
      return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 });
    }

    const dados: Record<string, unknown> = { atualizadoEm: new Date() };
    if (etapa) dados.etapa = etapa;
    if (valor !== undefined) dados.valor = valor;
    if (titulo) dados.titulo = titulo;
    if (observacoes !== undefined) dados.observacoes = observacoes;
    if (tags) dados.tags = JSON.stringify(tags);
    if (atendenteId) dados.atendenteId = atendenteId;

    const lead = await prisma.lead.update({
      where: { id },
      data: dados,
      include: { client: true, atendente: { select: { id: true, nome: true } } },
    });

    Logger.info('Leads', `Lead ${id} atualizado para etapa: ${etapa || 'sem mudança'}`, {
      userId: payload.userId,
    });

    return NextResponse.json({ lead });
  } catch (erro) {
    Logger.error('Leads', 'Erro ao atualizar lead', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
      userId: payload.userId,
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
