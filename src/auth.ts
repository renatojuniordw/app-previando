import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 86400 },

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
          email: user.email,
          name: user.name,
          plan: user.plan,
          isAdmin: user.isAdmin,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.plan = (user as { plan?: string }).plan ?? 'FREE'
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.plan = token.plan as string
      session.user.isAdmin = token.isAdmin as boolean
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'strict' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
})
