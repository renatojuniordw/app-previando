import DOMPurify from 'isomorphic-dompurify'
import { createHmac } from 'crypto'

export function sanitizeInput(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .trim()
    .slice(0, 10000)
}

export function hashCPF(cpf: string): string {
  const salt = process.env.CPF_HASH_SALT
  if (!salt) throw new Error('CPF_HASH_SALT não configurado — defina a variável de ambiente antes de usar esta função')
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11) throw new Error('CPF inválido')
  return createHmac('sha256', salt).update(clean).digest('hex')
}
