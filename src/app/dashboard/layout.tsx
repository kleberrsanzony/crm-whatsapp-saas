'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

const MENU = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/chat', icon: '💬', label: 'Atendimento' },
  { href: '/dashboard/pipeline', icon: '🎯', label: 'Funil de Vendas' },
  { href: '/dashboard/clients', icon: '👥', label: 'Clientes' },
  { href: '/dashboard/automations', icon: '⚡', label: 'Automações' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Configurações' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { autenticado, usuario, logout } = useAuthStore();
  const { darkMode, toggleDarkMode, sidebarAberta, toggleSidebar } = useUiStore();

  useEffect(() => {
    if (!autenticado) router.replace('/login');
  }, [autenticado, router]);

  if (!autenticado) return null;

  return (
    <div className="layout">
      <aside className={`layout__sidebar ${sidebarAberta ? '' : 'layout__sidebar--collapsed'}`}>
        <div className="sidebar__logo">
          <span className="sidebar__logo-icon">💬</span>
          {sidebarAberta && <span>SanzonyZap</span>}
        </div>
        <nav className="sidebar__nav">
          {MENU.map((item) => (
            <button
              key={item.href}
              className={`sidebar__item ${pathname === item.href ? 'sidebar__item--active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              <span className="sidebar__item-icon">{item.icon}</span>
              {sidebarAberta && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar__footer">
          {sidebarAberta && (
            <>
              <div className="avatar" style={{ background: '#4a6' }}>
                {usuario?.nome?.charAt(0) || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario?.nome}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--cor-texto-secundario)' }}>{usuario?.role}</div>
              </div>
            </>
          )}
        </div>
      </aside>

      <div className="layout__main">
        <header className="layout__header">
          <div className="header__left">
            <button className="btn--icon" onClick={toggleSidebar} title="Menu">☰</button>
            <h1 className="header__title">{MENU.find((m) => m.href === pathname)?.label || 'Dashboard'}</h1>
          </div>
          <div className="header__right">
            <button className="btn--icon" onClick={toggleDarkMode} title="Tema">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button className="btn--icon" title="Notificações">🔔</button>
            <button className="btn btn--ghost btn--sm" onClick={() => { logout(); router.replace('/login'); }}>Sair</button>
          </div>
        </header>
        <main className="layout__content">{children}</main>
      </div>
    </div>
  );
}
