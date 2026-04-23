'use client';
import './globals.css';
import { useUiStore } from '@/stores/uiStore';
import { useEffect, useState } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const darkMode = useUiStore((s) => s.darkMode);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <html lang="pt-BR" data-theme={mounted && !darkMode ? 'light' : undefined} suppressHydrationWarning>
      <head>
        <title>SanzonyZap CRM — Atendimento WhatsApp</title>
        <meta name="description" content="CRM profissional de multiatendimento via WhatsApp integrado com Evolution API" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
