import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSalarioVigente } from '@/lib/salario-minimo'
import { handleApiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const dib = req.nextUrl.searchParams.get('dib') ?? new Date().toISOString().slice(0, 10)
    const salario = await getSalarioVigente(dib)

    return NextResponse.json(salario)
  } catch (err) {
    return handleApiError(err)
  }
}
