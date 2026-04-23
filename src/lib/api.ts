/**
 * Wrapper HTTP — Fetch com autenticação automática
 * @module lib/api
 */
'use client';

const BASE_URL = '/api';

function obterToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('crm-auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.token || null;
    }
  } catch { /* sem token */ }
  return null;
}

async function requisicao<T = unknown>(
  endpoint: string,
  opcoes: RequestInit = {}
): Promise<T> {
  const token = obterToken();

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opcoes.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('crm-auth');
    window.location.href = '/login';
    throw new Error('Não autenticado');
  }

  const dados = await res.json();

  if (!res.ok) {
    throw new Error(dados.erro || `Erro ${res.status}`);
  }

  return dados as T;
}

export const api = {
  get: <T = unknown>(endpoint: string) => requisicao<T>(endpoint),
  post: <T = unknown>(endpoint: string, body: unknown) =>
    requisicao<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T = unknown>(endpoint: string, body: unknown) =>
    requisicao<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = unknown>(endpoint: string, body?: unknown) =>
    requisicao<T>(endpoint, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
};

export default api;
