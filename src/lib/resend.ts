import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY não configurada. Defina a variável de ambiente RESEND_API_KEY com sua API key do Resend.'
      )
    }
    _resend = new Resend(apiKey)
  }
  return _resend
}

export { getResend }

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Previando <noreply@previando.com.br>'
