import { createHmac, timingSafeEqual } from 'crypto'

// Sessão de verificação de identidade do Portal do Cliente.
// O portal é acessado sem conta (token na URL); quando o advogado ativa
// `requireIdentity`, os dados sensíveis só são liberados após o cliente
// confirmar CPF + data de nascimento (ver /api/portal/[token]/verify).
// Esse cookie assinado é o que efetivamente barra o acesso no servidor —
// sem ele, qualquer verificação feita só no cliente é cosmética (os dados
// já teriam sido embutidos no HTML antes da verificação).

export const PORTAL_SESSION_COOKIE = 'portal_verified'
const SESSION_TTL_SECONDS = 60 * 60 * 2 // 2 horas

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET não configurado.')
  return secret
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export function createPortalSessionValue(portalToken: string): { value: string; maxAge: number } {
  const exp = Date.now() + SESSION_TTL_SECONDS * 1000
  const payload = `${portalToken}.${exp}`
  const signature = sign(payload)
  return { value: `${payload}.${signature}`, maxAge: SESSION_TTL_SECONDS }
}

export function isPortalSessionValid(cookieValue: string | undefined | null, portalToken: string): boolean {
  if (!cookieValue) return false

  const lastDot = cookieValue.lastIndexOf('.')
  if (lastDot <= 0) return false

  const payload = cookieValue.slice(0, lastDot)
  const signature = cookieValue.slice(lastDot + 1)

  const firstDot = payload.indexOf('.')
  if (firstDot <= 0) return false

  const tokenPart = payload.slice(0, firstDot)
  const expPart = payload.slice(firstDot + 1)

  if (tokenPart !== portalToken) return false

  const exp = Number(expPart)
  if (!Number.isFinite(exp) || Date.now() > exp) return false

  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false

  return timingSafeEqual(a, b)
}
