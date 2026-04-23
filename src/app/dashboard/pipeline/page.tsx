'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatarMoeda, iniciais, corPorString } from '@/lib/utils';

interface Lead {
  id: string; titulo: string; etapa: string; valor: number; tags: string; observacoes?: string | null;
  client: { id: string; nome: string; telefone: string };
  atendente?: { id: string; nome: string } | null;
}

const ETAPAS = [
  { id: 'novo', label: 'Novo Lead', cor: '#58a6ff', icon: '📥' },
  { id: 'em_atendimento', label: 'Em Atendimento', cor: '#d29922', icon: '💬' },
  { id: 'proposta', label: 'Proposta Enviada', cor: '#bc8cff', icon: '📄' },
  { id: 'negociacao', label: 'Negociação', cor: '#f0883e', icon: '🤝' },
  { id: 'ganho', label: 'Fechado (Ganho)', cor: '#3fb950', icon: '✅' },
  { id: 'perdido', label: 'Perdido', cor: '#f85149', icon: '❌' },
];

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await api.get<{ leads: Lead[] }>('/leads');
      setLeads(r.leads);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function moverLead(leadId: string, novaEtapa: string) {
    try {
      await api.patch('/leads', { id: leadId, etapa: novaEtapa });
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, etapa: novaEtapa } : l));
    } catch { /* silencioso */ }
  }

  function handleDragStart(e: React.DragEvent, leadId: string) {
    e.dataTransfer.setData('leadId', leadId);
    setDragId(leadId);
  }

  function handleDrop(e: React.DragEvent, etapa: string) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) moverLead(leadId, etapa);
    setDragId(null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <div className="kanban" style={{ height: 'calc(100vh - var(--header-h) - 48px)' }}>
      {ETAPAS.map((etapa) => {
        const etapaLeads = leads.filter((l) => l.etapa === etapa.id);
        const valorTotal = etapaLeads.reduce((s, l) => s + l.valor, 0);

        return (
          <div className="kanban__coluna" key={etapa.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, etapa.id)}>
            <div className="kanban__coluna-header">
              <div className="kanban__coluna-titulo">
                <span style={{ color: etapa.cor }}>{etapa.icon}</span>
                {etapa.label}
                <span className="kanban__coluna-count">{etapaLeads.length}</span>
              </div>
            </div>
            <div style={{ padding: '4px 12px', fontSize: '.8rem', color: 'var(--cor-texto-secundario)', borderBottom: `2px solid ${etapa.cor}` }}>
              {formatarMoeda(valorTotal)}
            </div>
            <div className="kanban__coluna-body">
              {etapaLeads.map((lead) => {
                const tags: string[] = (() => { try { return JSON.parse(lead.tags); } catch { return []; } })();
                return (
                  <div key={lead.id}
                    className={`kanban__card ${dragId === lead.id ? 'kanban__card--dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}>
                    <div className="kanban__card-nome">{lead.titulo}</div>
                    <div className="kanban__card-cliente">
                      <span style={{ marginRight: 4 }}><span className="avatar avatar--sm" style={{ background: corPorString(lead.client.nome), display: 'inline-flex', verticalAlign: 'middle', width: 20, height: 20, fontSize: '.6rem' }}>{iniciais(lead.client.nome)}</span></span>
                      {lead.client.nome}
                    </div>
                    <div className="kanban__card-footer">
                      <span className="kanban__card-valor">{formatarMoeda(lead.valor)}</span>
                      <div className="kanban__card-tags">
                        {tags.slice(0, 2).map((t: string, i: number) => <span key={i} className="kanban__card-tag">{t}</span>)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
