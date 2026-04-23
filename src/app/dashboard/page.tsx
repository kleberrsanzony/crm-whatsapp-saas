'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { formatarMoeda } from '@/lib/utils';

interface Metricas {
  totalLeads: number;
  leadsHoje: number;
  leadsGanhos: number;
  leadsPerdidos: number;
  taxaConversao: number;
  conversasAbertas: number;
  conversasAguardando: number;
  totalClientes: number;
  mensagensHoje: number;
  pipelineValor: number;
  valorGanhoMes: number;
}

interface Atividade {
  id: string;
  clienteNome: string;
  atendenteNome: string;
  status: string;
  ultimaMensagem: string;
}

const ETAPA_CORES: Record<string, string> = {
  novo: '#58a6ff', em_atendimento: '#d29922', proposta: '#bc8cff',
  negociacao: '#f0883e', ganho: '#3fb950', perdido: '#f85149',
};

function MiniGrafico({ dados }: { dados: Record<string, number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 300 * dpr;
    canvas.height = 180 * dpr;
    ctx.scale(dpr, dpr);

    const entries = Object.entries(dados);
    if (entries.length === 0) return;

    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
    const barW = 36;
    const gap = 12;
    const startX = (300 - entries.length * (barW + gap) + gap) / 2;
    const maxH = 120;

    ctx.clearRect(0, 0, 300, 180);

    entries.forEach(([etapa, count], i) => {
      const h = Math.max((count / total) * maxH * 2, 8);
      const x = startX + i * (barW + gap);
      const y = 140 - h;

      ctx.beginPath();
      ctx.roundRect(x, y, barW, h, 6);
      ctx.fillStyle = ETAPA_CORES[etapa] || '#58a6ff';
      ctx.fill();

      ctx.fillStyle = '#8b949e';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(count.toString(), x + barW / 2, y - 6);

      const label = etapa.replace('_', '\n').slice(0, 6);
      ctx.fillText(label, x + barW / 2, 155);
    });
  }, [dados]);

  return <canvas ref={canvasRef} style={{ width: 300, height: 180 }} />;
}

export default function DashboardPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [funil, setFunil] = useState<Record<string, number>>({});
  const [atividades, setAtividades] = useState<Atividade[]>([]);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get<{ metricas: Metricas; leadsPorEtapa: Record<string, number>; ultimasAtividades: Atividade[] }>('/dashboard');
      setMetricas(res.metricas);
      setFunil(res.leadsPorEtapa);
      setAtividades(res.ultimasAtividades);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { carregar(); const t = setInterval(carregar, 15000); return () => clearInterval(t); }, [carregar]);

  if (!metricas) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: 'var(--cor-texto-secundario)' }}>Carregando...</div>;

  const cards = [
    { icon: '📥', label: 'Leads Hoje', valor: metricas.leadsHoje, cor: 'var(--cor-primaria)' },
    { icon: '💬', label: 'Atendimentos Ativos', valor: metricas.conversasAbertas, cor: 'var(--cor-whatsapp)' },
    { icon: '⏳', label: 'Aguardando', valor: metricas.conversasAguardando, cor: 'var(--cor-alerta)' },
    { icon: '👥', label: 'Total Clientes', valor: metricas.totalClientes, cor: 'var(--cor-primaria)' },
    { icon: '📈', label: 'Taxa de Conversão', valor: `${metricas.taxaConversao}%`, cor: 'var(--cor-sucesso)' },
    { icon: '💰', label: 'Pipeline', valor: formatarMoeda(metricas.pipelineValor), cor: 'var(--cor-alerta)' },
    { icon: '✅', label: 'Ganhos no Mês', valor: formatarMoeda(metricas.valorGanhoMes), cor: 'var(--cor-sucesso)' },
    { icon: '📩', label: 'Mensagens Hoje', valor: metricas.mensagensHoje, cor: 'var(--cor-primaria)' },
  ];

  return (
    <div>
      <div className="metricas-grid">
        {cards.map((c) => (
          <div className="metric" key={c.label}>
            <div className="metric__icon" style={{ background: `${c.cor}15`, color: c.cor }}>{c.icon}</div>
            <div className="metric__valor">{c.valor}</div>
            <div className="metric__rotulo">{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card__header"><h2 className="card__title">Funil de Vendas</h2></div>
          <MiniGrafico dados={funil} />
        </div>

        <div className="card">
          <div className="card__header"><h2 className="card__title">Atividades Recentes</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {atividades.slice(0, 6).map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--cor-borda)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{a.clienteNome}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--cor-texto-secundario)' }}>{a.atendenteNome}</div>
                </div>
                <span className={`badge badge--${a.status}`}>{a.status}</span>
              </div>
            ))}
            {atividades.length === 0 && <div style={{ color: 'var(--cor-texto-terciario)', textAlign: 'center', padding: 20 }}>Nenhuma atividade ainda</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
