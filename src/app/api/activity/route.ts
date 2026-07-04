import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

const ACTION_LABELS: Record<string, string> = {
  'case.created': 'Caso criado',
  'case.updated': 'Caso atualizado',
  'case.deleted': 'Caso excluído',
  'case.status.changed': 'Status alterado',
  'cnis.upload': 'CNIS enviado',
  'cnis.processed': 'CNIS processado',
  'cnis.failed': 'Falha no processamento CNIS',
  'calculation.created': 'Cálculo realizado',
  'calculation.selected': 'Cálculo selecionado',
  'retroative.created': 'Retroativo calculado',
  'opinion.created': 'Parecer gerado',
  'note.created': 'Nota adicionada',
  'bpc.pre-analysis': 'Pré-análise BPC gerada',
  'bpc.laudo': 'Laudo BPC analisado',
  'client.created': 'Cliente cadastrado',
  'client.updated': 'Cliente atualizado',
  'client.deleted': 'Cliente excluído',
  'simulation.created': 'Simulação realizada',
  'export.pdf': 'PDF exportado',
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '25')))
    const skip = (page - 1) * limit

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          action: true,
          resource: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.auditLog.count({ where: { userId: session.user.id } }),
    ])

    const formatted = logs.map((log) => ({
      ...log,
      label: ACTION_LABELS[log.action] ?? log.action,
    }))

    return NextResponse.json({ logs: formatted, total, page, limit }, {
      headers: { 'Cache-Control': 'private, max-age=0, stale-while-revalidate=30' },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
