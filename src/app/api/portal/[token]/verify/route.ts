import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashCPF } from '@/lib/sanitize-server'
import { handleApiError } from '@/lib/api-error'
import { rateLimit } from '@/lib/rate-limit'
import { Logger } from '@/lib/logger'
import { PORTAL_SESSION_COOKIE, createPortalSessionValue } from '@/lib/portal-session'

const logger = new Logger('PortalVerify')

// Últimos 6 caracteres do token — suficiente para correlacionar logs sem expor o segredo
function tokenFingerprint(token: string): string {
  return token.slice(-6)
}

/**
 * POST /api/portal/[token]/verify
 * Endpoint público — sem autenticação.
 * Valida a identidade do cliente via CPF parcial (últimos 3 dígitos) + data de nascimento.
 *
 * Body: { cpfLastDigits: string, birthDate: string }
 * - cpfLastDigits: últimos 3 dígitos do CPF (ex: "123")
 * - birthDate: data de nascimento no formato YYYY-MM-DD
 *
 * Resposta:
 * - 200: { verified: true } — identidade confirmada
 * - 401: { verified: false, error: "Dados não conferem." }
 * - 429: rate limit excedido
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    // Rate limit: 10 tentativas por hora por token (anti-brute-force)
    const rl = await rateLimit(`portal-verify:${params.token}`, 10, 3600)
    if (!rl.success) {
      return NextResponse.json(
        { verified: false, error: 'Muitas tentativas. Tente novamente em breve.' },
        { status: 429 }
      )
    }

    const access = await prisma.clientAccess.findUnique({
      where: { token: params.token },
      include: {
        case: {
          include: {
            client: { select: { cpfHash: true, birthDate: true } },
          },
        },
      },
    })

    if (!access) {
      return NextResponse.json({ error: 'Link inválido.' }, { status: 404 })
    }

    if (access.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Este link expirou.' }, { status: 410 })
    }

    const { cpf, birthDate } = await req.json()

    // Validações básicas
    if (!cpf || !birthDate) {
      return NextResponse.json(
        { verified: false, error: 'Informe o CPF e a data de nascimento.' },
        { status: 400 }
      )
    }

    const cpfDigits = String(cpf).replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      return NextResponse.json(
        { verified: false, error: 'CPF inválido. Deve ter 11 dígitos.' },
        { status: 400 }
      )
    }

    const birthStr = String(birthDate).trim()
    const birthDateObj = new Date(birthStr)
    if (isNaN(birthDateObj.getTime())) {
      return NextResponse.json(
        { verified: false, error: 'Data de nascimento inválida.' },
        { status: 400 }
      )
    }

    const client = access.case.client

    if (!client.cpfHash) {
      logger.warn(`Cliente sem cpfHash: caseId=${access.caseId}`)
      return NextResponse.json(
        { verified: false, error: 'Dados do cliente incompletos.' },
        { status: 500 }
      )
    }

    // Valida CPF completo via hash
    let cpfValido = false
    try {
      const hash = hashCPF(cpfDigits)
      cpfValido = hash === client.cpfHash
    } catch {
      return NextResponse.json(
        { verified: false, error: 'Erro ao validar CPF.' },
        { status: 500 }
      )
    }

    // Valida data de nascimento (comparação por ano-mês-dia)
    const clientBirthStr = client.birthDate.toISOString().split('T')[0]
    const dataValida = birthStr === clientBirthStr

    if (!cpfValido || !dataValida) {
      logger.info(`Falha na verificação: token=...${tokenFingerprint(params.token)} cpfOk=${cpfValido} dataOk=${dataValida}`)
      return NextResponse.json(
        { verified: false, error: 'Dados não conferem. Verifique o CPF e a data de nascimento.' },
        { status: 401 }
      )
    }

    logger.info(`Identidade verificada com sucesso: token=...${tokenFingerprint(params.token)}`)

    const res = NextResponse.json({
      verified: true,
      message: 'Identidade confirmada com sucesso.',
    })

    // Cookie assinado que efetivamente libera os dados sensíveis no servidor
    // (ver src/lib/portal-session.ts e src/app/portal/[token]/page.tsx)
    const session = createPortalSessionValue(params.token)
    res.cookies.set(PORTAL_SESSION_COOKIE, session.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: session.maxAge,
    })

    return res
  } catch (err) {
    return handleApiError(err)
  }
}
