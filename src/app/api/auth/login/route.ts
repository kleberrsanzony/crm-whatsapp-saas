/**
 * Rota de autenticação — Login
 * POST /api/auth/login
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verificarSenha, gerarToken } from '@/lib/auth';
import Logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json();

    if (!email || !senha) {
      return NextResponse.json(
        { erro: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const usuario = await prisma.user.findUnique({ where: { email } });

    if (!usuario || !usuario.ativo) {
      return NextResponse.json(
        { erro: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const senhaValida = await verificarSenha(senha, usuario.senhaHash);
    if (!senhaValida) {
      return NextResponse.json(
        { erro: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const token = gerarToken({
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
    });

    Logger.info('Auth', `Login bem-sucedido: ${usuario.email}`, {
      userId: usuario.id,
    });

    return NextResponse.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        avatar: usuario.avatar,
      },
    });
  } catch (erro) {
    Logger.error('Auth', 'Erro no login', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
    });
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
