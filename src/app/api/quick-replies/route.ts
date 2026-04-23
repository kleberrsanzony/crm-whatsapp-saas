/**
 * Rota — Respostas Rápidas
 * GET /api/quick-replies — Lista atalhos do usuário
 * POST /api/quick-replies — Cria atalho
 * DELETE /api/quick-replies — Remove atalho
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extrairUsuario } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const payload = extrairUsuario(request);
  if (!payload) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const respostas = await prisma.quickReply.findMany({ where: { userId: payload.userId }, orderBy: { atalho: 'asc' } });
  return NextResponse.json({ respostas });
}

export async function POST(request: NextRequest) {
  const payload = extrairUsuario(request);
  if (!payload) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const { atalho, mensagem } = await request.json();
  if (!atalho || !mensagem) return NextResponse.json({ erro: 'Atalho e mensagem obrigatórios' }, { status: 400 });

  const resposta = await prisma.quickReply.create({ data: { atalho, mensagem, userId: payload.userId } });
  return NextResponse.json({ resposta }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const payload = extrairUsuario(request);
  if (!payload) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 });

  await prisma.quickReply.delete({ where: { id } });
  return NextResponse.json({ sucesso: true });
}
