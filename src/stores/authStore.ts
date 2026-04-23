/**
 * Store de autenticação — Zustand com persistência
 * @module stores/authStore
 */
'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  avatar?: string | null;
}

interface AuthState {
  token: string | null;
  usuario: Usuario | null;
  autenticado: boolean;
  login: (token: string, usuario: Usuario) => void;
  logout: () => void;
  atualizarUsuario: (dados: Partial<Usuario>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      autenticado: false,

      login: (token, usuario) =>
        set({ token, usuario, autenticado: true }),

      logout: () =>
        set({ token: null, usuario: null, autenticado: false }),

      atualizarUsuario: (dados) =>
        set((state) => ({
          usuario: state.usuario ? { ...state.usuario, ...dados } : null,
        })),
    }),
    { name: 'crm-auth' }
  )
);
