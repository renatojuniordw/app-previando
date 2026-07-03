export interface ModalidadePadrao {
  codigo: string
  label: string
  descricao?: string
  ordem: number
}

export const MODALIDADES_PADRAO: ModalidadePadrao[] = [
  { codigo: 'PONTOS_86_96', label: 'Aposentadoria por Pontos (Transição)', ordem: 10 },
  { codigo: 'PEDAGIO_50', label: 'Transição - Pedágio de 50%', ordem: 20 },
  { codigo: 'PEDAGIO_100', label: 'Transição - Pedágio de 100%', ordem: 30 },
  { codigo: 'IDADE_MINIMA_65_62', label: 'Idade Mínima Progressiva', ordem: 40 },
  { codigo: 'TEMPO_CONTRIBUICAO', label: 'Tempo de Contribuição (Regra Geral)', ordem: 50 },
  { codigo: 'APOSENTADORIA_IDADE', label: 'Aposentadoria por Idade', ordem: 60 },
  { codigo: 'APOSENTADORIA_ESPECIAL', label: 'Aposentadoria Especial (25 anos)', ordem: 70 },
  { codigo: 'HIBRIDA', label: 'Aposentadoria Híbrida', ordem: 80 },
  { codigo: 'AUXILIO_DOENCA_B31', label: 'Auxílio-Doença Previdenciário', ordem: 90 },
  { codigo: 'AUXILIO_DOENCA_B91', label: 'Auxílio-Doença Acidentário', ordem: 100 },
  { codigo: 'SALARIO_MATERNIDADE', label: 'Salário-Maternidade', ordem: 110 },
  { codigo: 'AUXILIO_RECLUSAO', label: 'Auxílio-Reclusão', ordem: 120 },
  { codigo: 'PENSAO_MORTE', label: 'Pensão por Morte', ordem: 130 },
  { codigo: 'BPC_LOAS', label: 'BPC/LOAS (Idoso)', ordem: 140 },
]

const CODE_MAP: Record<string, string> = {
  RETIREMENT_BY_AGE: 'APOSENTADORIA_IDADE',
  MINIMUM_AGE_65_62: 'IDADE_MINIMA_65_62',
  CONTRIBUTION_TIME: 'TEMPO_CONTRIBUICAO',
  POINTS_86_96: 'PONTOS_86_96',
  TOLL_50: 'PEDAGIO_50',
  TOLL_100: 'PEDAGIO_100',
  SPECIAL_RETIREMENT: 'APOSENTADORIA_ESPECIAL',
  HYBRID: 'HIBRIDA',
  SICKNESS_BENEFIT_B31: 'AUXILIO_DOENCA_B31',
  SICKNESS_BENEFIT_B91: 'AUXILIO_DOENCA_B91',
  MATERNITY_PAY: 'SALARIO_MATERNIDADE',
  PRISONER_BENEFIT: 'AUXILIO_RECLUSAO',
  DEATH_PENSION: 'PENSAO_MORTE',
  BPC_LOAS: 'BPC_LOAS',
}

export function mapToPortugueseCode(code: string): string {
  return CODE_MAP[code] || code
}

export function getModalityLabel(code: string): string {
  const mapped = mapToPortugueseCode(code)
  return MODALIDADES_PADRAO.find((m) => m.codigo === mapped)?.label || code
}
