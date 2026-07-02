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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE },

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

      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
})
