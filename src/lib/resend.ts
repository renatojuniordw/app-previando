import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY

if (!apiKey) {
  throw new Error(
    'RESEND_API_KEY não configurada. Defina a variável de ambiente RESEND_API_KEY com sua API key do Resend.'
  )
}

export const resend = new Resend(apiKey)

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Previando <noreply@previando.com.br>'
