import { PrismaClient } from '@prisma/client'
import { MODALIDADES_PADRAO } from '../src/lib/modalidade-labels'

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

  // ─── Regras de Aposentadoria ────────────────────────────────────────────────
  console.log('🌱 Seeding RegrasAposentadoria...')

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

  const regras = [
    // ── Regra Permanente / Aposentadoria por Idade ────────────────────────────
    { modalidade: 'IDADE_MINIMA_65_62', genero: 'M', vigencia: '2019-11-13', idadeMinima: 65, tempoContribuicaoAnos: 20, carenciaMeses: 180, descricao: 'Regra Permanente - Homens', legislacao: 'EC 103/2019' },
    { modalidade: 'IDADE_MINIMA_65_62', genero: 'F', vigencia: '2019-11-13', idadeMinima: 62, tempoContribuicaoAnos: 15, carenciaMeses: 180, descricao: 'Regra Permanente - Mulheres', legislacao: 'EC 103/2019' },
    { modalidade: 'APOSENTADORIA_IDADE', genero: 'M', vigencia: '2019-11-13', idadeMinima: 65, tempoContribuicaoAnos: 20, carenciaMeses: 180, descricao: 'Aposentadoria por Idade - Homens', legislacao: 'EC 103/2019' },
    { modalidade: 'APOSENTADORIA_IDADE', genero: 'F', vigencia: '2019-11-13', idadeMinima: 62, tempoContribuicaoAnos: 15, carenciaMeses: 180, descricao: 'Aposentadoria por Idade - Mulheres', legislacao: 'EC 103/2019' },
    // ── Tempo de Contribuição (pré-reforma) ───────────────────────────────────
    { modalidade: 'TEMPO_CONTRIBUICAO', genero: 'M', vigencia: '2019-11-13', tempoContribuicaoAnos: 35, carenciaMeses: 180, descricao: 'Tempo de Contribuição - Homens', legislacao: 'EC 103/2019' },
    { modalidade: 'TEMPO_CONTRIBUICAO', genero: 'F', vigencia: '2019-11-13', tempoContribuicaoAnos: 30, carenciaMeses: 180, descricao: 'Tempo de Contribuição - Mulheres', legislacao: 'EC 103/2019' },
    // ── Pedágio 50% ───────────────────────────────────────────────────────────
    { modalidade: 'PEDAGIO_50', genero: 'M', vigencia: '2019-11-13', tempoContribuicaoAnos: 35, carenciaMeses: 180, descricao: 'Pedágio 50% - Homens', legislacao: 'EC 103/2019', observacoes: 'Válido apenas para quem faltava menos de 2 anos em 13/11/2019.' },
    { modalidade: 'PEDAGIO_50', genero: 'F', vigencia: '2019-11-13', tempoContribuicaoAnos: 30, carenciaMeses: 180, descricao: 'Pedágio 50% - Mulheres', legislacao: 'EC 103/2019', observacoes: 'Válido apenas para quem faltava menos de 2 anos em 13/11/2019.' },
    // ── Pedágio 100% ──────────────────────────────────────────────────────────
    { modalidade: 'PEDAGIO_100', genero: 'M', vigencia: '2019-11-13', idadeMinima: 60, tempoContribuicaoAnos: 35, carenciaMeses: 180, descricao: 'Pedágio 100% - Homens', legislacao: 'EC 103/2019' },
    { modalidade: 'PEDAGIO_100', genero: 'F', vigencia: '2019-11-13', idadeMinima: 57, tempoContribuicaoAnos: 30, carenciaMeses: 180, descricao: 'Pedágio 100% - Mulheres', legislacao: 'EC 103/2019' },
    // ── Aposentadoria Especial ────────────────────────────────────────────────
    { modalidade: 'APOSENTADORIA_ESPECIAL', genero: 'AMBOS', vigencia: '2019-11-13', idadeMinima: 60, tempoContribuicaoAnos: 25, descricao: 'Aposentadoria Especial', legislacao: 'EC 103/2019' },
    // ── Híbrida ───────────────────────────────────────────────────────────────
    { modalidade: 'HIBRIDA', genero: 'M', vigencia: '2019-11-13', idadeMinima: 65, tempoContribuicaoAnos: 15, carenciaMeses: 180, descricao: 'Híbrida (Rural/Urbano) - Homens', legislacao: 'EC 103/2019' },
    { modalidade: 'HIBRIDA', genero: 'F', vigencia: '2019-11-13', idadeMinima: 62, tempoContribuicaoAnos: 15, carenciaMeses: 180, descricao: 'Híbrida (Rural/Urbano) - Mulheres', legislacao: 'EC 103/2019' },
    // ── BPC/LOAS ──────────────────────────────────────────────────────────────
    { modalidade: 'BPC_LOAS', genero: 'AMBOS', vigencia: '2019-11-13', idadeMinima: 65, descricao: 'BPC/LOAS - Idoso', legislacao: 'Lei 8.742/1993' },
    // ── Auxílio-Doença ────────────────────────────────────────────────────────
    { modalidade: 'AUXILIO_DOENCA_B31', genero: 'AMBOS', vigencia: '1991-07-24', carenciaMeses: 12, descricao: 'Auxílio-Doença Previdenciário (B31)', legislacao: 'Lei 8.213/1991' },
    // ── Pensão por Morte ──────────────────────────────────────────────────────
    { modalidade: 'PENSAO_MORTE', genero: 'AMBOS', vigencia: '2019-11-13', carenciaMeses: 18, descricao: 'Pensão por Morte', legislacao: 'EC 103/2019', observacoes: 'Menos de 18 contribuições pode reduzir o prazo de pagamento ao cônjuge.' },
    // ── Por Pontos (Homens) ───────────────────────────────────────────────────
    ...pontosProgH.map(p => ({
      modalidade: 'PONTOS_86_96',
      genero: 'M',
      vigencia: p.vigencia,
      pontosMinimos: p.pontos,
      tempoContribuicaoAnos: 35,
      carenciaMeses: 180,
      descricao: `Por Pontos - Homens (${p.pontos} pts)`,
      legislacao: 'EC 103/2019',
    })),
    // ── Por Pontos (Mulheres) ─────────────────────────────────────────────────
    ...pontosProgF.map(p => ({
      modalidade: 'PONTOS_86_96',
      genero: 'F',
      vigencia: p.vigencia,
      pontosMinimos: p.pontos,
      tempoContribuicaoAnos: 30,
      carenciaMeses: 180,
      descricao: `Por Pontos - Mulheres (${p.pontos} pts)`,
      legislacao: 'EC 103/2019',
    })),
  ]

  for (const r of regras) {
    const vigenciaDate = new Date(r.vigencia + 'T00:00:00.000Z')
    await prisma.regraAposentadoria.upsert({
      where: { modalidade_genero_vigencia: { modalidade: r.modalidade, genero: r.genero, vigencia: vigenciaDate } },
      update: { ...r, vigencia: vigenciaDate },
      create: { ...r, vigencia: vigenciaDate },
    })
  }

  console.log(`✅ ${regras.length} regras de aposentadoria inseridas`)

  // ─── Modalidades de Benefício / Cálculo ────────────────────────────────────
  console.log('🌱 Seeding Modalidades...')

  for (const modalidade of MODALIDADES_PADRAO) {
    await prisma.modalidadeLabel.upsert({
      where: { codigo: modalidade.codigo },
      update: {
        label: modalidade.label,
        descricao: modalidade.descricao ?? null,
        ordem: modalidade.ordem,
        ativo: true,
      },
      create: {
        codigo: modalidade.codigo,
        label: modalidade.label,
        descricao: modalidade.descricao ?? null,
        ordem: modalidade.ordem,
        ativo: true,
      },
    })
  }

  console.log(`✅ ${MODALIDADES_PADRAO.length} modalidades inseridas`)

  // ─── Índices INPC Históricos ──────────────────────────────────────────────
  console.log('🌱 Seeding Índices INPC...')

  const indicesINPC = [
    // 2024
    { competencia: '2024-01', valor: 0.0057 }, { competencia: '2024-02', valor: 0.0081 },
    { competencia: '2024-03', valor: 0.0019 }, { competencia: '2024-04', valor: 0.0037 },
    { competencia: '2024-05', valor: 0.0046 }, { competencia: '2024-06', valor: 0.0025 },
    { competencia: '2024-07', valor: 0.0012 }, { competencia: '2024-08', valor: -0.0014 },
    { competencia: '2024-09', valor: 0.0048 }, { competencia: '2024-10', valor: 0.0061 },
    { competencia: '2024-11', valor: 0.0052 }, { competencia: '2024-12', valor: 0.0038 },
    // 2025
    { competencia: '2025-01', valor: 0.0042 }, { competencia: '2025-02', valor: 0.0031 },
    { competencia: '2025-03', valor: 0.0028 }, { competencia: '2025-04', valor: 0.0035 },
    { competencia: '2025-05', valor: 0.0022 }, { competencia: '2025-06', valor: 0.0018 },
    { competencia: '2025-07', valor: 0.0015 }, { competencia: '2025-08', valor: 0.0011 },
    { competencia: '2025-09', valor: 0.0029 }, { competencia: '2025-10', valor: 0.0039 },
    { competencia: '2025-11', valor: 0.0041 }, { competencia: '2025-12', valor: 0.0032 },
    // 2026
    { competencia: '2026-01', valor: 0.0035 }, { competencia: '2026-02', valor: 0.0038 },
    { competencia: '2026-03', valor: 0.0032 }, { competencia: '2026-04', valor: 0.0030 },
    { competencia: '2026-05', valor: 0.0028 },
  ]

  for (const ind of indicesINPC) {
    await prisma.indiceINPC.upsert({
      where: { competencia: ind.competencia },
      update: { valor: ind.valor },
      create: ind,
    })
  }

  console.log(`✅ ${indicesINPC.length} registros de IndiceINPC inseridos`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
