/**
 * Utilitários de autenticação JWT
 * @module lib/auth
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import Logger from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-troque-em-producao';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface PayloadToken {
  userId: string;
  email: string;
  role: string;
}

/**
 * Gera hash seguro para senha (bcrypt)
 */
export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 12);
}

/**
 * Compara senha com hash armazenado
 */
export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

/**
 * Gera token JWT com payload do usuário
 */
export function gerarToken(payload: PayloadToken): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: 86400 }); // 24h em segundos
}

/**
 * Valida e decodifica token JWT
 */
export function validarToken(token: string): PayloadToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as PayloadToken;
  } catch (erro) {
    Logger.warn('Auth', 'Token inválido ou expirado', {
      data: { message: erro instanceof Error ? erro.message : String(erro) },
    });
    return null;
  }
}

/**
 * Extrai o usuário autenticado de uma NextRequest
 * Verifica header Authorization: Bearer <token>
 */
export function extrairUsuario(request: NextRequest): PayloadToken | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return validarToken(token);
}

/**
 * Middleware helper — verifica autenticação e role mínimo
 */
export function verificarPermissao(
  usuario: PayloadToken | null,
  rolesPermitidos: string[]
): boolean {
  if (!usuario) return false;
  return rolesPermitidos.includes(usuario.role);
}

export const Auth = {
  hashSenha,
  verificarSenha,
  gerarToken,
  validarToken,
  extrairUsuario,
  verificarPermissao,
};

export default Auth;
