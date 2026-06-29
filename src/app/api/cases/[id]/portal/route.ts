import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

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

    await verifyCaseOwnership(params.id, session.user.id)

    const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS)

    const access = await prisma.clientAccess.upsert({
      where: { caseId: params.id },
      create: { caseId: params.id, userId: session.user.id, expiresAt },
      update: { expiresAt, token: undefined },
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
