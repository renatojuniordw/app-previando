// ─── Labels de Benefícios Previdenciários ────────────────────────────────

export const BENEFIT_LABELS: Record<string, string> = {
  APOSENTADORIA_IDADE: 'Aposentadoria por Idade',
  APOSENTADORIA_TEMPO_CONTRIBUICAO: 'Aposentadoria por Tempo de Contribuição',
  APOSENTADORIA_ESPECIAL: 'Aposentadoria Especial',
  APOSENTADORIA_HIBRIDA: 'Aposentadoria Híbrida',
  APOSENTADORIA_PONTOS: 'Aposentadoria por Pontos',
  APOSENTADORIA_PCD: 'Aposentadoria da Pessoa com Deficiência',
  AUXILIO_DOENCA: 'Auxílio-Doença',
  AUXILIO_ACIDENTE: 'Auxílio-Acidente',
  SALARIO_MATERNIDADE: 'Salário-Maternidade',
  AUXILIO_RECLUSAO: 'Auxílio-Reclusão',
  PENSAO_POR_MORTE: 'Pensão por Morte',
  BPC_LOAS: 'BPC/LOAS',
  REVISAO_BENEFICIO: 'Revisão de Benefício',
}

// Labels encurtadas para exibição em tabs e listas compactas
export const BENEFIT_SHORT_LABELS: Record<string, string> = {
  APOSENTADORIA_IDADE: 'Apos. por Idade',
  APOSENTADORIA_TEMPO_CONTRIBUICAO: 'Apos. por TC',
  APOSENTADORIA_ESPECIAL: 'Apos. Especial',
  APOSENTADORIA_HIBRIDA: 'Apos. Híbrida',
  APOSENTADORIA_PONTOS: 'Apos. por Pontos',
  APOSENTADORIA_PCD: 'Apos. PCD',
  AUXILIO_DOENCA: 'Auxílio-Doença',
  AUXILIO_ACIDENTE: 'Auxílio-Acidente',
  SALARIO_MATERNIDADE: 'Sal. Maternidade',
  AUXILIO_RECLUSAO: 'Aux. Reclusão',
  PENSAO_POR_MORTE: 'Pensão por Morte',
  BPC_LOAS: 'BPC/LOAS',
  REVISAO_BENEFICIO: 'Revisão Benefício',
}

export const BENEFIT_DB_LABELS: Record<string, string> = {
  RETIREMENT_BY_AGE: 'Idade',
  RETIREMENT_BY_CONTRIBUTION_TIME: 'Tempo',
  SPECIAL_RETIREMENT: 'Especial',
  HYBRID_RETIREMENT: 'Híbrida',
  POINTS_RETIREMENT: 'Pontos',
  PCD_RETIREMENT: 'PCD',
  SICKNESS_BENEFIT: 'Aux. Doença',
  DEATH_PENSION: 'Pensão',
  BPC_LOAS: 'BPC/LOAS',
  MATERNITY_PAY: 'Maternidade',
  ACCIDENT_BENEFIT: 'Acidente',
  PRISONER_BENEFIT: 'Reclusão',
  BENEFIT_REVIEW: 'Revisão',
}

// ─── Status Labels ────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<string, string> = {
  PROSPECCAO: 'Prospecção',
  ANALISE: 'Análise',
  PRONTO_PARA_REQUERER: 'Pronto p/ Requerer',
  EM_PROCESSAMENTO: 'Em Processamento',
  FINALIZADO: 'Finalizado',
}

// ─── Prioridade ───────────────────────────────────────────────────────────

export const PRIORITY_STYLES: Record<string, { label: string; color: 'lime' | 'red' | 'yellow' | 'slate' | 'blue' | 'green' }> = {
  CRITICAL: { label: 'Crítico', color: 'red' },
  ATTENTION: { label: 'Atenção', color: 'yellow' },
  NORMAL: { label: 'Normal', color: 'slate' },
}

export const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítico',
  ATTENTION: 'Atenção',
  NORMAL: 'Normal',
}

export const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  ATTENTION: '#f59e0b',
  NORMAL: '#10b981',
}

// ─── Labels específicos para pareceres (Opinion) ───────────────────────────

export const OPINION_STATUS_LABELS: Record<string, string> = {
  GENERATED: 'Gerado',
  REVIEWED: 'Revisado',
  FINALIZED: 'Final',
}
