/**
 * Motor de Cálculo de GPS/DAS — Guias de Contribuição Previdenciária
 *
 * Suporta: Contribuinte Individual, Facultativo, MEI, Segurado Especial
 */

import { FALLBACK_INPC_MENSAL as FALLBACK } from '@/lib/previdenciario-constants'

// ─── Tipos ───────────────────────────────────────────────────────────────

export type CategoriaContribuinte =
  | 'CI'              // Contribuinte Individual
  | 'FACULTATIVO'     // Facultativo
  | 'MEI'             // MEI
  | 'SEGURADO_ESPECIAL'

export type PlanoContribuicao = 'NORMAL' | 'SIMPLIFICADO' | 'BAIXA_RENDA'

export interface GpsInput {
  categoria: CategoriaContribuinte
  plano: PlanoContribuicao
  salarioContribuicao: number
  competencia: string // "YYYY-MM"
  salarioMinimo: number
  tetoPrevidenciario: number
}

export interface GpsResult {
  categoria: CategoriaContribuinte
  plano: PlanoContribuicao
  salarioContribuicao: number
  aliquota: number
  valorCalculado: number
  codigoPagamento: string
  competencia: string
  descricao: string
}

// ─── Alíquotas ───────────────────────────────────────────────────────────

interface AliquotaConfig {
  aliquota: number
  codigo: string
  descricao: string
}

const ALIQUOTAS: Record<CategoriaContribuinte, Record<PlanoContribuicao, AliquotaConfig>> = {
  CI: {
    NORMAL: { aliquota: 0.20, codigo: '1406', descricao: 'Contribuinte Individual — Plano Normal (20%)' },
    SIMPLIFICADO: { aliquota: 0.11, codigo: '1163', descricao: 'Contribuinte Individual — Plano Simplificado (11%)' },
    BAIXA_RENDA: { aliquota: 0.05, codigo: '1473', descricao: 'Contribuinte Individual — Baixa Renda (5%)' },
  },
  FACULTATIVO: {
    NORMAL: { aliquota: 0.20, codigo: '1473', descricao: 'Facultativo — Plano Normal (20%)' },
    SIMPLIFICADO: { aliquota: 0.20, codigo: '1473', descricao: 'Facultativo — Plano Normal (20%)' },
    BAIXA_RENDA: { aliquota: 0.05, codigo: '1310', descricao: 'Facultativo — Baixa Renda (5%)' },
  },
  MEI: {
    NORMAL: { aliquota: 0.05, codigo: '1609', descricao: 'MEI — Contribuição Simplificada (5% do SM)' },
    SIMPLIFICADO: { aliquota: 0.05, codigo: '1609', descricao: 'MEI — Contribuição Simplificada (5% do SM)' },
    BAIXA_RENDA: { aliquota: 0.05, codigo: '1609', descricao: 'MEI — Contribuição Simplificada (5% do SM)' },
  },
  SEGURADO_ESPECIAL: {
    NORMAL: { aliquota: 0.023, codigo: '1631', descricao: 'Segurado Especial — Comercialização (2,3%)' },
    SIMPLIFICADO: { aliquota: 0.023, codigo: '1631', descricao: 'Segurado Especial — Comercialização (2,3%)' },
    BAIXA_RENDA: { aliquota: 0.023, codigo: '1631', descricao: 'Segurado Especial — Comercialização (2,3%)' },
  },
}

// ─── Engine ──────────────────────────────────────────────────────────────

export function calcularContribuicao(input: GpsInput): GpsResult {
  const { categoria, plano, competencia, salarioMinimo, tetoPrevidenciario } = input
  const config = ALIQUOTAS[categoria][plano]

  // Para MEI, o salário de contribuição é sempre 1 salário mínimo
  const salarioContribuicao = categoria === 'MEI'
    ? salarioMinimo
    : Math.max(salarioMinimo, Math.min(input.salarioContribuicao || salarioMinimo, tetoPrevidenciario))

  const valorCalculado = Number((salarioContribuicao * config.aliquota).toFixed(2))

  return {
    categoria,
    plano,
    salarioContribuicao,
    aliquota: config.aliquota,
    valorCalculado,
    codigoPagamento: config.codigo,
    competencia,
    descricao: config.descricao,
  }
}

export function getAliquotasDisponiveis(categoria: CategoriaContribuinte): Array<{
  plano: PlanoContribuicao
  aliquota: number
  codigo: string
  descricao: string
}> {
  const configs = ALIQUOTAS[categoria]
  return (Object.keys(configs) as PlanoContribuicao[]).map((plano) => ({
    plano,
    ...configs[plano],
  }))
}

export function getCategorias(): Array<{
  categoria: CategoriaContribuinte
  label: string
  descricao: string
}> {
  return [
    { categoria: 'CI', label: 'Contribuinte Individual', descricao: 'Autônomos, empresários, profissionais liberais.' },
    { categoria: 'FACULTATIVO', label: 'Facultativo', descricao: 'Estudantes, donas de casa, desempregados.' },
    { categoria: 'MEI', label: 'MEI', descricao: 'Microempreendedor Individual (5% do SM).' },
    { categoria: 'SEGURADO_ESPECIAL', label: 'Segurado Especial', descricao: 'Trabalhador rural, pescador artesanal.' },
  ]
}
