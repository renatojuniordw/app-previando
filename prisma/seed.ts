import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Modalidades padrão traduzidas para o seed
interface ModalityPadrao {
  code: string
  label: string
  description?: string
  order: number
}

const MODALITIES_DEFAULT: ModalityPadrao[] = [
  { code: 'POINTS_86_96', label: 'Aposentadoria por Pontos (Transição)', order: 10 },
  { code: 'TOLL_50', label: 'Transição - Pedágio de 50%', order: 20 },
  { code: 'TOLL_100', label: 'Transição - Pedágio de 100%', order: 30 },
  { code: 'MINIMUM_AGE_65_62', label: 'Idade Mínima Progressiva', order: 40 },
  { code: 'CONTRIBUTION_TIME', label: 'Tempo de Contribuição (Regra Geral)', order: 50 },
  { code: 'RETIREMENT_BY_AGE', label: 'Aposentadoria por Idade', order: 60 },
  { code: 'SPECIAL_RETIREMENT', label: 'Aposentadoria Especial (25 anos)', order: 70 },
  { code: 'HYBRID', label: 'Aposentadoria Híbrida', order: 80 },
  { code: 'SICKNESS_BENEFIT_B31', label: 'Auxílio-Doença Previdenciário', order: 90 },
  { code: 'SICKNESS_BENEFIT_B91', label: 'Auxílio-Doença Acidentário', order: 100 },
  { code: 'MATERNITY_PAY', label: 'Salário-Maternidade', order: 110 },
  { code: 'PRISONER_BENEFIT', label: 'Auxílio-Reclusão', order: 120 },
  { code: 'DEATH_PENSION', label: 'Pensão por Morte', order: 130 },
  { code: 'BPC_LOAS', label: 'BPC/LOAS (Idoso)', order: 140 },
]

async function main() {
  // ─── Usuário Admin Padrão ───────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminName = process.env.ADMIN_NAME ?? 'Administrador'

  if (adminEmail && adminPassword) {
    console.log('🌱 Seeding Admin user...')
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { name: adminName, isAdmin: true, plan: 'ADMIN', planStatus: 'ACTIVE' },
      create: {
        email: adminEmail,
        name: adminName,
        password: passwordHash,
        isAdmin: true,
        plan: 'ADMIN',
        planStatus: 'ACTIVE',
      },
    })
    console.log(`✅ Admin criado/atualizado: ${adminEmail}`)
  } else {
    console.warn('⚠️  ADMIN_EMAIL ou ADMIN_PASSWORD não definidos no .env — pulando seed do admin')
  }

  console.log('🌱 Seeding PlanLimits...')

  const planLimits = [
    {
      plan: 'FREE' as const,
      maxClients: 3,
      maxCalculationsPerMonth: 5,
      maxOpinionsPerMonth: 1,
      maxNotesPerCase: 10,
      simulatorEnabled: false,
      retroactiveEnabled: false,
      exportPdfEnabled: false,
      whatsappEnabled: false,
      watermarkEnabled: true,
      diagnosisEnabled: false,
      bpcEnabled: false,
      bpcAnalysesPerMonth: 0,
      bpcSocialMediaPerMonth: 0,
      peticaoEnabled: false,
      maxPeticoesPerMonth: 0,
      processInterpretEnabled: false,
      maxProcessInterpretPerMonth: 0,
      revisionEnabled: false,
      maxRevisionsPerMonth: 0,
      gpsEnabled: false,
      viabilityScoreEnabled: false,

    },
    {
      plan: 'SOLO' as const,
      maxClients: 30,
      maxCalculationsPerMonth: -1,
      maxOpinionsPerMonth: 20,
      maxNotesPerCase: -1,
      simulatorEnabled: true,
      retroactiveEnabled: true,
      exportPdfEnabled: true,
      whatsappEnabled: true,
      watermarkEnabled: false,
      diagnosisEnabled: true,
      bpcEnabled: true,
      bpcAnalysesPerMonth: 50,
      bpcSocialMediaPerMonth: 5,
      peticaoEnabled: true,
      maxPeticoesPerMonth: 5,
      processInterpretEnabled: true,
      maxProcessInterpretPerMonth: 30,
      revisionEnabled: true,
      maxRevisionsPerMonth: 20,
      gpsEnabled: true,
      viabilityScoreEnabled: true,

    },
    {
      plan: 'PRO' as const,
      maxClients: -1,
      maxCalculationsPerMonth: -1,
      maxOpinionsPerMonth: -1,
      maxNotesPerCase: -1,
      simulatorEnabled: true,
      retroactiveEnabled: true,
      exportPdfEnabled: true,
      whatsappEnabled: true,
      watermarkEnabled: false,
      diagnosisEnabled: true,
      bpcEnabled: true,
      bpcAnalysesPerMonth: -1,
      bpcSocialMediaPerMonth: -1,
      peticaoEnabled: true,
      maxPeticoesPerMonth: -1,
      processInterpretEnabled: true,
      maxProcessInterpretPerMonth: -1,
      revisionEnabled: true,
      maxRevisionsPerMonth: -1,
      gpsEnabled: true,
      viabilityScoreEnabled: true,

    },
    {
      plan: 'PARTNER' as const,
      maxClients: -1,
      maxCalculationsPerMonth: -1,
      maxOpinionsPerMonth: -1,
      maxNotesPerCase: -1,
      simulatorEnabled: true,
      retroactiveEnabled: true,
      exportPdfEnabled: true,
      whatsappEnabled: true,
      watermarkEnabled: false,
      diagnosisEnabled: true,
      bpcEnabled: true,
      bpcAnalysesPerMonth: -1,
      bpcSocialMediaPerMonth: -1,
      peticaoEnabled: true,
      maxPeticoesPerMonth: -1,
      processInterpretEnabled: true,
      maxProcessInterpretPerMonth: -1,
      revisionEnabled: true,
      maxRevisionsPerMonth: -1,
      gpsEnabled: true,
      viabilityScoreEnabled: true,

    },
    {
      plan: 'ADMIN' as const,
      maxClients: -1,
      maxCalculationsPerMonth: -1,
      maxOpinionsPerMonth: -1,
      maxNotesPerCase: -1,
      simulatorEnabled: true,
      retroactiveEnabled: true,
      exportPdfEnabled: true,
      whatsappEnabled: true,
      watermarkEnabled: false,
      diagnosisEnabled: true,
      bpcEnabled: true,
      bpcAnalysesPerMonth: -1,
      bpcSocialMediaPerMonth: -1,
      peticaoEnabled: true,
      maxPeticoesPerMonth: -1,
      processInterpretEnabled: true,
      maxProcessInterpretPerMonth: -1,
      revisionEnabled: true,
      maxRevisionsPerMonth: -1,
      gpsEnabled: true,
      viabilityScoreEnabled: true,

    },
  ]

  for (const { plan, ...limits } of planLimits) {
    await prisma.planLimit.upsert({
      where: { plan },
      update: limits,
      create: { plan, ...limits },
    })
  }

  console.log('✅ PlanLimits seeded successfully')

  // ─── Salários Mínimos Históricos ────────────────────────────────────────────
  console.log('🌱 Seeding MinimumWages...')

  const minimumWages = [
    {
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      value: 1621.0,
      ceiling: 8157.41,
      legislation: 'Decreto 12.797/2025',
      readjustment: 6.79,
    },
    {
      effectiveDate: new Date('2025-01-01T00:00:00.000Z'),
      value: 1518.0,
      ceiling: 7786.02,
      legislation: 'Decreto 12.342/2024',
      readjustment: 7.95,
    },
    {
      effectiveDate: new Date('2024-01-01T00:00:00.000Z'),
      value: 1412.0,
      ceiling: 7786.02,
      legislation: 'Decreto 11.864/2024',
      readjustment: 6.97,
    },
    {
      effectiveDate: new Date('2023-05-01T00:00:00.000Z'),
      value: 1320.0,
      ceiling: 7507.49,
      legislation: 'MP 1.172/2023 (Lei 14.663, de 2023)',
      readjustment: 8.9,
    },
    {
      effectiveDate: new Date('2023-01-01T00:00:00.000Z'),
      value: 1302.0,
      ceiling: 7507.49,
      legislation: 'MP 1.143/2022 (Lei 14.663, de 2023)',
      readjustment: 7.43,
    },
    {
      effectiveDate: new Date('2022-01-01T00:00:00.000Z'),
      value: 1212.0,
      ceiling: 7087.22,
      legislation: 'MP 1091/2021 (Lei 14.358, de 2022)',
      readjustment: 10.16,
    },
    {
      effectiveDate: new Date('2021-01-01T00:00:00.000Z'),
      value: 1100.0,
      ceiling: 6433.57,
      legislation: 'MP 1021/2020 (Lei 14.158, de 2021)',
      readjustment: 5.26,
    },
    {
      effectiveDate: new Date('2020-02-01T00:00:00.000Z'),
      value: 1045.0,
      ceiling: 6101.06,
      legislation: 'MP 919/2020 (Lei 14.013, de 2020)',
      readjustment: 0.58,
    },
    {
      effectiveDate: new Date('2020-01-01T00:00:00.000Z'),
      value: 1039.0,
      ceiling: 6101.06,
      legislation: 'MP 916/2019 (Lei 14.013, de 2020)',
      readjustment: 4.1,
    },
    {
      effectiveDate: new Date('2019-01-01T00:00:00.000Z'),
      value: 998.0,
      ceiling: 5839.45,
      legislation: 'Decreto 9.661/2019',
      readjustment: 4.61,
    },
    {
      effectiveDate: new Date('2018-01-01T00:00:00.000Z'),
      value: 954.0,
      ceiling: 5645.8,
      legislation: 'Decreto 9.255/2017',
      readjustment: 1.81,
    },
    {
      effectiveDate: new Date('2017-01-01T00:00:00.000Z'),
      value: 937.0,
      ceiling: 5531.31,
      legislation: 'Lei 13.152/2015',
      readjustment: 6.48,
    },
    {
      effectiveDate: new Date('2016-01-01T00:00:00.000Z'),
      value: 880.0,
      ceiling: 5189.82,
      legislation: 'Decreto 8.618/2015',
      readjustment: 11.68,
    },
    {
      effectiveDate: new Date('2015-01-01T00:00:00.000Z'),
      value: 788.0,
      ceiling: 4663.75,
      legislation: 'Decreto 8.381/2014',
      readjustment: 8.84,
    },
    {
      effectiveDate: new Date('2014-01-01T00:00:00.000Z'),
      value: 724.0,
      ceiling: 4390.24,
      legislation: 'Decreto 8.166/2013',
      readjustment: 6.78,
    },
    {
      effectiveDate: new Date('2013-01-01T00:00:00.000Z'),
      value: 678.0,
      ceiling: 4159.0,
      legislation: 'Decreto 7.872/2012',
      readjustment: 9.0,
    },
    {
      effectiveDate: new Date('2012-01-01T00:00:00.000Z'),
      value: 622.0,
      ceiling: 3916.2,
      legislation: 'Decreto 7.655/2011',
      readjustment: 14.13,
    },
    {
      effectiveDate: new Date('2011-03-01T00:00:00.000Z'),
      value: 545.0,
      ceiling: 3691.74,
      legislation: 'Lei 12.382/2011',
      readjustment: 0.93,
    },
    {
      effectiveDate: new Date('2011-01-01T00:00:00.000Z'),
      value: 540.0,
      ceiling: 3691.74,
      legislation: 'MP 516/2010 (Lei Nº 12.382, 2011)',
      readjustment: 5.88,
    },
    {
      effectiveDate: new Date('2010-01-01T00:00:00.000Z'),
      value: 510.0,
      ceiling: 3467.4,
      legislation: 'Lei 12.255/2010',
      readjustment: 9.68,
    },
    {
      effectiveDate: new Date('2009-02-01T00:00:00.000Z'),
      value: 465.0,
      ceiling: 3218.9,
      legislation: 'Lei 11.944/2009',
      readjustment: 12.05,
    },
    {
      effectiveDate: new Date('2008-03-01T00:00:00.000Z'),
      value: 415.0,
      ceiling: 3038.99,
      legislation: 'Lei 11.709/2008',
      readjustment: 9.21,
    },
    {
      effectiveDate: new Date('2007-04-01T00:00:00.000Z'),
      value: 380.0,
      ceiling: 2894.28,
      legislation: 'Lei 11.498/2007',
      readjustment: 8.57,
    },
    {
      effectiveDate: new Date('2006-04-01T00:00:00.000Z'),
      value: 350.0,
      ceiling: 2801.82,
      legislation: 'Lei 11.321/2006',
      readjustment: 16.67,
    },
    {
      effectiveDate: new Date('2005-05-01T00:00:00.000Z'),
      value: 300.0,
      ceiling: 2668.15,
      legislation: 'Lei 11.164/2005',
      readjustment: 15.38,
    },
    {
      effectiveDate: new Date('2004-05-01T00:00:00.000Z'),
      value: 260.0,
      ceiling: 2508.72,
      legislation: 'Lei 10.888/2004',
      readjustment: 8.33,
    },
    {
      effectiveDate: new Date('2003-06-01T00:00:00.000Z'),
      value: 240.0,
      ceiling: 1869.34,
      legislation: 'Lei 10.699/2003',
      readjustment: 20.0,
    },
    {
      effectiveDate: new Date('2002-06-01T00:00:00.000Z'),
      value: 200.0,
      ceiling: 1561.56,
      legislation: 'Lei 10.525/2002',
      readjustment: 11.11,
    },
    {
      effectiveDate: new Date('2001-06-01T00:00:00.000Z'),
      value: 180.0,
      ceiling: 1430.0,
      legislation: 'MP 2.194-6/2001',
      readjustment: 19.21,
    },
    {
      effectiveDate: new Date('2000-06-01T00:00:00.000Z'),
      value: 151.0,
      ceiling: 1255.32,
      legislation: 'Lei 9.971/2000',
      readjustment: 11.03,
    },
    {
      effectiveDate: new Date('1999-05-01T00:00:00.000Z'),
      value: 136.0,
      ceiling: 1255.32,
      legislation: 'Lei 9.971/2000',
      readjustment: 4.62,
    },
    {
      effectiveDate: new Date('1998-05-01T00:00:00.000Z'),
      value: 130.0,
      ceiling: 1081.5,
      legislation: 'Lei 9.971/2000',
      readjustment: 8.33,
    },
    {
      effectiveDate: new Date('1997-05-01T00:00:00.000Z'),
      value: 120.0,
      ceiling: 1031.87,
      legislation: 'Lei 9.971/2000',
      readjustment: 7.14,
    },
    {
      effectiveDate: new Date('1996-05-01T00:00:00.000Z'),
      value: 112.0,
      ceiling: 957.87,
      legislation: 'Lei 9.971/2000',
      readjustment: 12.0,
    },
    {
      effectiveDate: new Date('1995-05-01T00:00:00.000Z'),
      value: 100.0,
      ceiling: 957.87,
      legislation: 'Lei 9.032/1995',
      readjustment: 42.86,
    },
    {
      effectiveDate: new Date('1994-09-01T00:00:00.000Z'),
      value: 70.0,
      ceiling: 649.18,
      legislation: 'MP 598/1994',
      readjustment: 8.04,
    },
    {
      effectiveDate: new Date('1994-07-01T00:00:00.000Z'),
      value: 64.79,
      ceiling: 649.18,
      legislation: 'Lei 8.880/1994',
      readjustment: null,
    },
  ]

  for (const s of minimumWages) {
    await prisma.minimumWage.upsert({
      where: { effectiveDate: s.effectiveDate },
      update: {
        value: s.value,
        ceiling: s.ceiling,
        legislation: s.legislation,
        readjustment: s.readjustment,
      },
      create: s,
    })
  }

  console.log(`✅ ${minimumWages.length} registros de MinimumWage inseridos`)

  // ─── Regras de Aposentadoria ────────────────────────────────────────────────
  console.log('🌱 Seeding RetirementRules...')

  // Regra por pontos: pontuação sobe 1 ponto por ano a partir de 2019 (EC 103/2019)
  // Homens: 96 → 105 (máx). Mulheres: 86 → 96 (máx).
  const pontosProgH = [
    { vigencia: '2019-11-13', pontos: 96 },
    { vigencia: '2020-01-01', pontos: 97 },
    { vigencia: '2021-01-01', pontos: 98 },
    { vigencia: '2022-01-01', pontos: 99 },
    { vigencia: '2023-01-01', pontos: 100 },
    { vigencia: '2024-01-01', pontos: 101 },
    { vigencia: '2025-01-01', pontos: 102 },
    { vigencia: '2026-01-01', pontos: 103 },
    { vigencia: '2027-01-01', pontos: 104 },
    { vigencia: '2028-01-01', pontos: 105 },
  ]
  const pontosProgF = [
    { vigencia: '2019-11-13', pontos: 86 },
    { vigencia: '2020-01-01', pontos: 87 },
    { vigencia: '2021-01-01', pontos: 88 },
    { vigencia: '2022-01-01', pontos: 89 },
    { vigencia: '2023-01-01', pontos: 90 },
    { vigencia: '2024-01-01', pontos: 91 },
    { vigencia: '2025-01-01', pontos: 92 },
    { vigencia: '2026-01-01', pontos: 93 },
    { vigencia: '2027-01-01', pontos: 94 },
    { vigencia: '2028-01-01', pontos: 95 },
    { vigencia: '2029-01-01', pontos: 96 },
  ]

  const rules = [
    // ── Regra Permanente / Aposentadoria por Idade ────────────────────────────
    {
      modality: 'MINIMUM_AGE_65_62',
      gender: 'M',
      vigencia: '2019-11-13',
      minimumAge: 65,
      contributionYears: 20,
      gracePeriodMonths: 180,
      description: 'Regra Permanente - Homens',
      legislation: 'EC 103/2019',
    },
    {
      modality: 'MINIMUM_AGE_65_62',
      gender: 'F',
      vigencia: '2019-11-13',
      minimumAge: 62,
      contributionYears: 15,
      gracePeriodMonths: 180,
      description: 'Regra Permanente - Mulheres',
      legislation: 'EC 103/2019',
    },
    {
      modality: 'RETIREMENT_BY_AGE',
      gender: 'M',
      vigencia: '2019-11-13',
      minimumAge: 65,
      contributionYears: 20,
      gracePeriodMonths: 180,
      description: 'Aposentadoria por Idade - Homens',
      legislation: 'EC 103/2019',
    },
    {
      modality: 'RETIREMENT_BY_AGE',
      gender: 'F',
      vigencia: '2019-11-13',
      minimumAge: 62,
      contributionYears: 15,
      gracePeriodMonths: 180,
      description: 'Aposentadoria por Idade - Mulheres',
      legislation: 'EC 103/2019',
    },
    // ── Tempo de Contribuição (pré-reforma) ───────────────────────────────────
    {
      modality: 'CONTRIBUTION_TIME',
      gender: 'M',
      vigencia: '2019-11-13',
      contributionYears: 35,
      gracePeriodMonths: 180,
      description: 'Tempo de Contribuição - Homens',
      legislation: 'EC 103/2019',
    },
    {
      modality: 'CONTRIBUTION_TIME',
      gender: 'F',
      vigencia: '2019-11-13',
      contributionYears: 30,
      gracePeriodMonths: 180,
      description: 'Tempo de Contribuição - Mulheres',
      legislation: 'EC 103/2019',
    },
    // ── Pedágio 50% ───────────────────────────────────────────────────────────
    {
      modality: 'TOLL_50',
      gender: 'M',
      vigencia: '2019-11-13',
      contributionYears: 35,
      gracePeriodMonths: 180,
      description: 'Pedágio 50% - Homens',
      legislation: 'EC 103/2019',
      notes: 'Válido apenas para quem faltava menos de 2 anos em 13/11/2019.',
    },
    {
      modality: 'TOLL_50',
      gender: 'F',
      vigencia: '2019-11-13',
      contributionYears: 30,
      gracePeriodMonths: 180,
      description: 'Pedágio 50% - Mulheres',
      legislation: 'EC 103/2019',
      notes: 'Válido apenas para quem faltava menos de 2 anos em 13/11/2019.',
    },
    // ── Pedágio 100% ──────────────────────────────────────────────────────────
    {
      modality: 'TOLL_100',
      gender: 'M',
      vigencia: '2019-11-13',
      minimumAge: 60,
      contributionYears: 35,
      gracePeriodMonths: 180,
      description: 'Pedágio 100% - Homens',
      legislation: 'EC 103/2019',
    },
    {
      modality: 'TOLL_100',
      gender: 'F',
      vigencia: '2019-11-13',
      minimumAge: 57,
      contributionYears: 30,
      gracePeriodMonths: 180,
      description: 'Pedágio 100% - Mulheres',
      legislation: 'EC 103/2019',
    },
    // ── Aposentadoria Especial ────────────────────────────────────────────────
    {
      modality: 'SPECIAL_RETIREMENT',
      gender: 'AMBOS',
      vigencia: '2019-11-13',
      minimumAge: 60,
      contributionYears: 25,
      description: 'Aposentadoria Especial',
      legislation: 'EC 103/2019',
    },
    // ── Híbrida ───────────────────────────────────────────────────────────────
    {
      modality: 'HYBRID',
      gender: 'M',
      vigencia: '2019-11-13',
      minimumAge: 65,
      contributionYears: 15,
      gracePeriodMonths: 180,
      description: 'Híbrida (Rural/Urbano) - Homens',
      legislation: 'EC 103/2019',
    },
    {
      modality: 'HYBRID',
      gender: 'F',
      vigencia: '2019-11-13',
      minimumAge: 62,
      contributionYears: 15,
      gracePeriodMonths: 180,
      description: 'Híbrida (Rural/Urbano) - Mulheres',
      legislation: 'EC 103/2019',
    },
    // ── BPC/LOAS ──────────────────────────────────────────────────────────────
    {
      modality: 'BPC_LOAS',
      gender: 'AMBOS',
      vigencia: '2019-11-13',
      minimumAge: 65,
      description: 'BPC/LOAS - Idoso',
      legislation: 'Lei 8.742/1993',
    },
    // ── Auxílio-Doença ────────────────────────────────────────────────────────
    {
      modality: 'SICKNESS_BENEFIT_B31',
      gender: 'AMBOS',
      vigencia: '1991-07-24',
      gracePeriodMonths: 12,
      description: 'Auxílio-Doença Previdenciário (B31)',
      legislation: 'Lei 8.213/1991',
    },
    // ── Pensão por Morte ──────────────────────────────────────────────────────
    {
      modality: 'DEATH_PENSION',
      gender: 'AMBOS',
      vigencia: '2019-11-13',
      gracePeriodMonths: 18,
      description: 'Pensão por Morte',
      legislation: 'EC 103/2019',
      notes: 'Menos de 18 contribuições pode reduzir o prazo de pagamento ao cônjuge.',
    },
    // ── Por Pontos (Homens) ───────────────────────────────────────────────────
    ...pontosProgH.map((p) => ({
      modality: 'POINTS_86_96',
      gender: 'M',
      vigencia: p.vigencia,
      minimumPoints: p.pontos,
      contributionYears: 35,
      gracePeriodMonths: 180,
      description: `Por Pontos - Homens (${p.pontos} pts)`,
      legislation: 'EC 103/2019',
    })),
    // ── Por Pontos (Mulheres) ─────────────────────────────────────────────────
    ...pontosProgF.map((p) => ({
      modality: 'POINTS_86_96',
      gender: 'F',
      vigencia: p.vigencia,
      minimumPoints: p.pontos,
      contributionYears: 30,
      gracePeriodMonths: 180,
      description: `Por Pontos - Mulheres (${p.pontos} pts)`,
      legislation: 'EC 103/2019',
    })),
  ]

  for (const r of rules as Array<{
    modality: string
    gender: string
    vigencia: string
    minimumAge?: number
    contributionYears?: number
    minimumPoints?: number
    gracePeriodMonths?: number
    description: string
    legislation: string
    notes?: string
  }>) {
    const effectiveDateVal = new Date(r.vigencia + 'T00:00:00.000Z')
    await prisma.retirementRule.upsert({
      where: {
        modality_gender_effectiveDate: {
          modality: r.modality,
          gender: r.gender,
          effectiveDate: effectiveDateVal,
        },
      },
      update: {
        minimumAge: r.minimumAge,
        contributionYears: r.contributionYears,
        minimumPoints: r.minimumPoints,
        gracePeriodMonths: r.gracePeriodMonths,
        description: r.description,
        legislation: r.legislation,
        notes: r.notes,
      },
      create: {
        modality: r.modality,
        gender: r.gender,
        effectiveDate: effectiveDateVal,
        minimumAge: r.minimumAge,
        contributionYears: r.contributionYears,
        minimumPoints: r.minimumPoints,
        gracePeriodMonths: r.gracePeriodMonths,
        description: r.description,
        legislation: r.legislation,
        notes: r.notes,
      },
    })
  }

  console.log(`✅ ${rules.length} regras de aposentadoria inseridas`)

  // ─── Modalidades de Benefício / Cálculo ────────────────────────────────────
  console.log('🌱 Seeding Modalities...')

  for (const modality of MODALITIES_DEFAULT) {
    await prisma.modalityLabel.upsert({
      where: { code: modality.code },
      update: {
        label: modality.label,
        description: modality.description ?? null,
        order: modality.order,
        active: true,
      },
      create: {
        code: modality.code,
        label: modality.label,
        description: modality.description ?? null,
        order: modality.order,
        active: true,
      },
    })
  }

  console.log(`✅ ${MODALITIES_DEFAULT.length} modalidades inseridas`)

  // ─── Índices INPC Históricos ──────────────────────────────────────────────
  console.log('🌱 Seeding Índices INPC...')

  const indicesINPC = [
    // 2024
    { competence: '2024-01', value: 0.0057 },
    { competence: '2024-02', value: 0.0081 },
    { competence: '2024-03', value: 0.0019 },
    { competence: '2024-04', value: 0.0037 },
    { competence: '2024-05', value: 0.0046 },
    { competence: '2024-06', value: 0.0025 },
    { competence: '2024-07', value: 0.0012 },
    { competence: '2024-08', value: -0.0014 },
    { competence: '2024-09', value: 0.0048 },
    { competence: '2024-10', value: 0.0061 },
    { competence: '2024-11', value: 0.0052 },
    { competence: '2024-12', value: 0.0038 },
    // 2025
    { competence: '2025-01', value: 0.0042 },
    { competence: '2025-02', value: 0.0031 },
    { competence: '2025-03', value: 0.0028 },
    { competence: '2025-04', value: 0.0035 },
    { competence: '2025-05', value: 0.0022 },
    { competence: '2025-06', value: 0.0018 },
    { competence: '2025-07', value: 0.0015 },
    { competence: '2025-08', value: 0.0011 },
    { competence: '2025-09', value: 0.0029 },
    { competence: '2025-10', value: 0.0039 },
    { competence: '2025-11', value: 0.0041 },
    { competence: '2025-12', value: 0.0032 },
    // 2026
    { competence: '2026-01', value: 0.0035 },
    { competence: '2026-02', value: 0.0038 },
    { competence: '2026-03', value: 0.0032 },
    { competence: '2026-04', value: 0.003 },
    { competence: '2026-05', value: 0.0028 },
  ]

  for (const ind of indicesINPC) {
    await prisma.inpcIndex.upsert({
      where: { competence: ind.competence },
      update: { value: ind.value },
      create: ind,
    })
  }

  console.log(`✅ ${indicesINPC.length} registros de InpcIndex inseridos`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
