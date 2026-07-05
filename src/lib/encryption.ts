import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length < 64) {
    throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes for AES-256)')
  }
  return Buffer.from(hex.slice(0, 64), 'hex')
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, encHex] = ciphertext.split(':')
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()])
  return decrypted.toString('utf8')
}

const CIPHERTEXT_FORMAT = /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/i

/**
 * Descriptografa se o valor tiver o formato `iv:tag:enc` produzido por `encrypt()`;
 * caso contrário devolve o valor como veio. Usado em migrações de campos que
 * passaram a ser criptografados em produção — dados antigos ficam em texto puro
 * até serem regravados (ex: próximo refresh de token OAuth), e não podem quebrar
 * a leitura enquanto isso não acontece.
 */
export function decryptOrPlain(value: string): string {
  if (!CIPHERTEXT_FORMAT.test(value)) return value
  try {
    return decrypt(value)
  } catch {
    return value
  }
}
