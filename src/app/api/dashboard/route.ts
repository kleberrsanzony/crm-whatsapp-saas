/**
 * Rota — Dashboard / Métricas
 * GET /api/dashboard
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

  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const [totalLeads, leadsHoje, leadsGanhos, leadsPerdidos, conversasAbertas, conversasAguardando, totalClientes, mensagensHoje] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { criadoEm: { gte: hoje } } }),
      prisma.lead.count({ where: { etapa: 'ganho' } }),
      prisma.lead.count({ where: { etapa: 'perdido' } }),
      prisma.conversation.count({ where: { status: 'aberto' } }),
      prisma.conversation.count({ where: { status: 'aguardando' } }),
      prisma.client.count(),
      prisma.message.count({ where: { criadoEm: { gte: hoje } } }),
    ]);

    const totalFin = leadsGanhos + leadsPerdidos;
    const taxaConversao = totalFin > 0 ? Math.round((leadsGanhos / totalFin) * 100) : 0;

    const pipeVal = await prisma.lead.aggregate({ where: { etapa: { notIn: ['ganho', 'perdido'] } }, _sum: { valor: true } });
    const valGanho = await prisma.lead.aggregate({ where: { etapa: 'ganho', atualizadoEm: { gte: inicioMes } }, _sum: { valor: true } });

    const leadsPorEtapa = await prisma.lead.groupBy({ by: ['etapa'], _count: true });

    const ultConv = await prisma.conversation.findMany({
      take: 10, orderBy: { ultimaMensagem: 'desc' },
      include: { client: { select: { nome: true, telefone: true } }, atendente: { select: { nome: true } } },
    });

    return NextResponse.json({
      metricas: { totalLeads, leadsHoje, leadsGanhos, leadsPerdidos, taxaConversao, conversasAbertas, conversasAguardando, totalClientes, mensagensHoje, pipelineValor: pipeVal._sum.valor || 0, valorGanhoMes: valGanho._sum.valor || 0 },
      leadsPorEtapa: leadsPorEtapa.reduce((a, i) => ({ ...a, [i.etapa]: i._count }), {} as Record<string, number>),
      ultimasAtividades: ultConv.map((c) => ({ id: c.id, clienteNome: c.client.nome, atendenteNome: c.atendente?.nome || '-', status: c.status, ultimaMensagem: c.ultimaMensagem })),
    });
  } catch (erro) {
    Logger.error('Dashboard', 'Erro ao buscar métricas', { error: erro instanceof Error ? erro : new Error(String(erro)), userId: payload.userId });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
