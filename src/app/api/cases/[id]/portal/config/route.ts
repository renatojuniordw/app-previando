import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyCaseOwnership } from '@/lib/ownership'
import { handleApiError } from '@/lib/api-error'
import { Logger } from '@/lib/logger'
import type { PortalConfig } from '@/lib/portal-config'

const logger = new Logger('PortalConfig')

/**
 * GET /api/cases/[id]/portal/config
 * Retorna a configuração atual do portal para este caso.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      select: { portalConfig: true },
    })

    if (!caso) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })

    return NextResponse.json({ portalConfig: caso.portalConfig as unknown as PortalConfig })
  } catch (err) {
    return handleApiError(err)
  }
}

/**
 * PATCH /api/cases/[id]/portal/config
 * Atualiza a configuração do portal (o que o cliente pode ver).
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    await verifyCaseOwnership(params.id, session.user.id)

    const body = await req.json()
    const {
      showProcessTracking,
      showCalculations,
      showRetroactives,
      showInterpretation,
      requireIdentity,
    } = body

    // Validação: todos os campos devem ser booleanos se fornecidos
    const updates: Partial<PortalConfig> = {}
    if (typeof showProcessTracking === 'boolean') updates.showProcessTracking = showProcessTracking
    if (typeof showCalculations === 'boolean') updates.showCalculations = showCalculations
    if (typeof showRetroactives === 'boolean') updates.showRetroactives = showRetroactives
    if (typeof showInterpretation === 'boolean') updates.showInterpretation = showInterpretation
    if (typeof requireIdentity === 'boolean') updates.requireIdentity = requireIdentity

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar.' }, { status: 400 })
    }

    // Buscar config atual e fazer merge
    const caso = await prisma.case.findUnique({
      where: { id: params.id },
      select: { portalConfig: true },
    })

    if (!caso) return NextResponse.json({ error: 'Caso não encontrado.' }, { status: 404 })

    const currentConfig = caso.portalConfig as unknown as PortalConfig
    const mergedConfig: PortalConfig = { ...currentConfig, ...updates }

    await prisma.case.update({
      where: { id: params.id },
      data: { portalConfig: mergedConfig as never },
    })

    logger.info(`Portal config atualizado: caseId=${params.id} config=${JSON.stringify(mergedConfig)}`)

    return NextResponse.json({ portalConfig: mergedConfig })
  } catch (err) {
    return handleApiError(err)
  }
}
