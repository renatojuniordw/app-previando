export interface ModalidadePadrao {
  codigo: string
  label: string
  descricao?: string
  ordem: number
}

export const MODALIDADES_PADRAO: ModalidadePadrao[] = [
  { codigo: 'PONTOS_86_96',           label: 'Aposentadoria por Pontos (Transição)', ordem: 10 },
  { codigo: 'PEDAGIO_50',             label: 'Transição - Pedágio de 50%',           ordem: 20 },
  { codigo: 'PEDAGIO_100',            label: 'Transição - Pedágio de 100%',          ordem: 30 },
  { codigo: 'IDADE_MINIMA_65_62',     label: 'Idade Mínima Progressiva',             ordem: 40 },
  { codigo: 'TEMPO_CONTRIBUICAO',     label: 'Tempo de Contribuição (Regra Geral)',  ordem: 50 },
  { codigo: 'APOSENTADORIA_IDADE',    label: 'Aposentadoria por Idade',              ordem: 60 },
  { codigo: 'APOSENTADORIA_ESPECIAL', label: 'Aposentadoria Especial (25 anos)',     ordem: 70 },
  { codigo: 'HIBRIDA',                label: 'Aposentadoria Híbrida',                ordem: 80 },
  { codigo: 'AUXILIO_DOENCA_B31',     label: 'Auxílio-Doença Previdenciário',        ordem: 90 },
  { codigo: 'AUXILIO_DOENCA_B91',     label: 'Auxílio-Doença Acidentário',           ordem: 100 },
  { codigo: 'SALARIO_MATERNIDADE',    label: 'Salário-Maternidade',                  ordem: 110 },
  { codigo: 'AUXILIO_RECLUSAO',       label: 'Auxílio-Reclusão',                     ordem: 120 },
  { codigo: 'PENSAO_MORTE',           label: 'Pensão por Morte',                     ordem: 130 },
  { codigo: 'BPC_LOAS',               label: 'BPC/LOAS (Idoso)',                     ordem: 140 },
]

export const MODALIDADE_LABELS: Record<string, string> = Object.fromEntries(
  MODALIDADES_PADRAO.map(({ codigo, label }) => [codigo, label])
)
