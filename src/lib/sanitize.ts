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

export const maskCPF = (cpf?: string) => {
  if (!cpf) return '***.***.**-**'
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return '***.***.**-**'
  return `${digits.slice(0, 3)}.***.${digits.slice(6, 9)}-**`
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 13)
}

export function sanitizeForAI(input: string, maxLength: number = 3000): string {
  return input
    .replace(/---/g, '')
    .replace(/```/g, '')
    .replace(/ignore (previous|all) instructions/gi, '')
    .replace(/you are now|act as|pretend (you are|to be)|jailbreak/gi, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    .slice(0, maxLength)
    .trim()
}
