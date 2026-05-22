import { formatDate } from './utils'

export function buildProcessWhatsAppMessage(data: {
  processNumber: string
  lastMovDate: string | null
  summary: string
}): string {
  return [
    `⚖️ *Atualização do seu processo*`,
    ``,
    `📋 *Processo:* ${data.processNumber}`,
    data.lastMovDate ? `📅 *Última movimentação:* ${formatDate(data.lastMovDate)}` : '',
    ``,
    data.summary,
    ``,
    `_Para dúvidas jurídicas, consulte seu advogado._`,
    `_Informação gerada via Previando (app.previando.com.br)_`,
    `_Previando é um produto Unificando_`,
  ].filter(Boolean).join('\n')
}

export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
