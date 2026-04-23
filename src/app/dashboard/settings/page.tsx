'use client';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import api from '@/lib/api';

export default function SettingsPage() {
  const { usuario } = useAuthStore();
  const { darkMode, toggleDarkMode, notificacaoSonora, toggleNotificacaoSonora } = useUiStore();
  const [instForm, setInstForm] = useState({ nome: '', instanceName: '' });
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  async function criarInstancia(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await api.post<{ qrcode?: { base64?: string } }>('/instances', instForm);
      if (r.qrcode?.base64) setQrcode(r.qrcode.base64);
      setMsg('Instância criada com sucesso!');
      setInstForm({ nome: '', instanceName: '' });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erro ao criar');
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontWeight: 700, marginBottom: 24 }}>Configurações</h2>

      {/* Perfil */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 16 }}>👤 Perfil</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div><strong>Nome:</strong> {usuario?.nome}</div>
          <div><strong>E-mail:</strong> {usuario?.email}</div>
          <div><strong>Cargo:</strong> <span className="badge badge--novo">{usuario?.role}</span></div>
        </div>
      </div>

      {/* Aparência */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 16 }}>🎨 Aparência</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span>Modo Escuro</span>
          <label className="toggle"><input type="checkbox" checked={darkMode} onChange={toggleDarkMode} /><span className="toggle__slider" /></label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Notificação Sonora</span>
          <label className="toggle"><input type="checkbox" checked={notificacaoSonora} onChange={toggleNotificacaoSonora} /><span className="toggle__slider" /></label>
        </div>
      </div>

      {/* WhatsApp */}
      {usuario?.role === 'admin' && (
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>📱 Nova Instância WhatsApp</h3>
          {msg && (
            <div style={{ 
              padding: 8, 
              marginBottom: 12, 
              borderRadius: 'var(--radius)', 
              background: msg.includes('sucesso') ? 'rgba(63,185,80,.1)' : 'rgba(248,81,73,.1)', 
              color: msg.includes('sucesso') ? 'var(--cor-sucesso)' : 'var(--cor-alerta)', 
              fontSize: '.85rem' 
            }}>
              {msg}
            </div>
          )}
          <form onSubmit={criarInstancia} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="input-group"><label className="input-group__label">Nome de exibição</label><input className="input" required value={instForm.nome} onChange={(e) => setInstForm({ ...instForm, nome: e.target.value })} /></div>
            <div className="input-group"><label className="input-group__label">Nome da instância (Evolution API)</label><input className="input" required value={instForm.instanceName} onChange={(e) => setInstForm({ ...instForm, instanceName: e.target.value })} placeholder="minha-instancia" /></div>
            <button className="btn btn--primary" type="submit">Criar e Conectar</button>
          </form>
          {qrcode && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <p style={{ marginBottom: 8, fontWeight: 600 }}>Escaneie o QR Code no WhatsApp:</p>
              <img src={qrcode} alt="QR Code WhatsApp" style={{ maxWidth: 260, borderRadius: 'var(--radius-lg)', border: '1px solid var(--cor-borda)' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
