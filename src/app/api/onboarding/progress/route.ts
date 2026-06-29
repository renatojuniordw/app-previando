/**
 * GET /api/onboarding/progress
 *
 * Returns the user's onboarding progress.
 * Also sets firstLoginAt on the first call (server-side detection).
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const userId = session.user.id

  const [user, clientCount, caseCount, cnisCount, calcCount, opinionCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { firstLoginAt: true } }),
    prisma.client.count({ where: { userId } }),
    prisma.case.count({ where: { userId } }),
    prisma.cnisDocument.count({ where: { case: { userId }, processingStatus: 'COMPLETED' } }),
    prisma.calculation.count({ where: { case: { userId } } }),
    prisma.opinion.count({ where: { case: { userId } } }),
  ])

  const isFirstLogin = !user?.firstLoginAt

  if (isFirstLogin) {
    await prisma.user.update({
      where: { id: userId },
      data: { firstLoginAt: new Date() },
    })
  }

  const hasClients = clientCount > 0
  const hasCases = caseCount > 0
  const hasCnis = cnisCount > 0
  const hasCalculation = calcCount > 0
  const hasOpinion = opinionCount > 0

  const steps = [hasClients, hasCases, hasCnis, hasCalculation, hasOpinion]
  const completedSteps = steps.filter(Boolean).length
  const totalSteps = steps.length
  const isComplete = completedSteps === totalSteps

  return NextResponse.json({
    isFirstLogin,
    hasClients,
    hasCases,
    hasCnis,
    hasCalculation,
    hasOpinion,
    completedSteps,
    totalSteps,
    isComplete,
  })
}
