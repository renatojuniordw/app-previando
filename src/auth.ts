import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { withEncryptedTokens } from '@/lib/oauth-token-adapter'
import { getClientIp } from '@/lib/request-ip'
import { authConfig } from '@/auth.config'

// Instância completa do NextAuth — só é importada por API routes (Node.js
// runtime). O middleware usa src/auth.edge.ts, que compartilha `authConfig`
// mas não os providers abaixo: o CredentialsProvider usa `rateLimit()`
// (ioredis), que quebra o build do middleware no Edge Runtime.

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: withEncryptedTokens(PrismaAdapter(prisma)),

  events: {
    // Disparado uma única vez quando o PrismaAdapter cria uma conta nova via
    // OAuth (Google) — o cadastro por credenciais não passa por aqui, pois
    // usa createUser() em src/services/register.ts diretamente.
    async createUser({ user }) {
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { termsAcceptedAt: new Date() },
        })
      }
    },
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials, request) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(8).max(100),
          })
          .safeParse(credentials)

        if (!parsed.success) return null

        const ip = getClientIp(request)

        // Brute force: no máximo 5 tentativas por IP e por email a cada 15 minutos
        const [ipLimit, emailLimit] = await Promise.all([
          rateLimit(`login:ip:${ip}`, 5, 900),
          rateLimit(`login:email:${parsed.data.email}`, 5, 900),
        ])
        if (!ipLimit.success || !emailLimit.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            plan: true,
            isAdmin: true,
          },
        })

        if (!user?.password) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          isAdmin: user.isAdmin,
        }
      },
    }),
  ],
})
