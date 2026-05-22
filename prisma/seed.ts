import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding PlanLimits...')

  await prisma.planLimit.upsert({
    where: { plan: 'FREE' },
    update: {},
    create: {
      plan: 'FREE',
      maxClients: 3,
      maxCalculationsPerMonth: 5,
      maxOpinionsPerMonth: 1,
      maxNotesPerCase: 10,
      simulatorEnabled: false,
      retroativosEnabled: false,
      exportPdfEnabled: false,
      whatsappEnabled: false,
      watermarkEnabled: true,
      diagnosisEnabled: false,
      datajudEnabled: false,
    },
  })

  await prisma.planLimit.upsert({
    where: { plan: 'SOLO' },
    update: {},
    create: {
      plan: 'SOLO',
      maxClients: 30,
      maxCalculationsPerMonth: -1,
      maxOpinionsPerMonth: 20,
      maxNotesPerCase: -1,
      simulatorEnabled: true,
      retroativosEnabled: true,
      exportPdfEnabled: true,
      whatsappEnabled: true,
      watermarkEnabled: false,
      diagnosisEnabled: true,
      datajudEnabled: true,
    },
  })

  await prisma.planLimit.upsert({
    where: { plan: 'PRO' },
    update: {},
    create: {
      plan: 'PRO',
      maxClients: -1,
      maxCalculationsPerMonth: -1,
      maxOpinionsPerMonth: -1,
      maxNotesPerCase: -1,
      simulatorEnabled: true,
      retroativosEnabled: true,
      exportPdfEnabled: true,
      whatsappEnabled: true,
      watermarkEnabled: false,
      diagnosisEnabled: true,
      datajudEnabled: true,
    },
  })

  console.log('✅ PlanLimits seeded successfully')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
