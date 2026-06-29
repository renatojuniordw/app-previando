// DEPRECATED: TrackJud Vigilant substituiu o polling do DataJud.
// O monitoramento agora é push via webhook (POST /api/webhooks/trackjud).
// Este endpoint foi mantido apenas para compatibilidade e retorna 410 Gone.
// Pode ser removido após confirmar que nenhum cron externo o chama.

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error: 'Polling descontinuado. Monitoramento agora é push via TrackJud Vigilant.',
      migrated: true,
    },
    { status: 410 }
  )
}
