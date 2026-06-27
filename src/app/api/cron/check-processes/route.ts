import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { queryProcess } from '@/services/datajud'

const CRON_SECRET = process.env.CRON_SECRET
const CHECK_INTERVAL_HOURS = 24

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - CHECK_INTERVAL_HOURS * 60 * 60 * 1000)

  const cases = await prisma.case.findMany({
    where: {
      processNumber: { not: null },
      OR: [
        { processLastCheck: null },
        { processLastCheck: { lt: cutoff } },
      ],
    },
    select: { id: true, processNumber: true },
    take: 50,
  })

  let updated = 0
  let errors = 0

  for (const caso of cases) {
    if (!caso.processNumber) continue

    try {
      const result = await queryProcess(caso.processNumber)
      const now = new Date()

      if (result.found && result.data) {
        const d = result.data
        await prisma.case.update({
          where: { id: caso.id },
          data: {
            processLastCheck: now,
            processLastMovDate: d.ultimaMovimentacao?.data
              ? new Date(d.ultimaMovimentacao.data)
              : undefined,
            processLastMovCount: d.totalMovimentacoes,
            processLastSummary: d.ultimaMovimentacao?.descricao ?? null,
          },
        })
      } else {
        await prisma.case.update({
          where: { id: caso.id },
          data: { processLastCheck: now },
        })
      }
      updated++
    } catch {
      errors++
    }
  }

  return NextResponse.json({ checked: cases.length, updated, errors })
}
