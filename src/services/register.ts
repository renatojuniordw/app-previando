import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export interface RegisterInput {
  name: string
  email: string
  password: string
  oabNumber?: string
}

export async function createUser(input: RegisterInput): Promise<{ id: string; email: string; plan: string }> {
  const passwordHash = await bcrypt.hash(input.password, 12)

  const result = await prisma.$transaction(
    async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: passwordHash,
          oabNumber: input.oabNumber,
          plan: 'FREE',
          planStatus: 'ACTIVE',
        },
      })

      await tx.usageRecord.create({
        data: {
          userId: user.id,
          totalClients: 0,
          calculationsThisMonth: 0,
          opinionsThisMonth: 0,
          bpcAnalysesThisMonth: 0,
          bpcSocialMediaThisMonth: 0,
        },
      })

      return user
    },
    { maxWait: 5000, timeout: 10000 }
  )

  return { id: result.id, email: result.email, plan: result.plan ?? 'FREE' } as { id: string; email: string; plan: string }
}
