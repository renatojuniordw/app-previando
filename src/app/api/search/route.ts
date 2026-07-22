import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    if (!q || q.length < 2) return NextResponse.json({ clients: [], cases: [] })

    const userId = session.user.id

    const [clients, cases] = await Promise.all([
      prisma.client.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { cpfHash: { contains: q } },
          ],
        },
        select: { id: true, name: true },
        take: 5,
      }),
      prisma.case.findMany({
        where: {
          userId,
          client: { name: { contains: q, mode: 'insensitive' } },
        },
        select: { id: true, benefitType: true, client: { select: { name: true } } },
        take: 5,
      }),
    ])

    return NextResponse.json({
      clients: clients.map((c) => ({
        id: c.id,
        label: c.name,
        subtitle: 'Cliente',
        href: `/clients/list/${c.id}`,
      })),
      cases: cases.map((c) => ({
        id: c.id,
        label: c.benefitType,
        subtitle: c.client.name,
        href: `/cases/${c.id}`,
      })),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
