import type { NextAuthConfig } from 'next-auth'
import { prisma } from '@/lib/prisma'

// Config compartilhada entre a instância completa (src/auth.ts — usada pelas
// API routes, Node.js runtime) e a instância "edge-safe" (src/auth.edge.ts —
// usada só pelo middleware, Edge Runtime). NÃO importar aqui nada que puxe
// dependências incompatíveis com Edge (ioredis, bcryptjs no authorize, etc.)
// — foi exatamente isso que quebrou o build quando o rate limit do login
// (baseado em ioredis) foi parar no grafo de módulos do middleware.
// `prisma` já é usado aqui e builda normalmente no Edge Runtime porque o
// cliente gerado não faz `require` estático de node:builtins incompatíveis
// (ao contrário do `ioredis`, que faz isso em `tracing.js`).

export const SESSION_MAX_AGE = 86400 // 24h

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      plan: string
      isAdmin: boolean
      oabNumber?: string | null
      phone?: string | null
      cpf?: string | null
      maritalStatus?: string | null
      profession?: string | null
      street?: string | null
      streetNumber?: string | null
      complement?: string | null
      neighborhood?: string | null
      city?: string | null
      state?: string | null
      zipCode?: string | null
      /** iat (segundos, epoch) do JWT — usado para invalidar sessões emitidas antes de um reset de senha */
      issuedAt?: number
    }
  }
}

async function enrichSessionUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true, isAdmin: true, oabNumber: true, phone: true,
      cpf: true, maritalStatus: true, profession: true,
      street: true, streetNumber: true, complement: true,
      neighborhood: true, city: true, state: true, zipCode: true,
    },
  })
}

export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const extUser = user as typeof user & { plan?: string; isAdmin?: boolean }
        const credPlan = extUser.plan
        const credIsAdmin = extUser.isAdmin
        if (credPlan !== undefined && credIsAdmin !== undefined) {
          token.plan = credPlan
          token.isAdmin = credIsAdmin
        }
        if (user.id) {
          const dbUser = await enrichSessionUser(user.id)
          if (!dbUser) return null
          Object.assign(token, {
            oabNumber: dbUser.oabNumber,
            phone: dbUser.phone,
            cpf: dbUser.cpf,
            maritalStatus: dbUser.maritalStatus,
            profession: dbUser.profession,
            street: dbUser.street,
            streetNumber: dbUser.streetNumber,
            complement: dbUser.complement,
            neighborhood: dbUser.neighborhood,
            city: dbUser.city,
            state: dbUser.state,
            zipCode: dbUser.zipCode,
          })
        }
      }

      if (trigger === 'update') {
        const userId = (typeof token.sub === 'string' ? token.sub : undefined)
                    ?? (typeof token.id === 'string' ? token.id : undefined)
        if (userId) {
          const dbUser = await enrichSessionUser(userId)
          if (!dbUser) return null
          Object.assign(token, {
            plan: dbUser.plan,
            isAdmin: dbUser.isAdmin,
            oabNumber: dbUser.oabNumber,
            phone: dbUser.phone,
            cpf: dbUser.cpf,
            maritalStatus: dbUser.maritalStatus,
            profession: dbUser.profession,
            street: dbUser.street,
            streetNumber: dbUser.streetNumber,
            complement: dbUser.complement,
            neighborhood: dbUser.neighborhood,
            city: dbUser.city,
            state: dbUser.state,
            zipCode: dbUser.zipCode,
          })
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }

      session.user.plan = (token.plan as string | undefined) ?? 'FREE'
      session.user.isAdmin = (token.isAdmin as boolean | undefined) ?? false
      session.user.oabNumber = token.oabNumber as string | undefined
      session.user.phone = token.phone as string | undefined
      session.user.cpf = token.cpf as string | undefined
      session.user.maritalStatus = token.maritalStatus as string | undefined
      session.user.profession = token.profession as string | undefined
      session.user.street = token.street as string | undefined
      session.user.streetNumber = token.streetNumber as string | undefined
      session.user.complement = token.complement as string | undefined
      session.user.neighborhood = token.neighborhood as string | undefined
      session.user.city = token.city as string | undefined
      session.user.state = token.state as string | undefined
      session.user.zipCode = token.zipCode as string | undefined
      session.user.issuedAt = token.iat

      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [], // preenchido só na instância completa (src/auth.ts)
} satisfies NextAuthConfig
