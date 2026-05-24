import { NextResponse } from 'next/server'
import { getModalidades } from '@/lib/modalidades'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const modalidades = await getModalidades()
    return NextResponse.json({ modalidades })
  } catch (err) {
    return handleApiError(err)
  }
}
