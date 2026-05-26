import { prisma } from '@/lib/prisma'
import { calculatePrevidenciario, projectSimulations } from '@/lib/previdencia-engine'
import { calculateRetroativos } from '@/lib/retroativos-engine'
import { getSalarioVigente } from '@/lib/salario-minimo'
import { getRegrasVigentes } from '@/lib/regras-aposentadoria'

interface RunCalculationInput {
  caseId: string
  modalidade: string
  dib: string
  gender: 'M' | 'F'
  tempoEspecialAnos: number
  dependentesPensao: number
}

interface RunSimulationInput {
  caseId: string
  scenarioName: string
  gender: 'M' | 'F'
  dibProjetada: string
  valorContribuicaoFutura: number
  modalidade: string
}

interface RunRetroativoInput {
  caseId: string
  dataInicioDireito: string
  dataRequerimento: string
  valorMensalBruto: number
  valorDescontos?: number
  descricaoDescontos?: string
}

export class PrevidenciaService {
  /**
   * Executa a orquestração segura do cálculo previdenciário no servidor
   * e salva o resultado final no banco de dados.
   */
  static async runAndSaveCalculation(input: RunCalculationInput) {
    const { caseId, modalidade, dib, gender, tempoEspecialAnos, dependentesPensao } = input

    // 1. Busca documento CNIS processado no banco
    const cnisDoc = await prisma.cnisDocument.findUnique({
      where: { caseId },
    })

    if (!cnisDoc) {
      throw new Error('Nenhum documento CNIS processado foi encontrado para este caso.')
    }

    if (cnisDoc.processingStatus !== 'COMPLETED') {
      throw new Error('O extrato do CNIS deste caso ainda está sendo processado ou falhou.')
    }

    const extracted = cnisDoc.extractedData as any
    const birthDate = extracted?.dataNascimento

    if (!birthDate) {
      throw new Error('Data de nascimento do segurado ausente ou não identificada no CNIS.')
    }

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
      salarioMinimo: salarioParam.valor,
      tetoPrevidenciario: salarioParam.teto,
      regrasVigentes,
    })

    // 4. Salva no banco de dados de forma 100% íntegra
    const calculation = await prisma.calculation.create({
      data: {
        caseId,
        modalidade: result.modalidade as any,
        isSelected: false,
        inputParams: {
          birthDate,
          gender,
          dib,
          tempoEspecialAnos,
          dependentesPensao,
          clientName: extracted?.nome ?? 'Segurado',
        },
        salarioBeneficio: result.salarioBeneficio,
        rmi: result.rmi,
        rma: result.rma,
        fatorPrevidenciario: result.fatorPrevidenciario ?? null,
        coeficiente: result.coeficiente ?? null,
        dibPrevista: result.dibPrevista ? new Date(result.dibPrevista) : null,
        carenciaAtendida: result.carenciaAtendida,
        tempoContribuicao: result.tempoContribuicao,
        idadeNaApuracao: result.idadeNaApuracao,
        elegivel: result.elegivel,
        pendencias: result.pendencias,
        memoriaCalculo: result.memoriaCalculo as any,
        periodosSalarios: result.periodosSalarios as any,
      },
    })

    return calculation
  }

  /**
   * Executa a orquestração segura da simulação de planejamento no servidor
   * e salva no banco de dados.
   */
  static async runAndSaveSimulation(input: RunSimulationInput) {
    const { caseId, scenarioName, gender, dibProjetada, valorContribuicaoFutura, modalidade } = input

    // 1. Busca documento CNIS processado no banco
    const cnisDoc = await prisma.cnisDocument.findUnique({
      where: { caseId },
    })

    if (!cnisDoc) {
      throw new Error('Nenhum documento CNIS processado foi encontrado para este caso.')
    }

    if (cnisDoc.processingStatus !== 'COMPLETED') {
      throw new Error('O extrato do CNIS deste caso ainda está sendo processado ou falhou.')
    }

    const extracted = cnisDoc.extractedData as any
    const birthDate = extracted?.dataNascimento

    if (!birthDate) {
      throw new Error('Data de nascimento do segurado ausente ou não identificada no CNIS.')
    }

    // 2. Busca parâmetros legais na DIB projetada (e hoje para comparação)
    const hojeStr = new Date().toISOString().slice(0, 10)
    const [salarioVigente, regrasVigentes] = await Promise.all([
      getSalarioVigente(hojeStr),
      getRegrasVigentes(hojeStr),
    ])

    // 3. Executa a projeção previdenciária (Pure Domain Logic)
    const result = projectSimulations({
      birthDate,
      gender,
      dibProjetada,
      valorContribuicaoFutura,
      extractedData: extracted,
      modalidade,
      salarioMinimo: salarioVigente.valor,
      tetoPrevidenciario: salarioVigente.teto,
      regrasVigentes,
    })

    // 4. Salva a simulação no banco
    const simulation = await prisma.simulation.create({
      data: {
        caseId,
        scenarioName,
        scenarioParams: result.scenarioParams as any,
        rmiProjected: result.rmiProjected,
        rmaProjected: result.rmaProjected,
        dibProjected: new Date(result.dibProjected),
        gainVsNow: result.gainVsNow,
      },
    })

    return simulation
  }

  /**
   * Executa a orquestração e cálculo seguro de parcelas vencidas retroativas no servidor
   * e salva no banco de dados.
   */
  static async runAndSaveRetroativo(input: RunRetroativoInput) {
    const { caseId, dataInicioDireito, dataRequerimento, valorMensalBruto, valorDescontos = 0, descricaoDescontos } = input

    // 1. Busca todos os índices INPC históricos parametrizados no banco
    const dbIndices = await prisma.indiceINPC.findMany()
    
    if (dbIndices.length === 0) {
      throw new Error(
        'Nenhum índice do INPC foi encontrado no banco de dados. ' +
        'Por favor, certifique-se de que o seed do banco de dados (npx prisma db seed) foi executado com sucesso.'
      )
    }

    const indicesINPC: Record<string, number> = {}
    for (const ind of dbIndices) {
      indicesINPC[ind.competencia] = Number(ind.valor)
    }

    // 2. Executa o cálculo de parcelas atrasadas e atualização monetária pelo INPC carregado do banco
    const result = calculateRetroativos({
      dataInicioDireito,
      dataRequerimento,
      valorMensalBruto,
      valorDescontos,
      descricaoDescontos,
      indicesINPC,
    })

    // 3. Salva o retroativo no banco de dados de forma 100% íntegra
    const retroativo = await prisma.retroativo.create({
      data: {
        caseId,
        dataInicioDireito: new Date(result.dataInicioDireito),
        dataRequerimento: new Date(result.dataRequerimento),
        mesesAtraso: result.mesesAtraso,
        valorMensalBruto: result.valorMensalBruto,
        valorTotalBruto: result.valorTotalBruto,
        valorTotalCorrigido: result.valorTotalCorrigido,
        indiceCorrecao: result.indiceCorrecao,
        valorDescontos: result.valorDescontos,
        descricaoDescontos: result.descricaoDescontos ?? null,
        valorLiquidoFinal: result.valorLiquidoFinal,
        memoriaCalculo: result.memoriaCalculo as any,
      },
    })

    return retroativo
  }
}


