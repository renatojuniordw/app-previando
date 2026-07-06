/**
 * Service de Revisão de Benefícios
 * Orquestra o fluxo: busca dados → executa engine → persiste resultado → loga auditoria
 */

import { prisma } from '@/lib/prisma'
import { calcularRevisao } from '@/lib/revision-engine'
import { getSalarioVigente } from '@/lib/salario-minimo'
import { logAudit } from '@/lib/audit'
import type { RevisionInput, RevisionResult } from '@/lib/strategies/revision-types'

export interface RunRevisionInput {
  caseId: string
  userId: string
  tipoRevisao: RevisionInput['tipoRevisao']
  rmiConcedido: number
  dibConcedido: string
}

export async function runAndSaveRevision(input: RunRevisionInput): Promise<RevisionResult> {
  const { caseId, userId, tipoRevisao, rmiConcedido, dibConcedido } = input

  // Busca dados do caso, cliente e CNIS
  const caso = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      client: { select: { birthDate: true, cnisDocument: { select: { extractedData: true } } } },
    },
  })

  if (!caso?.client?.birthDate) {
    throw new Error('Dados do cliente incompletos. Certifique-se de que o cliente possui data de nascimento.')
  }

  // Busca parâmetros legais vigentes na DIB
  const { valor: salarioMinimo, teto } = await getSalarioVigente(dibConcedido)

  // Executa o cálculo
  const result = calcularRevisao({
    tipoRevisao,
    rmiConcedido,
    dibConcedido,
    birthDate: caso.client.birthDate.toISOString().slice(0, 10),
    gender: 'M',
    extractedData: (caso.client.cnisDocument?.extractedData ?? null) as Parameters<typeof calcularRevisao>[0]['extractedData'],
    salarioMinimo,
    tetoPrevidenciario: teto,
  })

  // Persiste o resultado
  const revision = await prisma.revision.create({
    data: {
      caseId,
      tipoRevisao,
      rmiConcedido,
      rmiRevisado: result.rmiRevisado,
      diferencaMensal: result.diferencaMensal,
      diferencaPercentual: result.diferencaPercentual,
      retroativos5Anos: result.retroativos5Anos,
      elegivel: result.elegivel,
      pendencias: result.pendencias,
    },
  })

  // Audit logging
  await logAudit({
    userId,
    action: 'CREATE_REVISION',
    resource: `case:${caseId}/revision:${revision.id}`,
    metadata: { tipoRevisao, rmiConcedido, rmiRevisado: result.rmiRevisado },
  })

  return result
}
