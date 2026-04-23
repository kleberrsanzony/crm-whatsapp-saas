/**
 * Rota — Clientes
 * GET /api/clients — Lista clientes
 * POST /api/clients — Cadastra cliente
 * PATCH /api/clients — Atualiza cliente
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
  const busca = searchParams.get('busca');

  try {
    const clientes = await prisma.client.findMany({
      include: {
        leads: { select: { etapa: true, valor: true } },
        _count: { select: { conversas: true, notasInternas: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });

    let resultado = clientes;
    if (busca) {
      const termo = busca.toLowerCase();
      resultado = clientes.filter(
        (c) =>
          c.nome.toLowerCase().includes(termo) ||
          c.telefone.includes(termo) ||
          (c.email && c.email.toLowerCase().includes(termo))
      );
    }

    return NextResponse.json({ clientes: resultado });
  } catch (erro) {
    Logger.error('Clients', 'Erro ao listar clientes', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
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
    const { nome, telefone, email, observacoes, tags } = await request.json();

    if (!nome || !telefone) {
      return NextResponse.json({ erro: 'Nome e telefone obrigatórios' }, { status: 400 });
    }

    const existente = await prisma.client.findUnique({ where: { telefone } });
    if (existente) {
      return NextResponse.json({ erro: 'Telefone já cadastrado' }, { status: 409 });
    }

    const cliente = await prisma.client.create({
      data: {
        nome,
        telefone,
        email,
        observacoes,
        tags: tags ? JSON.stringify(tags) : '[]',
      },
    });

    return NextResponse.json({ cliente }, { status: 201 });
  } catch (erro) {
    Logger.error('Clients', 'Erro ao criar cliente', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
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
    const { id, nome, email, observacoes, tags } = await request.json();

    if (!id) {
      return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 });
    }

    const dados: Record<string, unknown> = {};
    if (nome) dados.nome = nome;
    if (email !== undefined) dados.email = email;
    if (observacoes !== undefined) dados.observacoes = observacoes;
    if (tags) dados.tags = JSON.stringify(tags);

    const cliente = await prisma.client.update({
      where: { id },
      data: dados,
    });

    return NextResponse.json({ cliente });
  } catch (erro) {
    Logger.error('Clients', 'Erro ao atualizar cliente', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
