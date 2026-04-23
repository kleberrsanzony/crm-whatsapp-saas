/**
 * Store do chat — Gerencia conversas e mensagens ativas
 * @module stores/chatStore
 */
'use client';
import { create } from 'zustand';

interface Mensagem {
  id: string;
  conversationId: string;
  remetenteId: string | null;
  tipo: string;
  conteudo: string;
  mediaUrl?: string | null;
  enviadoPeloSistema: boolean;
  lido: boolean;
  criadoEm: string;
}

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string | null;
  tags: string;
}

interface Atendente {
  id: string;
  nome: string;
  avatar?: string | null;
}

interface Conversa {
  id: string;
  clientId: string;
  atendenteId: string | null;
  status: string;
  ultimaMensagem: string;
  mensagensNaoLidas: number;
  client: Cliente;
  atendente?: Atendente | null;
  mensagens: Mensagem[];
}

interface ChatState {
  conversas: Conversa[];
  conversaAtiva: string | null;
  mensagens: Mensagem[];
  carregando: boolean;
  setConversas: (conversas: Conversa[]) => void;
  setConversaAtiva: (id: string | null) => void;
  setMensagens: (mensagens: Mensagem[]) => void;
  adicionarMensagem: (mensagem: Mensagem) => void;
  setCarregando: (v: boolean) => void;
  atualizarConversa: (id: string, dados: Partial<Conversa>) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  conversas: [],
  conversaAtiva: null,
  mensagens: [],
  carregando: false,

  setConversas: (conversas) => set({ conversas }),
  setConversaAtiva: (id) => set({ conversaAtiva: id }),
  setMensagens: (mensagens) => set({ mensagens }),
  adicionarMensagem: (mensagem) =>
    set((state) => ({ mensagens: [...state.mensagens, mensagem] })),
  setCarregando: (v) => set({ carregando: v }),
  atualizarConversa: (id, dados) =>
    set((state) => ({
      conversas: state.conversas.map((c) =>
        c.id === id ? { ...c, ...dados } : c
      ),
    })),
}));
