/**
 * Logger estruturado — Logs em formato JSON com contexto
 * @module lib/logger
 */

type Severidade = 'info' | 'warn' | 'error' | 'fatal';

interface LogEstruturado {
  timestamp: string;
  severity: Severidade;
  context: string;
  message: string;
  userId?: string;
  stack?: string;
  data?: Record<string, unknown>;
}

/**
 * Registra um log estruturado no formato JSON
 */
function registrar(
  severity: Severidade,
  context: string,
  message: string,
  extras?: { userId?: string; error?: Error; data?: Record<string, unknown> }
): void {
  const log: LogEstruturado = {
    timestamp: new Date().toISOString(),
    severity,
    context,
    message,
    ...(extras?.userId && { userId: extras.userId }),
    ...(extras?.error?.stack && { stack: extras.error.stack }),
    ...(extras?.data && { data: extras.data }),
  };

  switch (severity) {
    case 'error':
    case 'fatal':
      console.error(JSON.stringify(log));
      break;
    case 'warn':
      console.warn(JSON.stringify(log));
      break;
    default:
      if (process.env.NODE_ENV === 'development') {
        console.info(JSON.stringify(log));
      }
  }
}

export const Logger = {
  info: (ctx: string, msg: string, extras?: { userId?: string; data?: Record<string, unknown> }) =>
    registrar('info', ctx, msg, extras),
  warn: (ctx: string, msg: string, extras?: { userId?: string; data?: Record<string, unknown> }) =>
    registrar('warn', ctx, msg, extras),
  error: (ctx: string, msg: string, extras?: { userId?: string; error?: Error; data?: Record<string, unknown> }) =>
    registrar('error', ctx, msg, extras),
  fatal: (ctx: string, msg: string, extras?: { userId?: string; error?: Error; data?: Record<string, unknown> }) =>
    registrar('fatal', ctx, msg, extras),
};

export default Logger;
