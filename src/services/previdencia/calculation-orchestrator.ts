import { prisma } from '@/lib/prisma'
import { calculatePrevidenciario } from '@/lib/previdencia-engine'
import { getSalarioVigente } from '@/lib/salario-minimo'
import { getRegrasVigentes } from '@/lib/regras-aposentadoria'
import { resolveBirthDateForCalculation } from './helpers'
import { mapModalidadeToDb } from '@/lib/mappers'
import type { Prisma } from '@prisma/client'

export interface RunCalculationInput {
  caseId: string
  modalidade: string
  dib: string
  gender: 'M' | 'F'
  tempoEspecialAnos: number
  dependentesPensao: number
  disabilityDegree?: 'LEVE' | 'MODERADO' | 'GRAVE'
}

/**
 * Orquestrador responsável pela execução e persistência de Cálculos de Elegibilidade e RMI.
 * Aplica o Princípio da Responsabilidade Única (SRP) isolando o fluxo de concessão de aposentadorias.
 */
export class CalculationOrchestrator {
  /**
   * Executa a orquestração segura do cálculo previdenciário no servidor
   * e salva o resultado final no banco de dados.
   */
  static async run(input: RunCalculationInput) {
    const { caseId, modalidade, dib, gender, tempoEspecialAnos, dependentesPensao, disabilityDegree } = input

    // 1. Busca e valida o documento CNIS (ou, para BPC/LOAS, a data de nascimento do cliente)
    const { extracted, birthDate } = await resolveBirthDateForCalculation(caseId, modalidade)

    // 2. Busca alíquotas de salário mínimo, teto previdenciário e regras de elegibilidade na DIB
    const [salarioParam, regrasVigentes] = await Promise.all([
      getSalarioVigente(dib),
      getRegrasVigentes(dib),
    ])

    // 3. Executa o motor previdenciário (Pure Domain Logic)
    const result = calculatePrevidenciario({
      birthDate,
      gender,
      dib,
      modalidade,
      extractedData: extracted,
      tempoEspecialAnos,
      dependentesPensao,
      disabilityDegree,
      salarioMinimo: salarioParam.valor,
      tetoPrevidenciario: salarioParam.teto,
      regrasVigentes,
    })

    // 4. Salva no banco de dados — tipagem segura via Prisma.InputJsonValue
    const calculation = await prisma.calculation.create({
      data: {
        caseId,
        modality: mapModalidadeToDb(result.modalidade),
        isSelected: false,
        inputParams: {
          birthDate,
          gender,
          dib,
          tempoEspecialAnos,
          dependentesPensao,
          disabilityDegree: disabilityDegree ?? null,
          clientName: extracted?.nome ?? 'Segurado',
        } satisfies Prisma.InputJsonValue,
        benefitSalary: result.salarioBeneficio,
        rmi: result.rmi,
        rma: result.rma,
        socialSecurityFactor: result.fatorPrevidenciario ?? null,
        coefficient: result.coeficiente ?? null,
        expectedDib: result.dibPrevista ? new Date(result.dibPrevista) : null,
        gracePeriodMet: result.carenciaAtendida,
        contributionTime: result.tempoContribuicao,
        ageAtCalculation: result.idadeNaApuracao,
        eligible: result.elegivel,
        pendingIssues: result.pendencias,
        calculationMemory: result.memoriaCalculo as Prisma.InputJsonValue,
        salaryPeriods: result.periodosSalarios as Prisma.InputJsonValue,
      },
    })

    return calculation
  }
}
