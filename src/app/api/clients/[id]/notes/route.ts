/**
 * Rota — Notas internas de um cliente
 * GET /api/clients/[id]/notes — Lista notas
 * POST /api/clients/[id]/notes — Cria nota interna
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extrairUsuario } from '@/lib/auth';
import Logger from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = extrairUsuario(request);
  if (!payload) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const notas = await prisma.internalNote.findMany({
      where: { clientId: id },
      include: {
        user: { select: { nome: true, avatar: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });

    return NextResponse.json({ notas });
  } catch (erro) {
    Logger.error('Notes', 'Erro ao listar notas', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = extrairUsuario(request);
  if (!payload) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { conteudo } = await request.json();

    if (!conteudo) {
      return NextResponse.json({ erro: 'Conteúdo obrigatório' }, { status: 400 });
    }

    const nota = await prisma.internalNote.create({
      data: {
        clientId: id,
        userId: payload.userId,
        conteudo,
      },
      include: {
        user: { select: { nome: true, avatar: true } },
      },
    });

    return NextResponse.json({ nota }, { status: 201 });
  } catch (erro) {
    Logger.error('Notes', 'Erro ao criar nota', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
