import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Session duration in seconds (24h)
const SESSION_MAX_AGE = 86400

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      plan: string
      isAdmin: boolean
    }
  }
}

async function enrichSessionUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, isAdmin: true },
  })
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { scope: 'openid email profile' } },
    }),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(8).max(100),
          })
          .safeParse(credentials)

        if (!parsed.success) return null

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

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        // Initial sign-in — CredentialsProvider returns plan/isAdmin directly;
        // Google OAuth does not, so fall back to a DB fetch.
        const credPlan = (user as any).plan as string | undefined
        const credIsAdmin = (user as any).isAdmin as boolean | undefined
        if (credPlan !== undefined && credIsAdmin !== undefined) {
          token.plan = credPlan
          token.isAdmin = credIsAdmin
        } else if (user.id) {
          const dbUser = await enrichSessionUser(user.id)
          if (!dbUser) return null // user not found in DB → reject token
          token.plan = dbUser.plan
          token.isAdmin = dbUser.isAdmin
        }
      }

      if (trigger === 'update') {
        const userId = (typeof token.sub === 'string' ? token.sub : undefined)
                    ?? (typeof token.id === 'string' ? token.id : undefined)
        if (userId) {
          const dbUser = await enrichSessionUser(userId)
          if (!dbUser) return null // user deleted → invalidate token
          token.plan = dbUser.plan
          token.isAdmin = dbUser.isAdmin
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

      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
})
