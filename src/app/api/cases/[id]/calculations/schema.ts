import { z } from 'zod'

export const runCalculationSchema = z.object({
  modalidade: z.enum([
    'PONTOS_86_96', 'PEDAGIO_50', 'PEDAGIO_100', 'IDADE_MINIMA_65_62',
    'TEMPO_CONTRIBUICAO', 'APOSENTADORIA_IDADE', 'APOSENTADORIA_ESPECIAL',
    'HIBRIDA', 'AUXILIO_DOENCA_B31', 'AUXILIO_DOENCA_B91',
    'SALARIO_MATERNIDADE', 'AUXILIO_RECLUSAO', 'PENSAO_MORTE', 'BPC_LOAS',
  ]),
  dib: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido. Deve ser YYYY-MM-DD.'),
  gender: z.enum(['M', 'F']),
  tempoEspecialAnos: z.number().nonnegative().default(0),
  dependentesPensao: z.number().int().positive().default(1),
}).strict() // Garante rejeição total se tentarem enviar propriedades extras como RMI
