'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { tempoRelativo, formatarHora, iniciais, corPorString, truncar } from '@/lib/utils';

interface Cliente { id: string; nome: string; telefone: string; email?: string | null; tags: string; }
interface Atendente { id: string; nome: string; avatar?: string | null; }
interface Mensagem { id: string; conversationId: string; remetenteId: string | null; tipo: string; conteudo: string; criadoEm: string; }
interface Conversa {
  id: string; clientId: string; atendenteId: string | null; status: string;
  ultimaMensagem: string; mensagensNaoLidas: number;
  client: Cliente; atendente?: Atendente | null; mensagens: Mensagem[];
}

export default function ChatPage() {
  const userId = useAuthStore((s) => s.usuario?.id);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [ativa, setAtiva] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [tipoFiltro, setTipoFiltro] = useState('todos'); // todos | individual | grupo
  const [busca, setBusca] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);
  const msgRef = useRef<HTMLDivElement>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await api.get<{ conversas: Conversa[] }>(`/conversations?status=${filtro}&busca=${busca}&tipo=${tipoFiltro}`);
      setConversas(r.conversas);
    } catch { /* silencioso */ }
  }, [filtro, busca, tipoFiltro]);

  useEffect(() => { carregar(); const t = setInterval(carregar, 2000); return () => clearInterval(t); }, [carregar]);

  const carregarMensagens = useCallback(async (convId: string) => {
    try {
      const r = await api.get<{ mensagens: Mensagem[] }>(`/messages?conversationId=${convId}`);
      setMensagens(r.mensagens);
      setTimeout(() => msgRef.current?.scrollTo(0, msgRef.current.scrollHeight), 50);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    if (!ativa) return;
    carregarMensagens(ativa);
    const t = setInterval(() => carregarMensagens(ativa), 2000);
    return () => clearInterval(t);
  }, [ativa, carregarMensagens]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || !ativa) return;
    setEnviando(true);
    try {
      await api.post('/messages', { conversationId: ativa, conteudo: texto });
      setTexto('');
      await carregarMensagens(ativa);
      await carregar();
    } catch { /* silencioso */ }
    setEnviando(false);
  }

  async function alterarStatus(convId: string, status: string) {
    await api.patch(`/conversations/${convId}`, { status });
    carregar();
  }

  const conversaAtiva = conversas.find((c) => c.id === ativa);

  return (
    <div className={`chat ${mobileChat ? 'chat--janela-ativa' : ''}`} style={{ height: 'calc(100vh - var(--header-h) - 48px)' }}>
      {/* Lista de Conversas */}
      <div className="chat__lista">
        <div className="chat__lista-header">
          <input className="input input--search" placeholder="Buscar conversa..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="chat__lista-filtros">
          {['todos', 'aberto', 'aguardando', 'finalizado'].map((f) => (
            <button key={f} className={`btn btn--sm ${filtro === f ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setFiltro(f)}>
              {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="chat__lista-filtros" style={{ marginTop: 4, borderTop: 'none', paddingBottom: 8 }}>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'individual', label: '📱 Contatos' },
            { id: 'grupo', label: '👥 Grupos' }
          ].map((t) => (
            <button key={t.id} className={`btn btn--sm ${tipoFiltro === t.id ? 'btn--secondary' : 'btn--ghost'}`} onClick={() => setTipoFiltro(t.id)} style={{ fontSize: '0.75rem' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="chat__lista-scroll">
          {conversas.map((c) => (
            <div key={c.id} className={`chat__conversa ${ativa === c.id ? 'chat__conversa--ativa' : ''}`}
              onClick={() => { setAtiva(c.id); setMobileChat(true); }}>
              <div className="avatar" style={{ background: corPorString(c.client.nome) }}>{iniciais(c.client.nome)}</div>
              <div className="chat__conversa-info">
                <div className="chat__conversa-nome">
                  <span>{c.client.nome}</span>
                  <span className="chat__conversa-hora">{tempoRelativo(c.ultimaMensagem)}</span>
                </div>
                <div className="chat__conversa-preview">
                  {c.mensagens[0] ? truncar(c.mensagens[0].conteudo, 40) : 'Sem mensagens'}
                </div>
                <div className="chat__conversa-meta">
                  <span className={`badge badge--${c.status}`}>{c.status}</span>
                  {c.mensagensNaoLidas > 0 && <span className="chat__conversa-nao-lidas">{c.mensagensNaoLidas}</span>}
                </div>
              </div>
            </div>
          ))}
          {conversas.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--cor-texto-terciario)' }}>Nenhuma conversa</div>}
        </div>
      </div>

      {/* Janela do Chat */}
      {ativa && conversaAtiva ? (
        <div className="chat__janela">
          <div className="chat__janela-header">
            <div className="chat__janela-contato">
              <button className="btn--icon" onClick={() => setMobileChat(false)} style={{ display: 'none' }}>←</button>
              <div className="avatar" style={{ background: corPorString(conversaAtiva.client.nome) }}>{iniciais(conversaAtiva.client.nome)}</div>
              <div>
                <div className="chat__janela-nome">{conversaAtiva.client.nome}</div>
                <div className="chat__janela-status">{conversaAtiva.client.telefone}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {conversaAtiva.status !== 'finalizado' && (
                <button className="btn btn--sm btn--ghost" onClick={() => alterarStatus(ativa, 'finalizado')}>✅ Finalizar</button>
              )}
              {conversaAtiva.status === 'aberto' && (
                <button className="btn btn--sm btn--ghost" onClick={() => alterarStatus(ativa, 'aguardando')}>⏳ Aguardar</button>
              )}
            </div>
          </div>

          <div className="chat__mensagens" ref={msgRef}>
            {mensagens.map((m) => (
              <div key={m.id} className={`chat__mensagem ${m.remetenteId ? 'chat__mensagem--enviada' : 'chat__mensagem--recebida'}`}>
                <div>{m.conteudo}</div>
                <div className="chat__mensagem-hora">{formatarHora(m.criadoEm)}</div>
              </div>
            ))}
          </div>

          <form className="chat__input-area" onSubmit={enviar}>
            <textarea
              className="chat__input"
              placeholder="Digite uma mensagem..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(e); } }}
              rows={1}
            />
            <button className="chat__send-btn" type="submit" disabled={enviando}>➤</button>
          </form>
        </div>
      ) : (
        <div className="chat__vazio">
          <div className="chat__vazio-icon">💬</div>
          <div>Selecione uma conversa para começar</div>
        </div>
      )}
    </div>
  );
}
