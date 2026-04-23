'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await api.post<{ token: string; usuario: { id: string; nome: string; email: string; role: string; avatar?: string } }>('/auth/login', { email, senha });
      login(res.token, res.usuario);
      router.push('/dashboard');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__logo">
          <div className="login__logo-icon">💬</div>
          <div className="login__logo-text">SanzonyZap</div>
          <div className="login__logo-sub">CRM de Atendimento WhatsApp</div>
        </div>
        <form className="login__form" onSubmit={handleSubmit}>
          {erro && <div className="login__erro">{erro}</div>}
          <div className="input-group">
            <label className="input-group__label">E-mail</label>
            <input className="input" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-group__label">Senha</label>
            <input className="input" type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          <button className="btn btn--primary login__submit" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
