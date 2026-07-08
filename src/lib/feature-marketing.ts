// Copy de venda por feature bloqueada. Fonte única usada pelo UpgradeModal
// (aberto pelo interceptor 402 do api.ts) e pelo FeatureLockedTeaser (página
// de degustação renderizada no lugar do conteúdo bloqueado).
//
// As chaves espelham os códigos de `feature` que o backend envia no
// PlanLimitError (ver plan-guard.ts) — se um código não estiver aqui, a UI
// degrada para a mensagem literal do erro.

export interface FeaturePreviewTile {
  label: string
  value: string
}

export interface FeatureMarketing {
  /** Headline orientada a benefício — nunca "não está disponível". */
  title: string
  /** Uma frase de apoio: a dor que a feature resolve. */
  tagline: string
  /** 3 bullets de valor, na linguagem do advogado (tempo, segurança, honorários). */
  benefits: string[]
  /** Tiles fake exibidos borrados no teaser. Dados estáticos, nunca reais. */
  previewTiles: FeaturePreviewTile[]
}

export const FEATURE_MARKETING: Record<string, FeatureMarketing> = {
  SIMULATOR: {
    title: 'Simule benefícios e feche o contrato na primeira reunião',
    tagline: 'Cenários de aposentadoria calculados em segundos, direto do CNIS do cliente.',
    benefits: [
      'Compare todas as regras de transição e mostre a mais vantajosa',
      'Apresente valores concretos com o cliente ainda na sua mesa',
      'Cálculos com segurança jurídica, sem planilhas manuais',
    ],
    previewTiles: [
      { label: 'RMI Estimada', value: 'R$ 3.847,12' },
      { label: 'Melhor Regra', value: 'Pedágio 100%' },
      { label: 'Data do Direito', value: '14/03/2027' },
    ],
  },
  CALCULATIONS: {
    title: 'Cálculos previdenciários completos, sem planilha',
    tagline: 'Tempo de contribuição, RMI e valor da causa direto do CNIS do cliente.',
    benefits: [
      'Tempo de contribuição e carência apurados automaticamente',
      'RMI e valor da causa em todas as modalidades',
      'Sem limite mensal nos planos pagos',
    ],
    previewTiles: [
      { label: 'RMI Estimada', value: 'R$ 3.847,12' },
      { label: 'Melhor Regra', value: 'Pedágio 100%' },
      { label: 'Data do Direito', value: '14/03/2027' },
    ],
  },
  RETROATIVOS: {
    title: 'Calcule o valor exato da causa contra o INSS',
    tagline: 'Parcelas atrasadas com correção monetária e juros, prontas para a petição.',
    benefits: [
      'Detalhamento parcela a parcela, com correção e juros automáticos',
      'Valor da causa pronto para a inicial e para a execução',
      'Evite prejuízo nos honorários por cálculo subestimado',
    ],
    previewTiles: [
      { label: 'Total Retroativo', value: 'R$ 87.432,90' },
      { label: 'Parcelas', value: '38 meses' },
      { label: 'Juros + Correção', value: 'R$ 12.104,55' },
    ],
  },
  EXPORT_PDF: {
    title: 'Relatórios profissionais com a sua marca',
    tagline: 'O documento que você entrega ao cliente e protocola no processo.',
    benefits: [
      'PDF timbrado com a identidade do seu escritório',
      'Pronto para anexar ao processo ou apresentar ao cliente',
      'Horas de formatação manual economizadas por caso',
    ],
    previewTiles: [
      { label: 'Relatório', value: 'Completo' },
      { label: 'Timbre', value: 'Seu escritório' },
      { label: 'Formato', value: 'PDF pronto' },
    ],
  },
  DIAGNOSIS: {
    title: 'Diagnóstico do caso com IA em minutos',
    tagline: 'A análise do CNIS que levaria horas, feita antes do café esfriar.',
    benefits: [
      'Pendências e inconsistências do CNIS apontadas automaticamente',
      'Vínculos e recolhimentos com problema identificados',
      'Estratégia fundamentada antes de aceitar o caso',
    ],
    previewTiles: [
      { label: 'Pendências', value: '4 encontradas' },
      { label: 'Vínculos', value: '12 analisados' },
      { label: 'Tempo de Análise', value: '~2 min' },
    ],
  },
  OPINIONS: {
    title: 'Pareceres com IA sem limite mensal',
    tagline: 'Consulte jurisprudência e gere pareceres sempre que o caso pedir.',
    benefits: [
      'Pareceres ilimitados no plano superior',
      'Fundamentação atualizada para suas peças',
      'Menos horas de pesquisa por processo',
    ],
    previewTiles: [
      { label: 'Pareceres', value: 'Ilimitados' },
      { label: 'Fundamentação', value: 'Atualizada' },
      { label: 'Tempo Médio', value: '~3 min' },
    ],
  },
  USE_BPC_MODULE: {
    title: 'Análise BPC/LOAS sem erro na renda familiar',
    tagline: 'O critério de renda per capita é onde os pedidos de BPC morrem. Não erre.',
    benefits: [
      'Renda per capita do grupo familiar calculada automaticamente',
      'Roteiro de entrevista social e checklist de documentos',
      'Pré-análise por IA do laudo e das barreiras',
    ],
    previewTiles: [
      { label: 'Renda Per Capita', value: 'R$ 312,50' },
      { label: 'Critério', value: 'Elegível' },
      { label: 'Grupo Familiar', value: '4 membros' },
    ],
  },
  BPC_ANALYSIS: {
    title: 'Mais análises BPC/LOAS por mês',
    tagline: 'Sua cota de análises deste mês acabou — o próximo caso não espera.',
    benefits: [
      'Análises BPC ilimitadas no plano superior',
      'Renda per capita e critérios sempre atualizados',
      'Entrevista social e checklist inclusos',
    ],
    previewTiles: [
      { label: 'Renda Per Capita', value: 'R$ 312,50' },
      { label: 'Critério', value: 'Elegível' },
      { label: 'Grupo Familiar', value: '4 membros' },
    ],
  },
  PETICAO: {
    title: 'Petição inicial completa em um clique',
    tagline: 'Gerada com IA a partir dos dados que você já lançou no caso.',
    benefits: [
      'Peça estruturada com fatos, fundamentos e pedidos',
      'Usa CNIS, cálculos e diagnóstico já feitos no sistema',
      'Horas de redação economizadas por processo',
    ],
    previewTiles: [
      { label: 'Petição', value: 'Estruturada' },
      { label: 'Base', value: 'Dados do caso' },
      { label: 'Tempo', value: '~2 min' },
    ],
  },
  REVISION_MODULE: {
    title: 'Encontre revisões que valem honorários',
    tagline: 'Um benefício revisável identificado paga a assinatura do ano inteiro.',
    benefits: [
      'Identifique benefícios com direito a revisão',
      'Diferença mensal e retroativa calculadas na hora',
      'Teses de revisão sem depender de cálculo externo',
    ],
    previewTiles: [
      { label: 'RMI Revisada', value: 'R$ 4.291,03' },
      { label: 'Diferença Mensal', value: '+R$ 443,91' },
      { label: 'Retroativo', value: 'R$ 21.307,68' },
    ],
  },
  GPS_MODULE: {
    title: 'Guias GPS/DAS retroativas em segundos',
    tagline: 'Emitir guia retroativa manualmente é trabalho de horas. Aqui é um clique.',
    benefits: [
      'Cálculo automático por categoria e plano de contribuição',
      'Código de pagamento e competência sempre corretos',
      'Regularize contribuições do cliente sem sair do sistema',
    ],
    previewTiles: [
      { label: 'Valor da Guia', value: 'R$ 292,20' },
      { label: 'Código', value: '1007' },
      { label: 'Competência', value: '05/2026' },
    ],
  },
  VIABILITY_SCORE: {
    title: 'Saiba as chances de ganho antes de aceitar o caso',
    tagline: 'Priorize os casos que pagam e recuse os ruins com confiança.',
    benefits: [
      'Score objetivo de viabilidade por caso',
      'Priorize a carteira pelo retorno esperado',
      'Argumento técnico para recusar caso inviável',
    ],
    previewTiles: [
      { label: 'Score', value: '82 / 100' },
      { label: 'Viabilidade', value: 'Alta' },
      { label: 'Risco', value: 'Baixo' },
    ],
  },
  CLIENTS: {
    title: 'Sua carteira de clientes está crescendo',
    tagline: 'Você atingiu o limite de clientes ativos do seu plano.',
    benefits: [
      'Mais clientes ativos simultâneos',
      'Todos os casos e cálculos preservados',
      'Upgrade imediato, sem perder nada',
    ],
    previewTiles: [
      { label: 'Clientes', value: 'Sem limite' },
      { label: 'Casos', value: 'Preservados' },
      { label: 'Upgrade', value: 'Imediato' },
    ],
  },
}

export const PLAN_DISPLAY_NAMES: Record<string, string> = {
  FREE: 'Gratuito',
  SOLO: 'Solo',
  PRO: 'Pro',
}
