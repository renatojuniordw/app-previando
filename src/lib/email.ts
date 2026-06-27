import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = process.env.EMAIL_FROM ?? 'Previando <noreply@previando.com.br>'
const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Redefinição de senha - Previando',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#1e293b;margin-bottom:8px">Redefinição de senha</h2>
        <p style="color:#475569;margin-bottom:24px">
          Recebemos uma solicitação para redefinir a senha da sua conta Previando.
          Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#d97706;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Redefinir senha
        </a>
        <p style="color:#94a3b8;font-size:13px;margin-top:24px">
          Se você não solicitou a redefinição, ignore este e-mail.
          <br>O link acima é válido por 1 hora a partir do envio.
        </p>
      </div>
    `,
  })
}
