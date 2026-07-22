import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { hashPortalToken } from '@/lib/portal-session'
import { getSignedDownloadUrl } from '@/services/r2'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const access = await prisma.clientAccess.findUnique({
      where: { tokenHash: hashPortalToken(params.token) },
      include: {
        case: {
          select: {
            id: true,
            documents: {
              where: { shared: true },
              orderBy: { createdAt: 'desc' },
              select: { id: true, fileName: true, contentType: true, createdAt: true, r2Key: true },
            },
          },
        },
      },
    })

    if (!access || access.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Acesso não encontrado ou expirado.' }, { status: 404 })
    }

    const documents = await Promise.all(
      access.case.documents.map(async (doc) => ({
        id: doc.id,
        fileName: doc.fileName,
        contentType: doc.contentType,
        createdAt: doc.createdAt,
        downloadUrl: await getSignedDownloadUrl(doc.r2Key),
      }))
    )

    return NextResponse.json({ documents })
  } catch (err) {
    return handleApiError(err)
  }
}
