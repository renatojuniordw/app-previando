import { NextRequest, NextResponse } from 'next/server'
import { getRegrasVigentes } from '@/lib/regras-aposentadoria'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
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
