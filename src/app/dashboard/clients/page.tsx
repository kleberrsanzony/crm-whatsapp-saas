'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { iniciais, corPorString, telefoneParaExibicao } from '@/lib/utils';

interface Cliente {
  id: string; nome: string; telefone: string; email?: string | null;
  observacoes?: string | null; tags: string; criadoEm: string;
  leads: { etapa: string; valor: number }[];
  _count: { conversas: number; notasInternas: number };
}

interface Nota { id: string; conteudo: string; criadoEm: string; user: { nome: string } }

export default function ClientsPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<Cliente | null>(null);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [novaNota, setNovaNota] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: '', telefone: '', email: '' });

  const carregar = useCallback(async () => {
    try {
      const r = await api.get<{ clientes: Cliente[] }>(`/clients?busca=${busca}`);
      setClientes(r.clientes);
    } catch { /* silencioso */ }
  }, [busca]);

  useEffect(() => { carregar(); }, [carregar]);

  async function carregarNotas(clienteId: string) {
    try {
      const r = await api.get<{ notas: Nota[] }>(`/clients/${clienteId}/notes`);
      setNotas(r.notas);
    } catch { /* silencioso */ }
  }

  async function salvarNota() {
    if (!novaNota.trim() || !selecionado) return;
    await api.post(`/clients/${selecionado.id}/notes`, { conteudo: novaNota });
    setNovaNota('');
    carregarNotas(selecionado.id);
  }

  async function criarCliente(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/clients', form);
    setModal(false);
    setForm({ nome: '', telefone: '', email: '' });
    carregar();
  }

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - var(--header-h) - 48px)' }}>
      {/* Lista */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input className="input input--search" placeholder="Buscar cliente..." value={busca} onChange={(e) => setBusca(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn--primary" onClick={() => setModal(true)}>+ Novo</button>
        </div>
        <div className="card" style={{ flex: 1, overflow: 'auto', padding: 0 }}>
          <table className="tabela">
            <thead><tr><th>Cliente</th><th>Telefone</th><th>Leads</th><th>Conversas</th></tr></thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => { setSelecionado(c); carregarNotas(c.id); }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar--sm" style={{ background: corPorString(c.nome) }}>{iniciais(c.nome)}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.nome}</div>
                        {c.email && <div style={{ fontSize: '.8rem', color: 'var(--cor-texto-secundario)' }}>{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{telefoneParaExibicao(c.telefone)}</td>
                  <td>{c.leads.length}</td>
                  <td>{c._count.conversas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalhe */}
      {selecionado && (
        <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className="avatar avatar--lg" style={{ background: corPorString(selecionado.nome) }}>{iniciais(selecionado.nome)}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selecionado.nome}</div>
                <div style={{ color: 'var(--cor-texto-secundario)', fontSize: '.85rem' }}>{telefoneParaExibicao(selecionado.telefone)}</div>
                {selecionado.email && <div style={{ color: 'var(--cor-texto-secundario)', fontSize: '.85rem' }}>{selecionado.email}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="metric" style={{ flex: 1, padding: 12 }}>
                <div className="metric__valor" style={{ fontSize: '1.2rem' }}>{selecionado.leads.length}</div>
                <div className="metric__rotulo">Leads</div>
              </div>
              <div className="metric" style={{ flex: 1, padding: 12 }}>
                <div className="metric__valor" style={{ fontSize: '1.2rem' }}>{selecionado._count.conversas}</div>
                <div className="metric__rotulo">Conversas</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ flex: 1, overflow: 'auto' }}>
            <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: '.9rem' }}>📝 Notas Internas</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="input" placeholder="Adicionar nota..." value={novaNota} onChange={(e) => setNovaNota(e.target.value)} style={{ flex: 1 }}
                onKeyDown={(e) => { if (e.key === 'Enter') salvarNota(); }} />
              <button className="btn btn--primary btn--sm" onClick={salvarNota}>+</button>
            </div>
            {notas.map((n) => (
              <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--cor-borda)', fontSize: '.85rem' }}>
                <div>{n.conteudo}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--cor-texto-terciario)', marginTop: 4 }}>{n.user.nome} · {new Date(n.criadoEm).toLocaleDateString('pt-BR')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Novo Cliente */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header"><h2 className="modal__title">Novo Cliente</h2><button className="btn--icon" onClick={() => setModal(false)}>✕</button></div>
            <form className="modal__body" onSubmit={criarCliente}>
              <div className="input-group"><label className="input-group__label">Nome</label><input className="input" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div className="input-group"><label className="input-group__label">Telefone</label><input className="input" required value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
              <div className="input-group"><label className="input-group__label">E-mail</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="modal__footer"><button type="button" className="btn btn--ghost" onClick={() => setModal(false)}>Cancelar</button><button type="submit" className="btn btn--primary">Salvar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
