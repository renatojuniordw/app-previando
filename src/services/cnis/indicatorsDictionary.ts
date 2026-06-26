export interface IndicatorInfo {
  sigla: string
  tipo: 'Acerto' | 'Pendência' | 'Informativo' | 'Outro'
  grupo: string
  descricao: string
  acao: string
  critico: boolean
}

export const CNIS_INDICATORS: Record<string, IndicatorInfo> = {
  // Acertos
  'ACNISVR': {
    sigla: 'ACNISVR',
    tipo: 'Acerto',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Acerto realizado pelo INSS.',
    acao: 'Vínculo ou remuneração já acertado administrativamente. Geralmente não exige ação, mas confirme se as datas e valores estão corretos.',
    critico: false
  },
  'ADIV-DADOS-GFIP': {
    sigla: 'ADIV-DADOS-GFIP',
    tipo: 'Acerto',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Validação de vínculo ou remuneração com divergência de dado cadastral do trabalhador em GFIP.',
    acao: 'Indica divergência cadastral (como CPF, data de nascimento ou NIT). Verifique os dados cadastrais do cliente e retifique no INSS se houver erro.',
    critico: false
  },
  'AEXT-IND': {
    sigla: 'AEXT-IND',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Vínculo extemporâneo não confirmado pelo INSS.',
    acao: 'O INSS não aceitou a comprovação do período extemporâneo. Apresente provas contemporâneas robustas (CTPS, termo de rescisão, extrato do FGTS) para comprovar.',
    critico: true
  },
  'AEXT-INDJ': {
    sigla: 'AEXT-INDJ',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Vínculo extemporâneo não confirmado por decisão judicial.',
    acao: 'Houve uma ação judicial que tentou reconhecer este vínculo, mas foi indeferida ou não confirmada. Necessário analisar a sentença judicial para ver se restou alguma alternativa.',
    critico: true
  },
  'AEXT-INDR': {
    sigla: 'AEXT-INDR',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Vínculo extemporâneo não confirmado por decisão recursal.',
    acao: 'Vínculo indeferido na junta de recursos do INSS. Apresente novas provas ou acione a via judicial.',
    critico: true
  },
  'AEXT-VI': {
    sigla: 'AEXT-VI',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Vínculo extemporâneo não confirmado pelo INSS.',
    acao: 'Vínculo inserido fora do prazo e sem comprovação aceita. Exige apresentação de documentos contemporâneos da época da atividade comercial/laboral.',
    critico: true
  },
  'AEXT-VP': {
    sigla: 'AEXT-VP',
    tipo: 'Acerto',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Vínculo extemporâneo confirmado parcialmente pelo INSS.',
    acao: 'Apenas parte do período foi homologada. Verifique qual trecho ficou de fora e junte documentos adicionais para comprovar a integralidade.',
    critico: true
  },
  'AEXT-VPR': {
    sigla: 'AEXT-VPR',
    tipo: 'Acerto',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Vínculo extemporâneo confirmado parcialmente por decisão recursal.',
    acao: 'Confirmação parcial em grau de recurso administrativo. Avalie se compensa ingressar com ação judicial para o restante do período.',
    critico: true
  },
  'AEXT-VPT': {
    sigla: 'AEXT-VPT',
    tipo: 'Acerto',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Vínculo extemporâneo confirmado parcialmente por decisão judicial.',
    acao: 'Vínculo judicial homologado em parte pelo juiz. Verifique a sentença.',
    critico: true
  },
  'AEXT-VT': {
    sigla: 'AEXT-VT',
    tipo: 'Acerto',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Vínculo extemporâneo confirmado pelo INSS.',
    acao: 'Período extemporâneo totalmente confirmado e homologado. Não exige ação.',
    critico: false
  },
  'AEXT-VTJ': {
    sigla: 'AEXT-VTJ',
    tipo: 'Acerto',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Vínculo extemporâneo confirmado por decisão judicial.',
    acao: 'Período reconhecido judicialmente e implantado no CNIS. Sem ação pendente.',
    critico: false
  },
  'AEXT-VTR': {
    sigla: 'AEXT-VTR',
    tipo: 'Acerto',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Vínculo extemporâneo confirmado por decisão recursal.',
    acao: 'Período reconhecido em recurso no Conselho de Recursos da Previdência. Sem ação pendente.',
    critico: false
  },
  'ASE-DEF': {
    sigla: 'ASE-DEF',
    tipo: 'Acerto',
    grupo: 'SEGURADO ESPECIAL',
    descricao: 'Acerto Período Segurado Especial Deferido.',
    acao: 'Período de trabalhador rural / segurado especial validado pelo INSS. Não exige ação.',
    critico: false
  },
  'ASE-DEFJ': {
    sigla: 'ASE-DEFJ',
    tipo: 'Acerto',
    grupo: 'SEGURADO ESPECIAL',
    descricao: 'Acerto Período Segurado Especial Deferido Judicial.',
    acao: 'Período de segurado especial confirmado por sentença judicial. Não exige ação.',
    critico: false
  },
  'ASE-DEFR': {
    sigla: 'ASE-DEFR',
    tipo: 'Acerto',
    grupo: 'SEGURADO ESPECIAL',
    descricao: 'Acerto Período Segurado Especial Deferido Recursal.',
    acao: 'Período de segurado especial confirmado em recurso administrativo. Não exige ação.',
    critico: false
  },
  'ASEF-DEF': {
    sigla: 'ASEF-DEF',
    tipo: 'Acerto',
    grupo: 'SEGURADO ESPECIAL',
    descricao: 'Acerto Período Segurado Especial FUNAI Deferido.',
    acao: 'Período de indígena cadastrado pela FUNAI homologado. Não exige ação.',
    critico: false
  },
  'ASE-IND': {
    sigla: 'ASE-IND',
    tipo: 'Pendência',
    grupo: 'SEGURADO ESPECIAL',
    descricao: 'Acerto Período Segurado Especial Indeferido.',
    acao: 'O INSS negou o enquadramento rural deste período. Necessário juntar novas autodeclarações rurais, certidões da época, notas fiscais ou contratos de parceria/arrendamento.',
    critico: true
  },
  'ASE-NSE': {
    sigla: 'ASE-NSE',
    tipo: 'Pendência',
    grupo: 'SEGURADO ESPECIAL',
    descricao: 'Acerto Período Não Segurado Especial.',
    acao: 'INSS descaracterizou a condição de segurado especial. Apresente defesa ou novas provas contemporâneas.',
    critico: true
  },
  'AVR-AGPVINC': {
    sigla: 'AVR-AGPVINC',
    tipo: 'Acerto',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Acerto de Agrupamento de Vínculos.',
    acao: 'O INSS agrupou vínculos com CPFs ou dados similares. Verifique se o agrupamento foi correto e confira as datas.',
    critico: false
  },
  'AVRC-DEF': {
    sigla: 'AVRC-DEF',
    tipo: 'Acerto',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Acerto confirmado pelo INSS.',
    acao: 'Vínculo regularizado administrativamente. Não exige ação.',
    critico: false
  },

  // Pendências comuns críticas
  'PEXT': {
    sigla: 'PEXT',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Pendência de vínculo extemporâneo.',
    acao: 'O vínculo foi informado fora do prazo legal de recolhimento. Para validá-lo, o advogado deve anexar cópia da CTPS, contratos de trabalho, recibos, ficha de registro ou extrato analítico do FGTS.',
    critico: true
  },
  'PSC-MEN': {
    sigla: 'PSC-MEN',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Período com recolhimento abaixo do salário mínimo.',
    acao: 'A remuneração da competência ficou abaixo do salário mínimo vigente na época. Desde a EC 103/2019, essas competências não contam para tempo de contribuição ou carência, a menos que sejam complementadas, agrupadas ou que haja transferência de excedente.',
    critico: true
  },
  'PREC-FBR': {
    sigla: 'PREC-FBR',
    tipo: 'Pendência',
    grupo: 'CONTRIBUINTE INDIVIDUAL/FACULTATIVO',
    descricao: 'Recolhimento abaixo do salário mínimo para segurado facultativo de baixa renda.',
    acao: 'Contribuição feita com a alíquota de 5% de baixa renda, mas a condição não foi validada (por exemplo, ausência de inscrição ativa no CadÚnico ou renda familiar inadequada). O segurado precisará comprovar a condição ou complementar as guias para a alíquota de 11% ou 20%.',
    critico: true
  },
  'IEAN': {
    sigla: 'IEAN',
    tipo: 'Informativo',
    grupo: 'APOSENTADORIA ESPECIAL',
    descricao: 'Exposição a agentes nocivos.',
    acao: 'Indica que houve informação de recolhimento com exposição a agentes nocivos (insalubridade ou periculosidade). Excelente indício para pedir conversão de tempo especial em comum. Solicite o PPP (Perfil Profissiográfico Previdenciário) e o LTCAT à empresa.',
    critico: false
  },
  'PCON': {
    sigla: 'PCON',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Período com indicação de concorrência de vínculos.',
    acao: 'Há sobreposição de datas de vínculos de emprego ou atividades. Verifique se o cliente trabalhou em mais de um lugar ao mesmo tempo ou se há erro de preenchimento das datas de fim no CNIS.',
    critico: false
  },
  'PRAS': {
    sigla: 'PRAS',
    tipo: 'Pendência',
    grupo: 'CONTRIBUINTE INDIVIDUAL',
    descricao: 'Pendente de Regularização de Atividade de Segurado.',
    acao: 'O INSS necessita da comprovação da efetiva atividade de contribuinte individual. Apresente alvará, comprovante de ISS, declaração de imposto de renda ou recibos de prestação de serviços (RPA).',
    critico: true
  },
  'PREM-FVIN': {
    sigla: 'PREM-FVIN',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Remuneração pós-fim de vínculo.',
    acao: 'Aparece quando há salários declarados após a data de desligamento. Verifique se foi pagamento de rescisão complementar/acordo trabalhista ou se a data de encerramento do vínculo está errada.',
    critico: false
  },
  'PCON-VINC': {
    sigla: 'PCON-VINC',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Vínculo com pendência de concorrência.',
    acao: 'Indica vínculos simultâneos no mesmo período. Verifique se a concomitância é real ou erro cadastral.',
    critico: false
  },
  'PADM-EMPR': {
    sigla: 'PADM-EMPR',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: 'Admissão anterior ao início da empresa.',
    acao: 'A data de admissão informada é anterior à data de fundação do CNPJ da empresa. Exige acerto com cópia da CTPS e contrato social da empresa para esclarecer.',
    critico: true
  }
}

export function getIndicatorDetails(sigla: string): IndicatorInfo {
  // Limpar espaços ou lixo
  const cleanSigla = sigla.trim().toUpperCase()

  // Tentar encontrar correspondência exata
  if (CNIS_INDICATORS[cleanSigla]) {
    return CNIS_INDICATORS[cleanSigla]
  }

  // Tentar casamento parcial
  const baseKey = Object.keys(CNIS_INDICATORS).find(key => cleanSigla.startsWith(key))
  if (baseKey) {
    return {
      ...CNIS_INDICATORS[baseKey],
      sigla: cleanSigla
    }
  }

  // Fallback padrão para indicadores desconhecidos
  return {
    sigla: cleanSigla,
    tipo: 'Outro',
    grupo: 'INDICADOR GERAL',
    descricao: 'Indicador de situação ou pendência no CNIS.',
    acao: 'Verifique a descrição deste indicador nas orientações gerais do INSS ou solicite esclarecimentos na agência da previdência social.',
    critico: false
  }
}
