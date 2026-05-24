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

  // ─── Salários Mínimos Históricos ────────────────────────────────────────────
  console.log('🌱 Seeding SalariosMinimos...')

  const salarios = [
    { vigencia: new Date('2026-01-01'), valor: 1621.00, teto: 8157.41, legislacao: 'Decreto 12.797/2025', reajuste: 6.79 },
    { vigencia: new Date('2025-01-01'), valor: 1518.00, teto: 7786.02, legislacao: 'Decreto 12.342/2024', reajuste: 7.95 },
    { vigencia: new Date('2024-01-01'), valor: 1412.00, teto: 7786.02, legislacao: 'Decreto 11.864/2024', reajuste: 6.97 },
    { vigencia: new Date('2023-05-01'), valor: 1320.00, teto: 7507.49, legislacao: 'MP 1.172/2023 (Lei 14.663, de 2023)', reajuste: 8.90 },
    { vigencia: new Date('2023-01-01'), valor: 1302.00, teto: 7507.49, legislacao: 'MP 1.143/2022 (Lei 14.663, de 2023)', reajuste: 7.43 },
    { vigencia: new Date('2022-01-01'), valor: 1212.00, teto: 7087.22, legislacao: 'MP 1091/2021 (Lei 14.358, de 2022)', reajuste: 10.16 },
    { vigencia: new Date('2021-01-01'), valor: 1100.00, teto: 6433.57, legislacao: 'MP 1021/2020 (Lei 14.158, de 2021)', reajuste: 5.26 },
    { vigencia: new Date('2020-02-01'), valor: 1045.00, teto: 6101.06, legislacao: 'MP 919/2020 (Lei 14.013, de 2020)', reajuste: 0.58 },
    { vigencia: new Date('2020-01-01'), valor: 1039.00, teto: 6101.06, legislacao: 'MP 916/2019 (Lei 14.013, de 2020)', reajuste: 4.10 },
    { vigencia: new Date('2019-01-01'), valor: 998.00, teto: 5839.45, legislacao: 'Decreto 9.661/2019', reajuste: 4.61 },
    { vigencia: new Date('2018-01-01'), valor: 954.00, teto: 5645.80, legislacao: 'Decreto 9.255/2017', reajuste: 1.81 },
    { vigencia: new Date('2017-01-01'), valor: 937.00, teto: 5531.31, legislacao: 'Lei 13.152/2015', reajuste: 6.48 },
    { vigencia: new Date('2016-01-01'), valor: 880.00, teto: 5189.82, legislacao: 'Decreto 8.618/2015', reajuste: 11.68 },
    { vigencia: new Date('2015-01-01'), valor: 788.00, teto: 4663.75, legislacao: 'Decreto 8.381/2014', reajuste: 8.84 },
    { vigencia: new Date('2014-01-01'), valor: 724.00, teto: 4390.24, legislacao: 'Decreto 8.166/2013', reajuste: 6.78 },
    { vigencia: new Date('2013-01-01'), valor: 678.00, teto: 4159.00, legislacao: 'Decreto 7.872/2012', reajuste: 9.00 },
    { vigencia: new Date('2012-01-01'), valor: 622.00, teto: 3916.20, legislacao: 'Decreto 7.655/2011', reajuste: 14.13 },
    { vigencia: new Date('2011-03-01'), valor: 545.00, teto: 3691.74, legislacao: 'Lei 12.382/2011', reajuste: 0.93 },
    { vigencia: new Date('2011-01-01'), valor: 540.00, teto: 3691.74, legislacao: 'MP 516/2010 (Lei Nº 12.382, 2011)', reajuste: 5.88 },
    { vigencia: new Date('2010-01-01'), valor: 510.00, teto: 3467.40, legislacao: 'Lei 12.255/2010', reajuste: 9.68 },
    { vigencia: new Date('2009-02-01'), valor: 465.00, teto: 3218.90, legislacao: 'Lei 11.944/2009', reajuste: 12.05 },
    { vigencia: new Date('2008-03-01'), valor: 415.00, teto: 3038.99, legislacao: 'Lei 11.709/2008', reajuste: 9.21 },
    { vigencia: new Date('2007-04-01'), valor: 380.00, teto: 2894.28, legislacao: 'Lei 11.498/2007', reajuste: 8.57 },
    { vigencia: new Date('2006-04-01'), valor: 350.00, teto: 2801.82, legislacao: 'Lei 11.321/2006', reajuste: 16.67 },
    { vigencia: new Date('2005-05-01'), valor: 300.00, teto: 2668.15, legislacao: 'Lei 11.164/2005', reajuste: 15.38 },
    { vigencia: new Date('2004-05-01'), valor: 260.00, teto: 2508.72, legislacao: 'Lei 10.888/2004', reajuste: 8.33 },
    { vigencia: new Date('2003-06-01'), valor: 240.00, teto: 1869.34, legislacao: 'Lei 10.699/2003', reajuste: 20.00 },
    { vigencia: new Date('2002-06-01'), valor: 200.00, teto: 1561.56, legislacao: 'Lei 10.525/2002', reajuste: 11.11 },
    { vigencia: new Date('2001-06-01'), valor: 180.00, teto: 1430.00, legislacao: 'MP 2.194-6/2001', reajuste: 19.21 },
    { vigencia: new Date('2000-06-01'), valor: 151.00, teto: 1255.32, legislacao: 'Lei 9.971/2000', reajuste: 11.03 },
    { vigencia: new Date('1999-05-01'), valor: 136.00, teto: 1255.32, legislacao: 'Lei 9.971/2000', reajuste: 4.62 },
    { vigencia: new Date('1998-05-01'), valor: 130.00, teto: 1081.50, legislacao: 'Lei 9.971/2000', reajuste: 8.33 },
    { vigencia: new Date('1997-05-01'), valor: 120.00, teto: 1031.87, legislacao: 'Lei 9.971/2000', reajuste: 7.14 },
    { vigencia: new Date('1996-05-01'), valor: 112.00, teto: 957.87, legislacao: 'Lei 9.971/2000', reajuste: 12.00 },
    { vigencia: new Date('1995-05-01'), valor: 100.00, teto: 957.87, legislacao: 'Lei 9.032/1995', reajuste: 42.86 },
    { vigencia: new Date('1994-09-01'), valor: 70.00, teto: 649.18, legislacao: 'MP 598/1994', reajuste: 8.04 },
    { vigencia: new Date('1994-07-01'), valor: 64.79, teto: 649.18, legislacao: 'Lei 8.880/1994', reajuste: null },
  ]

  for (const s of salarios) {
    await prisma.salarioMinimo.upsert({
      where: { vigencia: s.vigencia },
      update: { valor: s.valor, teto: s.teto, legislacao: s.legislacao, reajuste: s.reajuste },
      create: s,
    })
  }

  console.log(`✅ ${salarios.length} registros de SalarioMinimo inseridos`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
