/**
 * Funções utilitárias gerais
 * @module lib/utils
 */

/**
 * Formata número de telefone para padrão internacional (E.164)
 */
export function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '');
  if (numeros.startsWith('55') && numeros.length >= 12) {
    return numeros;
  }
  if (numeros.length === 11) {
    return `55${numeros}`;
  }
  if (numeros.length === 10) {
    return `55${numeros}`;
  }
  return numeros;
}

/**
 * Formata telefone para exibição (ex: +55 11 99999-9999)
 */
export function telefoneParaExibicao(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '');
  if (numeros.length === 13) {
    return `+${numeros.slice(0, 2)} ${numeros.slice(2, 4)} ${numeros.slice(4, 9)}-${numeros.slice(9)}`;
  }
  if (numeros.length === 12) {
    return `+${numeros.slice(0, 2)} ${numeros.slice(2, 4)} ${numeros.slice(4, 8)}-${numeros.slice(8)}`;
  }
  return telefone;
}

/**
 * Gera iniciais do nome para avatar
 */
export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

/**
 * Formata data relativa (ex: "há 5 min", "ontem")
 */
export function tempoRelativo(data: Date | string): string {
  const agora = new Date();
  const alvo = new Date(data);
  const diffMs = agora.getTime() - alvo.getTime();
  const diffSeg = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSeg / 60);
  const diffHora = Math.floor(diffMin / 60);
  const diffDia = Math.floor(diffHora / 24);

  if (diffSeg < 60) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHora < 24) return `${diffHora}h`;
  if (diffDia === 1) return 'ontem';
  if (diffDia < 7) return `${diffDia}d`;
  return alvo.toLocaleDateString('pt-BR');
}

/**
 * Formata hora (HH:mm)
 */
export function formatarHora(data: Date | string): string {
  return new Date(data).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata valor monetário (R$)
 */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Gera cor consistente baseada em string (para avatares)
 */
export function corPorString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 45%)`;
}

/**
 * Trunca texto com reticências
 */
export function truncar(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  return texto.substring(0, max).trimEnd() + '…';
}

/**
 * Debounce para inputs
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Classnames helper (tipo clsx simplificado)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
