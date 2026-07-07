import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { verifyCaseOwnership, verifyCaseOwnershipAndActive } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

// 256 bits de entropia — nunca usar cuid/uuid sequencial para token de acesso público
function generatePortalToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * GET /api/cases/[id]/portal
 * Retorna o link compartilhável atual (se existir e não expirado).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const access = await prisma.clientAccess.findUnique({ where: { caseId: params.id } })

    if (!access || access.expiresAt < new Date()) {
      return NextResponse.json({ link: null })
    }

    const link = `${process.env.NEXTAUTH_URL ?? ''}/portal/${access.token}`
    return NextResponse.json({ link, expiresAt: access.expiresAt })
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * POST /api/cases/[id]/portal
 * Gera (ou renova) o link compartilhável para o caso.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnershipAndActive(params.id, session.user.id)

    const { success: limitOk } = await rateLimit(`portal-token:${session.user.id}`, 5, 3600)
    if (!limitOk) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })

    const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS)

    const access = await prisma.clientAccess.upsert({
      where: { caseId: params.id },
      create: { caseId: params.id, userId: session.user.id, expiresAt, token: generatePortalToken() },
      update: { expiresAt },
    })

    const link = `${process.env.NEXTAUTH_URL ?? ''}/portal/${access.token}`
    return NextResponse.json({ link, expiresAt: access.expiresAt }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * DELETE /api/cases/[id]/portal
 * Revoga o link compartilhável do caso.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    await prisma.clientAccess.deleteMany({ where: { caseId: params.id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
