/**
 * Cliente da Evolution API — Comunicação com WhatsApp
 * @module lib/evolution
 */
import Logger from './logger';

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'https://api.sanzonyvoz.com.br';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || '';

interface RespostaEvolution<T = unknown> {
  sucesso: boolean;
  dados?: T;
  erro?: string;
}

/**
 * Faz requisição autenticada para a Evolution API
 */
async function requisicao<T = unknown>(
  endpoint: string,
  opcoes: RequestInit = {}
): Promise<RespostaEvolution<T>> {
  const url = `${EVOLUTION_URL}${endpoint}`;

  try {
    const resposta = await fetch(url, {
      ...opcoes,
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY,
        ...opcoes.headers,
      },
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      Logger.error('EvolutionAPI', `Erro ${resposta.status}: ${endpoint}`, {
        data: { status: resposta.status, body: dados },
      });
      
      let msgErro = dados?.message;
      if (!msgErro && dados?.response?.message) {
        msgErro = Array.isArray(dados.response.message) 
          ? dados.response.message.join(', ') 
          : dados.response.message;
      }
      if (!msgErro && dados?.error) {
        msgErro = dados.error;
      }
      
      return { sucesso: false, erro: msgErro || `Erro HTTP ${resposta.status}` };
    }

    return { sucesso: true, dados: dados as T };
  } catch (erro) {
    Logger.error('EvolutionAPI', `Falha na requisição: ${endpoint}`, {
      error: erro instanceof Error ? erro : new Error(String(erro)),
    });
    return { sucesso: false, erro: 'Falha na comunicação com Evolution API' };
  }
}

/**
 * Busca todas as instâncias registradas
 */
export async function buscarInstancias() {
  return requisicao('/instance/fetchInstances');
}

/**
 * Cria uma nova instância WhatsApp
 */
export async function criarInstancia(dados: {
  instanceName: string;
  qrcode: boolean;
  integration?: string;
}) {
  return requisicao('/instance/create', {
    method: 'POST',
    body: JSON.stringify({
      instanceName: dados.instanceName,
      qrcode: dados.qrcode,
      integration: dados.integration || 'WHATSAPP-BAILEYS',
    }),
  });
}

/**
 * Conecta uma instância (gera QR Code)
 */
export async function conectarInstancia(instanceName: string) {
  return requisicao(`/instance/connect/${instanceName}`);
}

/**
 * Verifica o estado de conexão
 */
export async function estadoConexao(instanceName: string) {
  return requisicao(`/instance/connectionState/${instanceName}`);
}

/**
 * Desconecta uma instância
 */
export async function desconectarInstancia(instanceName: string) {
  return requisicao(`/instance/logout/${instanceName}`, { method: 'DELETE' });
}

/**
 * Exclui uma instância
 */
export async function excluirInstancia(instanceName: string) {
  return requisicao(`/instance/delete/${instanceName}`, { method: 'DELETE' });
}

/**
 * Envia mensagem de texto
 */
export async function enviarTexto(instanceName: string, dados: {
  number: string;
  text: string;
}) {
  return requisicao(`/message/sendText/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number: dados.number,
      text: dados.text,
    }),
  });
}

/**
 * Envia arquivo de mídia (imagem, áudio, documento)
 */
export async function enviarMidia(instanceName: string, dados: {
  number: string;
  mediatype: 'image' | 'audio' | 'video' | 'document';
  mimetype: string;
  caption?: string;
  media: string; // URL ou base64
  fileName?: string;
}) {
  return requisicao(`/message/sendMedia/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

/**
 * Configura o webhook para receber eventos
 */
export async function configurarWebhook(instanceName: string, webhookUrl: string) {
  return requisicao(`/webhook/set/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: true,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
      ],
    }),
  });
}

/**
 * Busca o QR Code da instância
 */
export async function buscarQRCode(instanceName: string) {
  return requisicao(`/instance/connect/${instanceName}`);
}

/**
 * Busca todos os chats da instância
 */
export async function buscarChats(instanceName: string) {
  return requisicao(`/chat/findChats/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * Busca mensagens de um chat específico
 */
export async function buscarMensagens(instanceName: string, number: string) {
  return requisicao(`/message/fetchMessages/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({ number }),
  });
}

export const EvolutionAPI = {
  buscarInstancias,
  criarInstancia,
  conectarInstancia,
  estadoConexao,
  desconectarInstancia,
  excluirInstancia,
  enviarTexto,
  enviarMidia,
  configurarWebhook,
  buscarQRCode,
  buscarChats,
  buscarMensagens,
};

export default EvolutionAPI;
