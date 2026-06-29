import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasCalendarAccess } from '@/services/google-calendar'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const connected = await hasCalendarAccess(session.user.id)
    return NextResponse.json({ connected })
  } catch (err) {
    return handleApiError(err)
  }
}
