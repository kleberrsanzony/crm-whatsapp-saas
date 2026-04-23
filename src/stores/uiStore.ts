/**
 * Store de UI — Dark mode, sidebar, notificações
 * @module stores/uiStore
 */
'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  darkMode: boolean;
  sidebarAberta: boolean;
  notificacaoSonora: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebar: (v: boolean) => void;
  toggleNotificacaoSonora: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      darkMode: true,
      sidebarAberta: true,
      notificacaoSonora: true,

      toggleDarkMode: () =>
        set((s) => ({ darkMode: !s.darkMode })),
      toggleSidebar: () =>
        set((s) => ({ sidebarAberta: !s.sidebarAberta })),
      setSidebar: (v) => set({ sidebarAberta: v }),
      toggleNotificacaoSonora: () =>
        set((s) => ({ notificacaoSonora: !s.notificacaoSonora })),
    }),
    { name: 'crm-ui' }
  )
);
