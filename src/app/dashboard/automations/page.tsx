'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

interface Automacao { id: string; nome: string; tipo: string; configuracao: string; ativo: boolean; }

const TIPOS: Record<string, { label: string; icon: string; cor: string }> = {
  boas_vindas: { label: 'Boas-vindas', icon: '👋', cor: 'var(--cor-sucesso)' },
  palavra_chave: { label: 'Palavra-chave', icon: '🔑', cor: 'var(--cor-primaria)' },
  fora_horario: { label: 'Fora do Horário', icon: '🕐', cor: 'var(--cor-alerta)' },
  chatbot: { label: 'Chatbot', icon: '🤖', cor: 'var(--cor-primaria)' },
};

export default function AutomationsPage() {
  const [automacoes, setAutomacoes] = useState<Automacao[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: '', tipo: 'boas_vindas', mensagem: '', palavras: '', horaInicio: '8', horaFim: '18' });

  const carregar = useCallback(async () => {
    try { const r = await api.get<{ automacoes: Automacao[] }>('/automations'); setAutomacoes(r.automacoes); } catch { /* silencioso */ }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function toggleAtivo(id: string, ativo: boolean) {
    await api.patch('/automations', { id, ativo: !ativo });
    carregar();
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const config: Record<string, string> = {};
    if (form.tipo === 'boas_vindas') config.mensagem = form.mensagem;
    if (form.tipo === 'palavra_chave') { config.palavras = form.palavras; config.resposta = form.mensagem; }
    if (form.tipo === 'fora_horario') { config.horaInicio = form.horaInicio; config.horaFim = form.horaFim; config.mensagem = form.mensagem; }
    if (form.tipo === 'chatbot') config.mensagem = form.mensagem;

    await api.post('/automations', { nome: form.nome, tipo: form.tipo, configuracao: config });
    setModal(false);
    setForm({ nome: '', tipo: 'boas_vindas', mensagem: '', palavras: '', horaInicio: '8', horaFim: '18' });
    carregar();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div><h2 style={{ fontWeight: 700 }}>Automações</h2><p style={{ color: 'var(--cor-texto-secundario)', fontSize: '.85rem' }}>Configure respostas automáticas</p></div>
        <button className="btn btn--primary" onClick={() => setModal(true)}>+ Nova Automação</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {automacoes.map((a) => {
          const tipo = TIPOS[a.tipo] || { label: a.tipo, icon: '⚡', cor: 'var(--cor-primaria)' };
          const config = (() => { try { return JSON.parse(a.configuracao); } catch { return {}; } })();
          return (
            <div className="auto-card" key={a.id}>
              <div className="auto-card__info">
                <div className="auto-card__icon" style={{ background: `${tipo.cor}15`, color: tipo.cor }}>{tipo.icon}</div>
                <div>
                  <div className="auto-card__nome">{a.nome}</div>
                  <div className="auto-card__tipo">{tipo.label} {config.mensagem ? `· "${config.mensagem.substring(0, 40)}..."` : ''}</div>
                </div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={a.ativo} onChange={() => toggleAtivo(a.id, a.ativo)} />
                <span className="toggle__slider" />
              </label>
            </div>
          );
        })}
        {automacoes.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--cor-texto-terciario)' }}>Nenhuma automação configurada</div>}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header"><h2 className="modal__title">Nova Automação</h2><button className="btn--icon" onClick={() => setModal(false)}>✕</button></div>
            <form className="modal__body" onSubmit={criar}>
              <div className="input-group"><label className="input-group__label">Nome</label><input className="input" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div className="input-group">
                <label className="input-group__label">Tipo</label>
                <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              {form.tipo === 'palavra_chave' && (
                <div className="input-group"><label className="input-group__label">Palavras-chave (separadas por vírgula)</label><input className="input" value={form.palavras} onChange={(e) => setForm({ ...form, palavras: e.target.value })} placeholder="preço, valor, orçamento" /></div>
              )}
              {form.tipo === 'fora_horario' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="input-group" style={{ flex: 1 }}><label className="input-group__label">Início</label><input className="input" type="number" min="0" max="23" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} /></div>
                  <div className="input-group" style={{ flex: 1 }}><label className="input-group__label">Fim</label><input className="input" type="number" min="0" max="23" value={form.horaFim} onChange={(e) => setForm({ ...form, horaFim: e.target.value })} /></div>
                </div>
              )}
              <div className="input-group"><label className="input-group__label">Mensagem</label><textarea className="input" rows={3} value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} required /></div>
              <div className="modal__footer"><button type="button" className="btn btn--ghost" onClick={() => setModal(false)}>Cancelar</button><button type="submit" className="btn btn--primary">Criar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
