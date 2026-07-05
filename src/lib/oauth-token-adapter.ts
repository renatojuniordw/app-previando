import type { Adapter, AdapterAccount } from 'next-auth/adapters'
import { encrypt } from './encryption'

/**
 * Envolve o PrismaAdapter para nunca gravar access_token/refresh_token do OAuth
 * em texto puro. Esses tokens dão acesso de escrita ao Google Calendar do
 * advogado (escopo `calendar`) — um dump do banco não deve entregá-los prontos
 * para uso. A leitura/descriptografia acontece no ponto de consumo
 * (src/services/google-calendar.ts), não aqui.
 */
export function withEncryptedTokens(adapter: Adapter): Adapter {
  const originalLinkAccount = adapter.linkAccount?.bind(adapter)

  return {
    ...adapter,
    async linkAccount(account: AdapterAccount) {
      if (!originalLinkAccount) return

      const toStore: AdapterAccount = {
        ...account,
        access_token: account.access_token ? encrypt(account.access_token) : account.access_token,
        refresh_token: account.refresh_token ? encrypt(account.refresh_token) : account.refresh_token,
      }
      await originalLinkAccount(toStore)
    },
  }
}
