/**
 * Rota — Instâncias WhatsApp (Evolution API)
 * GET /api/instances — Lista instâncias
 * POST /api/instances — Cria instância
 * PATCH /api/instances — Conecta/Desconecta
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extrairUsuario, verificarPermissao } from '@/lib/auth';
import EvolutionAPI from '@/lib/evolution';
import Logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const payload = extrairUsuario(request);
  if (!payload) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  }

  try {
    // Busca instâncias locais
    const instanciasLocais = await prisma.instance.findMany({
      orderBy: { criadoEm: 'desc' },
    });

    // Busca status na Evolution API
    const resultadoApi = await EvolutionAPI.buscarInstancias();

    return NextResponse.json({
      instancias: instanciasLocais,
      instanciasApi: resultadoApi.dados || [],
    });
  } catch (erro) {
    Logger.error('Instances', 'Erro ao listar instâncias', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const payload = extrairUsuario(request);
  if (!verificarPermissao(payload, ['admin'])) {
    return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 });
  }

  try {
    const { nome, instanceName } = await request.json();

    if (!nome || !instanceName) {
      return NextResponse.json({ erro: 'Nome e instanceName obrigatórios' }, { status: 400 });
    }

    // Cria na Evolution API
    const resultado = await EvolutionAPI.criarInstancia({
      instanceName,
      qrcode: true,
    });

    if (!resultado.sucesso) {
      return NextResponse.json(
        { erro: resultado.erro || 'Erro ao criar instância na Evolution API' },
        { status: 502 }
      );
    }

    // Salva localmente
    const apiData = resultado.dados as any;
    const instanceKey = apiData?.hash || apiData?.token || apiData?.instance?.token || process.env.EVOLUTION_API_KEY || '';

    const instancia = await prisma.instance.create({
      data: {
        nome,
        instanceName,
        apiKey: instanceKey,
      },
    });

    // Configura webhook
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`;
    await EvolutionAPI.configurarWebhook(instanceName, webhookUrl);

    Logger.info('Instances', `Instância criada: ${instanceName}`, {
      userId: payload?.userId,
    });

    return NextResponse.json({
      instancia,
      qrcode: apiData?.qrcode || null,
    }, { status: 201 });
  } catch (erro: any) {
    // Trata erro de duplicidade do Prisma (P2002)
    if (erro.code === 'P2002') {
      return NextResponse.json({ erro: 'Este nome de instância já está cadastrado no sistema.' }, { status: 409 });
    }

    Logger.error('Instances', 'Erro ao criar instância', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const payload = extrairUsuario(request);
  if (!verificarPermissao(payload, ['admin'])) {
    return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 });
  }

  try {
    const { instanceName, acao } = await request.json();

    if (!instanceName || !acao) {
      return NextResponse.json({ erro: 'instanceName e acao obrigatórios' }, { status: 400 });
    }

    let resultado;
    switch (acao) {
      case 'conectar':
        resultado = await EvolutionAPI.conectarInstancia(instanceName);
        break;
      case 'desconectar':
        resultado = await EvolutionAPI.desconectarInstancia(instanceName);
        await prisma.instance.updateMany({
          where: { instanceName },
          data: { status: 'desconectado' },
        });
        break;
      case 'excluir':
        resultado = await EvolutionAPI.excluirInstancia(instanceName);
        await prisma.instance.deleteMany({ where: { instanceName } });
        break;
      default:
        return NextResponse.json({ erro: 'Ação inválida' }, { status: 400 });
    }

    return NextResponse.json({ resultado: resultado?.dados || null });
  } catch (erro) {
    Logger.error('Instances', 'Erro ao gerenciar instância', {
      error: erro instanceof Error ? erro : new Error(String(erro)),
    });
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
