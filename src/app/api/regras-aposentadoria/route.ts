import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRegrasVigentes } from '@/lib/regras-aposentadoria'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
    const dib = req.nextUrl.searchParams.get('dib')
    if (!dib) {
      return NextResponse.json({ error: 'Parâmetro dib é obrigatório.' }, { status: 400 })
    }

    const regras = await getRegrasVigentes(dib)
    return NextResponse.json(regras)
  } catch (err) {
    return handleApiError(err)
  }
}
