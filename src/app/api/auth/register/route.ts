/**
 * Rota — Registro de usuários (apenas admin)
 * POST /api/auth/register
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extrairUsuario, hashSenha, verificarPermissao } from '@/lib/auth';
import Logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const payload = extrairUsuario(request);
    if (!verificarPermissao(payload, ['admin'])) {
      return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 });
    }

    const { nome, email, senha, role } = await request.json();

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { erro: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const existente = await prisma.user.findUnique({ where: { email } });
    if (existente) {
      return NextResponse.json(
        { erro: 'Email já cadastrado' },
        { status: 409 }
      );
    }

    const senhaHash = await hashSenha(senha);
    const usuario = await prisma.user.create({
      data: {
        nome,
        email,
        senhaHash,
        role: role || 'atendente',
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
      },
    });

    Logger.info('Auth', `Usuário criado: ${email}`, { userId: payload?.userId });

    return NextResponse.json({ usuario }, { status: 201 });
  } catch (erro) {
    Logger.error('Auth', 'Erro ao registrar usuário', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
    });
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
