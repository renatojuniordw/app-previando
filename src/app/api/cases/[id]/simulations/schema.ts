import { z } from 'zod'

export const runSimulationSchema = z.object({
  scenarioName: z.string().min(1, 'Nome do cenário é obrigatório.').max(200, 'Nome do cenário muito longo.'),
  gender: z.enum(['M', 'F']),
  dibProjetada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido. Deve ser YYYY-MM-DD.'),
  valorContribuicaoFutura: z.number().positive('O valor de contribuição futura deve ser positivo.'),
  modalidade: z.enum([
    'PONTOS_86_96', 'PEDAGIO_50', 'PEDAGIO_100', 'IDADE_MINIMA_65_62',
    'TEMPO_CONTRIBUICAO', 'APOSENTADORIA_IDADE', 'APOSENTADORIA_ESPECIAL',
    'HIBRIDA', 'AUXILIO_DOENCA_B31', 'AUXILIO_DOENCA_B91',
    'SALARIO_MATERNIDADE', 'AUXILIO_RECLUSAO', 'PENSAO_MORTE', 'BPC_LOAS',
  ]),
  tempoEspecialAnos: z.number().nonnegative().optional().default(0),
}).strict() // Rejeita qualquer tentativa de injetar valores pré-calculados de RMI/rma/gainVsNow
