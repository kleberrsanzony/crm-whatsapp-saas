'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function HomePage() {
  const router = useRouter();
  const autenticado = useAuthStore((s) => s.autenticado);

  useEffect(() => {
    router.replace(autenticado ? '/dashboard' : '/login');
  }, [autenticado, router]);

  return null;
}
