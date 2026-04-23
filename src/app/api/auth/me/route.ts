/**
 * Rota — Dados do usuário autenticado
 * GET /api/auth/me
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extrairUsuario } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const payload = extrairUsuario(request);
  if (!payload) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  }

  const usuario = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      avatar: true,
      ativo: true,
    },
  });

  if (!usuario || !usuario.ativo) {
    return NextResponse.json({ erro: 'Usuário não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ usuario });
}
