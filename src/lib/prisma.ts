import { PrismaClient } from '@prisma/client'
import { getBpcEncryptionExtension } from './prisma-bpc-encryption'
import { getUserCpfEncryptionExtension } from './prisma-user-encryption'

function extendClient(client: PrismaClient) {
  return client
    .$extends(getBpcEncryptionExtension())
    .$extends(getUserCpfEncryptionExtension())
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  // No Edge Runtime (middleware, via src/auth.config.ts) o @prisma/client é
  // resolvido para o build "browser", onde `Prisma.defineExtension` lança em
  // tempo de execução — por isso pulamos as extensões ali. Isso é seguro
  // porque o middleware nunca executa queries de fato através deste client:
  // `enrichSessionUser` só roda no sign-in/update, que passam pela instância
  // Node.js completa (src/auth.ts), nunca por src/auth.edge.ts.
  if (process.env.NEXT_RUNTIME === 'edge') {
    return client as unknown as ReturnType<typeof extendClient>
  }

  return extendClient(client)
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
