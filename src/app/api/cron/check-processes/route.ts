import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'Endpoint descontinuado.' },
    { status: 410 }
  )
}
