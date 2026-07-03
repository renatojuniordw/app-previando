import { CaseStatus as DbCaseStatus, BenefitType as DbBenefitType, NoteType as DbNoteType, CalculationModality } from '@prisma/client'

export type ApiCaseStatus = 'PROSPECCAO' | 'ANALISE' | 'PRONTO_PARA_REQUERER' | 'EM_PROCESSAMENTO' | 'FINALIZADO'

export type ApiBenefitType =
  | 'APOSENTADORIA_IDADE'
  | 'APOSENTADORIA_TEMPO_CONTRIBUICAO'
  | 'APOSENTADORIA_ESPECIAL'
  | 'APOSENTADORIA_HIBRIDA'
  | 'APOSENTADORIA_PONTOS'
  | 'AUXILIO_DOENCA'
  | 'AUXILIO_ACIDENTE'
  | 'SALARIO_MATERNIDADE'
  | 'AUXILIO_RECLUSAO'
  | 'PENSAO_POR_MORTE'
  | 'BPC_LOAS'
  | 'REVISAO_BENEFICIO'

const modalityToDbMap: Record<string, CalculationModality> = {
  APOSENTADORIA_IDADE: CalculationModality.RETIREMENT_BY_AGE,
  IDADE_MINIMA_65_62: CalculationModality.MINIMUM_AGE_65_62,
  TEMPO_CONTRIBUICAO: CalculationModality.CONTRIBUTION_TIME,
  PONTOS_86_96: CalculationModality.POINTS_86_96,
  PEDAGIO_50: CalculationModality.TOLL_50,
  PEDAGIO_100: CalculationModality.TOLL_100,
  APOSENTADORIA_ESPECIAL: CalculationModality.SPECIAL_RETIREMENT,
  HIBRIDA: CalculationModality.HYBRID,
  AUXILIO_DOENCA_B31: CalculationModality.SICKNESS_BENEFIT_B31,
  AUXILIO_DOENCA_B91: CalculationModality.SICKNESS_BENEFIT_B91,
  SALARIO_MATERNIDADE: CalculationModality.MATERNITY_PAY,
  AUXILIO_RECLUSAO: CalculationModality.PRISONER_BENEFIT,
  PENSAO_MORTE: CalculationModality.DEATH_PENSION,
  BPC_LOAS: CalculationModality.BPC_LOAS,
}

export function mapModalidadeToDb(modality: string): CalculationModality {
  return modalityToDbMap[modality] || CalculationModality.RETIREMENT_BY_AGE
}

export type ApiNoteType = 'CONTATO' | 'DOCUMENTO' | 'JURIDICO' | 'INTERNO' | 'CALCULO' | 'PENDENCIA' | 'BPC'

const statusToDbMap: Record<ApiCaseStatus, DbCaseStatus> = {
  PROSPECCAO: DbCaseStatus.PROSPECTING,
  ANALISE: DbCaseStatus.ANALYSIS,
  PRONTO_PARA_REQUERER: DbCaseStatus.READY_TO_REQUEST,
  EM_PROCESSAMENTO: DbCaseStatus.PROCESSING,
  FINALIZADO: DbCaseStatus.FINISHED,
}

const statusToApiMap: Record<DbCaseStatus, ApiCaseStatus> = {
  [DbCaseStatus.PROSPECTING]: 'PROSPECCAO',
  [DbCaseStatus.ANALYSIS]: 'ANALISE',
  [DbCaseStatus.READY_TO_REQUEST]: 'PRONTO_PARA_REQUERER',
  [DbCaseStatus.PROCESSING]: 'EM_PROCESSAMENTO',
  [DbCaseStatus.FINISHED]: 'FINALIZADO',
}

const benefitToDbMap: Record<ApiBenefitType, DbBenefitType> = {
  APOSENTADORIA_IDADE: DbBenefitType.RETIREMENT_BY_AGE,
  APOSENTADORIA_TEMPO_CONTRIBUICAO: DbBenefitType.RETIREMENT_BY_CONTRIBUTION_TIME,
  APOSENTADORIA_ESPECIAL: DbBenefitType.SPECIAL_RETIREMENT,
  APOSENTADORIA_HIBRIDA: DbBenefitType.HYBRID_RETIREMENT,
  APOSENTADORIA_PONTOS: DbBenefitType.POINTS_RETIREMENT,
  AUXILIO_DOENCA: DbBenefitType.SICKNESS_BENEFIT,
  AUXILIO_ACIDENTE: DbBenefitType.ACCIDENT_BENEFIT,
  SALARIO_MATERNIDADE: DbBenefitType.MATERNITY_PAY,
  AUXILIO_RECLUSAO: DbBenefitType.PRISONER_BENEFIT,
  PENSAO_POR_MORTE: DbBenefitType.DEATH_PENSION,
  BPC_LOAS: DbBenefitType.BPC_LOAS,
  REVISAO_BENEFICIO: DbBenefitType.BENEFIT_REVIEW,
}

const benefitToApiMap: Record<DbBenefitType, ApiBenefitType> = {
  [DbBenefitType.RETIREMENT_BY_AGE]: 'APOSENTADORIA_IDADE',
  [DbBenefitType.RETIREMENT_BY_CONTRIBUTION_TIME]: 'APOSENTADORIA_TEMPO_CONTRIBUICAO',
  [DbBenefitType.SPECIAL_RETIREMENT]: 'APOSENTADORIA_ESPECIAL',
  [DbBenefitType.HYBRID_RETIREMENT]: 'APOSENTADORIA_HIBRIDA',
  [DbBenefitType.POINTS_RETIREMENT]: 'APOSENTADORIA_PONTOS',
  [DbBenefitType.SICKNESS_BENEFIT]: 'AUXILIO_DOENCA',
  [DbBenefitType.ACCIDENT_BENEFIT]: 'AUXILIO_ACIDENTE',
  [DbBenefitType.MATERNITY_PAY]: 'SALARIO_MATERNIDADE',
  [DbBenefitType.PRISONER_BENEFIT]: 'AUXILIO_RECLUSAO',
  [DbBenefitType.DEATH_PENSION]: 'PENSAO_POR_MORTE',
  [DbBenefitType.BPC_LOAS]: 'BPC_LOAS',
  [DbBenefitType.BENEFIT_REVIEW]: 'REVISAO_BENEFICIO',
}

const noteToDbMap: Record<ApiNoteType, DbNoteType> = {
  CONTATO: DbNoteType.CONTACT,
  DOCUMENTO: DbNoteType.DOCUMENT,
  JURIDICO: DbNoteType.LEGAL,
  INTERNO: DbNoteType.INTERNAL,
  CALCULO: DbNoteType.CALCULATION,
  PENDENCIA: DbNoteType.PENDING_ISSUE,
  BPC: DbNoteType.BPC_ANALYSIS,
}

const noteToApiMap: Record<DbNoteType, ApiNoteType> = {
  [DbNoteType.CONTACT]: 'CONTATO',
  [DbNoteType.DOCUMENT]: 'DOCUMENTO',
  [DbNoteType.LEGAL]: 'JURIDICO',
  [DbNoteType.INTERNAL]: 'INTERNO',
  [DbNoteType.CALCULATION]: 'CALCULO',
  [DbNoteType.PENDING_ISSUE]: 'PENDENCIA',
  [DbNoteType.BPC_ANALYSIS]: 'BPC',
}

export function mapCaseStatusToDb(status: ApiCaseStatus): DbCaseStatus {
  return statusToDbMap[status]
}

export function mapCaseStatusToApi(status: DbCaseStatus): ApiCaseStatus {
  return statusToApiMap[status]
}

export function mapBenefitTypeToDb(benefit: ApiBenefitType): DbBenefitType {
  return benefitToDbMap[benefit]
}

export function mapBenefitTypeToApi(benefit: DbBenefitType): ApiBenefitType {
  return benefitToApiMap[benefit]
}

export function mapNoteTypeToDb(noteType: ApiNoteType): DbNoteType {
  return noteToDbMap[noteType]
}

export function mapNoteTypeToApi(noteType: DbNoteType): ApiNoteType {
  return noteToApiMap[noteType]
}

const BENEFIT_TO_MODALITIES: Record<ApiBenefitType, string[]> = {
  APOSENTADORIA_IDADE: ['APOSENTADORIA_IDADE', 'IDADE_MINIMA_65_62', 'TEMPO_CONTRIBUICAO', 'PONTOS_86_96', 'PEDAGIO_50', 'PEDAGIO_100', 'APOSENTADORIA_ESPECIAL', 'HIBRIDA'],
  APOSENTADORIA_TEMPO_CONTRIBUICAO: ['TEMPO_CONTRIBUICAO', 'PONTOS_86_96', 'PEDAGIO_50', 'PEDAGIO_100', 'IDADE_MINIMA_65_62', 'APOSENTADORIA_IDADE'],
  APOSENTADORIA_ESPECIAL: ['APOSENTADORIA_ESPECIAL'],
  APOSENTADORIA_HIBRIDA: ['HIBRIDA'],
  APOSENTADORIA_PONTOS: ['PONTOS_86_96', 'PEDAGIO_50', 'PEDAGIO_100'],
  AUXILIO_DOENCA: ['AUXILIO_DOENCA_B31', 'AUXILIO_DOENCA_B91'],
  AUXILIO_ACIDENTE: [],
  SALARIO_MATERNIDADE: ['SALARIO_MATERNIDADE'],
  AUXILIO_RECLUSAO: ['AUXILIO_RECLUSAO'],
  PENSAO_POR_MORTE: ['PENSAO_MORTE'],
  BPC_LOAS: ['BPC_LOAS'],
  REVISAO_BENEFICIO: [],
}

export function getModalitiesForBenefit(benefitType: ApiBenefitType): string[] {
  return BENEFIT_TO_MODALITIES[benefitType] ?? []
}

export function mapCaseToApi<T extends { status: DbCaseStatus; benefitType: DbBenefitType }>(
  caso: T
): Omit<T, 'status' | 'benefitType'> & { status: ApiCaseStatus; benefitType: ApiBenefitType } {
  return {
    ...caso,
    status: mapCaseStatusToApi(caso.status),
    benefitType: mapBenefitTypeToApi(caso.benefitType),
  }
}

export function mapNoteToApi<T extends { type: DbNoteType }>(
  note: T
): Omit<T, 'type'> & { type: ApiNoteType } {
  return {
    ...note,
    type: mapNoteTypeToApi(note.type),
  }
}
