import { prisma } from '@/lib/prisma'
import type { CnisExtractedData } from '@/services/cnis/types'

/**
 * Busca o documento CNIS associado ao caso e valida se o processamento foi concluído com sucesso.
 * Extrai e valida a presença da data de nascimento do segurado.
 * 
 * @param caseId Identificador único do caso
 * @returns Um objeto contendo os dados extraídos do CNIS e a data de nascimento validada
 */
export async function findAndValidateCnis(caseId: string) {
  const cnisDoc = await prisma.cnisDocument.findUnique({
    where: { caseId },
  })

  if (!cnisDoc) {
    throw new Error('Nenhum documento CNIS processado foi encontrado para este caso.')
  }

  if (cnisDoc.processingStatus !== 'COMPLETED') {
    throw new Error('O extrato do CNIS deste caso ainda está sendo processado ou falhou.')
  }

  const extracted = cnisDoc.extractedData as unknown as CnisExtractedData
  const birthDate = extracted?.dataNascimento as string | undefined

  if (!birthDate) {
    throw new Error('Data de nascimento do segurado ausente ou não identificada no CNIS.')
  }

  return {
    extracted,
    birthDate,
  }
}

/**
 * Resolve a data de nascimento e os dados extraídos do CNIS a serem usados no cálculo.
 *
 * Para modalidades contributivas, o CNIS processado é obrigatório (delega para findAndValidateCnis).
 * Para BPC/LOAS — benefício assistencial que não depende de tempo de contribuição —
 * o CNIS é opcional: se existir e estiver processado ele é aproveitado, caso contrário
 * a data de nascimento é obtida do cadastro do cliente.
 */
export async function resolveBirthDateForCalculation(caseId: string, modalidade: string) {
  if (modalidade !== 'BPC_LOAS') {
    return findAndValidateCnis(caseId)
  }

  const cnisDoc = await prisma.cnisDocument.findUnique({
    where: { caseId },
  })

  const extracted = cnisDoc?.processingStatus === 'COMPLETED'
    ? (cnisDoc.extractedData as unknown as CnisExtractedData)
    : null

  const birthDateFromCnis = extracted?.dataNascimento as string | undefined
  if (birthDateFromCnis) {
    return { extracted, birthDate: birthDateFromCnis }
  }

  const clientCase = await prisma.case.findUnique({
    where: { id: caseId },
    select: { client: { select: { birthDate: true } } },
  })

  if (!clientCase?.client?.birthDate) {
    throw new Error('Data de nascimento do segurado não encontrada. Cadastre a data de nascimento do cliente ou envie o CNIS.')
  }

  return {
    extracted,
    birthDate: clientCase.client.birthDate.toISOString().slice(0, 10),
  }
}
