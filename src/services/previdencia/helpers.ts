import { prisma } from '@/lib/prisma'
import { CnisExtractedData } from '@/lib/previdencia-engine'

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
