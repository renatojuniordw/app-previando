// Telemetria do funil de conversão (paywall → CTA). Fire-and-forget:
// nunca lança, nunca bloqueia a UI. Usa fetch com keepalive para o evento
// sobreviver à navegação que geralmente segue o clique no CTA.

export type ConversionEventName =
  | 'TEASER_VIEW'
  | 'TEASER_CTA_CLICK'
  | 'PAYWALL_MODAL_VIEW'
  | 'PAYWALL_MODAL_CTA_CLICK'

export function trackConversion(event: ConversionEventName, feature: string): void {
  if (!feature) return
  try {
    // Views são deduplicadas por sessão: navegar entre abas bloqueadas não
    // deve inflar o denominador do funil (view → clique). Cliques contam
    // sempre — repetição de clique é sinal real de intenção.
    if (event === 'TEASER_VIEW' || event === 'PAYWALL_MODAL_VIEW') {
      const dedupKey = `conv-tracked:${event}:${feature}`
      if (sessionStorage.getItem(dedupKey)) return
      sessionStorage.setItem(dedupKey, '1')
    }
    void fetch('/api/track/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, feature }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Telemetria nunca pode quebrar a UI
  }
}
