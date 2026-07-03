export interface IndicatorInfo {
  sigla: string
  tipo: 'Acerto' | 'Pendência' | 'Informativo' | 'Outro'
  grupo: string
  descricao: string
  acao: string
  critico: boolean
}

export const CNIS_INDICATORS: Record<string, IndicatorInfo> = {
  'PDESFAZ-AJ-EC103': {
    sigla: 'PDESFAZ-AJ-EC103',
    tipo: 'Pendência',
    grupo: 'AJUSTES EC103 - OUTROS INDICADORES',
    descricao: "Pendência por desfazimento de agrupamento ou utilização",
    acao: "Período posterior à EC 103/2019 com contribuição abaixo do salário mínimo. Necessário complementar, agrupar ou utilizar excedentes para contar para carência e tempo de serviço.",
    critico: true
  },
  'PMOV-INCONSIST': {
    sigla: 'PMOV-INCONSIST',
    tipo: 'Pendência',
    grupo: 'AJUSTES EC103 - OUTROS INDICADORES',
    descricao: "Pendência de registro inconsistente de movimentação entre competências",
    acao: "Período posterior à EC 103/2019 com contribuição abaixo do salário mínimo. Necessário complementar, agrupar ou utilizar excedentes para contar para carência e tempo de serviço.",
    critico: true
  },
  'PREM-BLOQ-EC103': {
    sigla: 'PREM-BLOQ-EC103',
    tipo: 'Pendência',
    grupo: 'AJUSTES EC103 - OUTROS INDICADORES',
    descricao: "Pendência de bloqueio de remuneração/contribuição para ajuste entre competências",
    acao: "Período posterior à EC 103/2019 com contribuição abaixo do salário mínimo. Necessário complementar, agrupar ou utilizar excedentes para contar para carência e tempo de serviço.",
    critico: true
  },
  'PSC-MEN-SM-EC103': {
    sigla: 'PSC-MEN-SM-EC103',
    tipo: 'Pendência',
    grupo: 'AJUSTES EC103 - OUTROS INDICADORES',
    descricao: "Pendência que sinaliza que a competência possui salário de contribuição menor do que o mínimo. Competência não tratada, passível de complementação, utilização ou agrupamento",
    acao: "Período posterior à EC 103/2019 com contribuição abaixo do salário mínimo. Necessário complementar, agrupar ou utilizar excedentes para contar para carência e tempo de serviço.",
    critico: true
  },
  'PREC-CDCONC': {
    sigla: 'PREC-CDCONC',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento ou período atividade de contribuinte em dobro concomitante com outro TFV (Tipo de Filiado no Vínculo)",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREC-COD1821': {
    sigla: 'PREC-COD1821',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento com código de pagamento 1821 - Mandato Eletivo",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREC-CSE': {
    sigla: 'PREC-CSE',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado especial pendente de comprovação da atividade",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PRECFACULTCONC': {
    sigla: 'PRECFACULTCONC',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento ou período de contribuinte facultativo concomitante com outros vínculos",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREC-FBR': {
    sigla: 'PREC-FBR',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda não validado",
    acao: "Recolhimento de Facultativo Baixa Renda pendente de validação. Necessário comprovar inscrição ativa no CadÚnico e renda familiar compatível.",
    critico: true
  },
  'PREC-FBR (FBR-AUT-BAT)': {
    sigla: 'PREC-FBR (FBR-AUT-BAT)',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda com atualização cadastral/elos no CNIS aguardando batimentos",
    acao: "Recolhimento de Facultativo Baixa Renda pendente de validação. Necessário comprovar inscrição ativa no CadÚnico e renda familiar compatível.",
    critico: true
  },
  'PREC-FBR (FBR-AUT-CONCBEN)': {
    sigla: 'PREC-FBR (FBR-AUT-CONCBEN)',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda concomitante com benefício incompatível (previdenciário/BPC/PA)",
    acao: "Recolhimento de Facultativo Baixa Renda pendente de validação. Necessário comprovar inscrição ativa no CadÚnico e renda familiar compatível.",
    critico: true
  },
  'PREC-FBR (FBR-AUT-CONCQSA)': {
    sigla: 'PREC-FBR (FBR-AUT-CONCQSA)',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda participante de quadro societário (QSA) de empresa",
    acao: "Recolhimento de Facultativo Baixa Renda pendente de validação. Necessário comprovar inscrição ativa no CadÚnico e renda familiar compatível.",
    critico: true
  },
  'PREC-FBR (FBR-AUT-CONCSD)': {
    sigla: 'PREC-FBR (FBR-AUT-CONCSD)',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda concomitante com período de Seguro Desemprego (SD/SDPA)",
    acao: "Recolhimento de Facultativo Baixa Renda pendente de validação. Necessário comprovar inscrição ativa no CadÚnico e renda familiar compatível.",
    critico: true
  },
  'PREC-FBR (FBR-AUT-DUPGRUPFAM)': {
    sigla: 'PREC-FBR (FBR-AUT-DUPGRUPFAM)',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda com duplicidade de grupo familiar",
    acao: "Recolhimento de Facultativo Baixa Renda pendente de validação. Necessário comprovar inscrição ativa no CadÚnico e renda familiar compatível.",
    critico: true
  },
  'PREC-FBR (FBR-AUT-EXPCAD)': {
    sigla: 'PREC-FBR (FBR-AUT-EXPCAD)',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda sem atualização bienal no CadÚnico",
    acao: "Recolhimento de Facultativo Baixa Renda pendente de validação. Necessário comprovar inscrição ativa no CadÚnico e renda familiar compatível.",
    critico: true
  },
  'PREC-FBR (FBR-AUT-FACULTCONC)': {
    sigla: 'PREC-FBR (FBR-AUT-FACULTCONC)',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda concomitante com filiação incompatível (segurado obrigatório)",
    acao: "Recolhimento de Facultativo Baixa Renda pendente de validação. Necessário comprovar inscrição ativa no CadÚnico e renda familiar compatível.",
    critico: true
  },
  'PREC-FBR (FBR-AUT-OBITO)': {
    sigla: 'PREC-FBR (FBR-AUT-OBITO)',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda com óbito anterior à competência de referência ou à data do pagamento",
    acao: "Recolhimento de Facultativo Baixa Renda pendente de validação. Necessário comprovar inscrição ativa no CadÚnico e renda familiar compatível.",
    critico: true
  },
  'PREC-FBR (FBR-AUT-PENDCAD)': {
    sigla: 'PREC-FBR (FBR-AUT-PENDCAD)',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda sem cadastro no CadÚnico",
    acao: "Recolhimento de Facultativo Baixa Renda pendente de validação. Necessário comprovar inscrição ativa no CadÚnico e renda familiar compatível.",
    critico: true
  },
  'PREC-FBR (FBR-AUT-PENDPROCES)': {
    sigla: 'PREC-FBR (FBR-AUT-PENDPROCES)',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda pendente de processamento no CadÚnico",
    acao: "Recolhimento de Facultativo Baixa Renda pendente de validação. Necessário comprovar inscrição ativa no CadÚnico e renda familiar compatível.",
    critico: true
  },
  'PREC-FBR (FBR-AUT-RENPES)': {
    sigla: 'PREC-FBR (FBR-AUT-RENPES)',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda com renda pessoal informada no CadÚnico",
    acao: "Recolhimento de Facultativo Baixa Renda pendente de validação. Necessário comprovar inscrição ativa no CadÚnico e renda familiar compatível.",
    critico: true
  },
  'PREC-FBR (FBR-AUT-RENSUP)': {
    sigla: 'PREC-FBR (FBR-AUT-RENSUP)',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda com renda familiar superior a 2 salários mínimos",
    acao: "Recolhimento de Facultativo Baixa Renda pendente de validação. Necessário comprovar inscrição ativa no CadÚnico e renda familiar compatível.",
    critico: true
  },
  'PREC-FBR-ANT': {
    sigla: 'PREC-FBR-ANT',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda anterior a 09/2011 (inválido)",
    acao: "Recolhimento de Facultativo Baixa Renda pendente de validação. Necessário comprovar inscrição ativa no CadÚnico e renda familiar compatível.",
    critico: true
  },
  'PREC-LC150-DOM': {
    sigla: 'PREC-LC150-DOM',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Pagamento de doméstica em GPS em período de remuneração de fonte INSS/eSocial",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREC-MENOR-MIN': {
    sigla: 'PREC-MENOR-MIN',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento abaixo do valor mínimo",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREC-OBITO': {
    sigla: 'PREC-OBITO',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Competência do recolhimento posterior ao mês do óbito",
    acao: "Divergência de data de óbito. Apresentar certidão de nascimento/casamento atualizada ou justificar administrativamente.",
    critico: true
  },
  'PREC-PMIG-DOM': {
    sigla: 'PREC-PMIG-DOM',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de empregado doméstico sem comprovação de vínculo",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-EXT': {
    sigla: 'PREM-EXT',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Remuneração informada fora do prazo, passível de comprovação",
    acao: "Período extemporâneo (fora do prazo). Apresentar documentos contemporâneos da época (CTPS, termo de rescisão, extrato do FGTS).",
    critico: true
  },
  'PREM-TSVE-PER-QUARENTENA': {
    sigla: 'PREM-TSVE-PER-QUARENTENA',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Remuneração informada após o término do TSVE referente ao período de Quarentena",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-TSVE-PER-TERM-JUD': {
    sigla: 'PREM-TSVE-PER-TERM-JUD',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Pendência de Remuneração após o término do TSVE reconhecido judicialmente com data anterior a competências de remunerações já informadas no eSocial",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-TSVE-POS-QUARENTENA': {
    sigla: 'PREM-TSVE-POS-QUARENTENA',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Pendência de Remuneração informada para TSVE após o período de Quarentena",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-TSVE-POS-TERM-JUD': {
    sigla: 'PREM-TSVE-POS-TERM-JUD',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Pendência de Remuneração após o período entre o término do TSVE e o último dia trabalhado",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-TSVE-PROC-TRAB': {
    sigla: 'PREM-TSVE-PROC-TRAB',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Pendência de Reconhecimento de Remuneração de Trabalhador sem Vínculo oriundo de Processo Trabalhista",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PDT-NASC-FIL-INV': {
    sigla: 'PDT-NASC-FIL-INV',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES/VÍNCULOS E REMUNERAÇÕES',
    descricao: "Idade do filiado menor que a permitida pela legislação",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PDT-NASC-FIL-MENOR-INV': {
    sigla: 'PDT-NASC-FIL-MENOR-INV',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES/VÍNCULOS E REMUNERAÇÕES',
    descricao: "Idade do filiado menor aprendiz menor que a permitida pela legislação",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-NASC': {
    sigla: 'PREM-NASC',
    tipo: 'Pendência',
    grupo: 'CONTRIBUIÇÕES/VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração antes da data de nascimento do Filiado",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PDARF-ALT-COMP-FORA-VIG': {
    sigla: 'PDARF-ALT-COMP-FORA-VIG',
    tipo: 'Pendência',
    grupo: 'DARF - EVENTOS',
    descricao: "Indicador de Darf incluído por alteração de competência fora do período de vigência",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PDARF-ALT-CPF': {
    sigla: 'PDARF-ALT-CPF',
    tipo: 'Pendência',
    grupo: 'DARF - EVENTOS',
    descricao: "Darf desassociado do CPF originário pela RFB",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: false
  },
  'PDARF-EVENTO-INCONSISTENTE': {
    sigla: 'PDARF-EVENTO-INCONSISTENTE',
    tipo: 'Pendência',
    grupo: 'DARF - EVENTOS',
    descricao: "Evento inconsistente",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PDARF-INV-ALT-CODRECEITA': {
    sigla: 'PDARF-INV-ALT-CODRECEITA',
    tipo: 'Pendência',
    grupo: 'DARF - EVENTOS',
    descricao: "Indicador de Darf invalidado por alteração pela RFB para código de receita não tratado",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: false
  },
  'PDARF-RESTIT-PARCIAL': {
    sigla: 'PDARF-RESTIT-PARCIAL',
    tipo: 'Pendência',
    grupo: 'DARF - EVENTOS',
    descricao: "Indicador de Darf com Valor Restituído Parcial",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: false
  },
  'PDARF-RESTIT-TOTAL': {
    sigla: 'PDARF-RESTIT-TOTAL',
    tipo: 'Pendência',
    grupo: 'DARF - EVENTOS',
    descricao: "Indicador de Darf com Valor Restituído Total",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: false
  },
  'PNIT-CRIT': {
    sigla: 'PNIT-CRIT',
    tipo: 'Pendência',
    grupo: 'GERAIS DO NIT OU DE DADOS CADASTRAIS',
    descricao: "NIT em faixa crítica",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PNIT-IND': {
    sigla: 'PNIT-IND',
    tipo: 'Pendência',
    grupo: 'GERAIS DO NIT OU DE DADOS CADASTRAIS',
    descricao: "NIT Indeterminado",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PNIT-O094': {
    sigla: 'PNIT-O094',
    tipo: 'Pendência',
    grupo: 'GERAIS DO NIT OU DE DADOS CADASTRAIS',
    descricao: "NIT invalidado pertencente à faixa crítica do tipo Ofício INSS 094",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PNIT-SC': {
    sigla: 'PNIT-SC',
    tipo: 'Pendência',
    grupo: 'GERAIS DO NIT OU DE DADOS CADASTRAIS',
    descricao: "NIT não encontrado cadastrado/inexistente",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PNIT-SUP': {
    sigla: 'PNIT-SUP',
    tipo: 'Pendência',
    grupo: 'GERAIS DO NIT OU DE DADOS CADASTRAIS',
    descricao: "NIT com indício de superposição de dados",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PSE-NEG': {
    sigla: 'PSE-NEG',
    tipo: 'Pendência',
    grupo: 'SEGURADO ESPECIAL',
    descricao: "Período Segurado Especial Negativo",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PSE-PEN': {
    sigla: 'PSE-PEN',
    tipo: 'Pendência',
    grupo: 'SEGURADO ESPECIAL',
    descricao: "Período Segurado Especial Pendente",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PSE-POS': {
    sigla: 'PSE-POS',
    tipo: 'Pendência',
    grupo: 'SEGURADO ESPECIAL',
    descricao: "Período Segurado Especial Positivo",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'NDET': {
    sigla: 'NDET',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Data de início de atividade foi estimada na migração",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PADM-EMPR': {
    sigla: 'PADM-EMPR',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Data de admissão anterior ao início da atividade do empregador / Data de admissão posterior à data de encerramento da atividade do empregador",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PCEI-EQP-INV': {
    sigla: 'PCEI-EQP-INV',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Empregador com identificador inválido (CEI)",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PDIV-DADOS-GFIP': {
    sigla: 'PDIV-DADOS-GFIP',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Vínculo ou remuneração pendente por divergência de dado cadastral do trabalhador em GFIP",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PEMP-CAD': {
    sigla: 'PEMP-CAD',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Faltam dados cadastrais do empregador (CNPJ ou CEI)",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PEMP-IDINV': {
    sigla: 'PEMP-IDINV',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Empregador com identificador inválido",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PEXT': {
    sigla: 'PEXT',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Vínculo com informação extemporânea, passível de comprovação",
    acao: "Período extemporâneo (fora do prazo). Apresentar documentos contemporâneos da época (CTPS, termo de rescisão, extrato do FGTS).",
    critico: true
  },
  'PREC-COD1821_FORA_VIG': {
    sigla: 'PREC-COD1821_FORA_VIG',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Recolhimento com código de pagamento 1821 - mandato eletivo, fora da vigência",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-EMPR': {
    sigla: 'PREM-EMPR',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remunerações após a data de encerramento / antes da data de início de atividade do empregador",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-FORA-ATIV-INTERM': {
    sigla: 'PREM-FORA-ATIV-INTERM',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração de trabalho intermitente fora do período de atividade de intermitente",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-FORA-CONVOC': {
    sigla: 'PREM-FORA-CONVOC',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração de trabalho intermitente não coberta por Convocatória (extinto, substituído por PREM-FORA-ATIV-INTERM)",
    acao: "Indicador obsoleto ou descontinuado pelo INSS. Não costuma exigir tratamento para períodos recentes, mas verifique o histórico.",
    critico: true
  },
  'PREM-FORA-REINTEG-ANISTIA': {
    sigla: 'PREM-FORA-REINTEG-ANISTIA',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência de Remuneração fora do período da Reintegração por Anistia Legal",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-FORA-REINTEG-OUTROSTIPOS': {
    sigla: 'PREM-FORA-REINTEG-OUTROSTIPOS',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência de Remuneração fora do período da Reintegração por iniciativa do empregador ou por outros motivos",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-FORA-REINTEG-PROC-TRAB': {
    sigla: 'PREM-FORA-REINTEG-PROC-TRAB',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência de Remuneração fora do período da Reintegração oriunda de Processo Trabalhista",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-FVIN': {
    sigla: 'PREM-FVIN',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração após o fim do vínculo",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-IVIN': {
    sigla: 'PREM-IVIN',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração antes do início do vínculo",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-OBITO': {
    sigla: 'PREM-OBITO',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração após óbito",
    acao: "Divergência de data de óbito. Apresentar certidão de nascimento/casamento atualizada ou justificar administrativamente.",
    critico: true
  },
  'PREM-PER-DESLIG-APOSENT': {
    sigla: 'PREM-PER-DESLIG-APOSENT',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência de Remuneração após o desligamento por aposentadoria de servidor com data anterior à competência de remuneração já informada no eSocial",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-PER-DESLIG-JUD': {
    sigla: 'PREM-PER-DESLIG-JUD',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência de Remuneração após o desligamento reconhecido judicialmente com data anterior à competência de remuneração já informada no eSocial",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-POS-DESLIG-APOSENT': {
    sigla: 'PREM-POS-DESLIG-APOSENT',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência de Remuneração após o período entre o desligamento por aposentadoria de servidor e o último dia trabalhado",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-POS-DESLIG-JUD': {
    sigla: 'PREM-POS-DESLIG-JUD',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência de Remuneração após o período entre o desligamento e o último dia trabalhado",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-POS-QRT': {
    sigla: 'PREM-POS-QRT',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração posterior ao período de quarentena (substituído por PREM-POS-QUARENTENA e PREM-TSVE-POS-QUARENTENA)",
    acao: "Indicador obsoleto ou descontinuado pelo INSS. Não costuma exigir tratamento para períodos recentes, mas verifique o histórico.",
    critico: true
  },
  'PREM-POS-QUARENTENA': {
    sigla: 'PREM-POS-QUARENTENA',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência de Remuneração informada após o período de Quarentena",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-REINTEG-ANISTIA': {
    sigla: 'PREM-REINTEG-ANISTIA',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência em Remuneração de período de Anistia Legal",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-REINTEG-OUTROSTIPOS': {
    sigla: 'PREM-REINTEG-OUTROSTIPOS',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência em Remuneração de período de Reintegração por iniciativa do empregador ou por outros motivos",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PREM-VINC-PROC-TRAB': {
    sigla: 'PREM-VINC-PROC-TRAB',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência de Reconhecimento de Remuneração no Vínculo oriunda de Processo Trabalhista",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PRES-EMPR': {
    sigla: 'PRES-EMPR',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Data de rescisão posterior à data de encerramento / anterior à data de início da Atividade do Empregador",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PRPPS': {
    sigla: 'PRPPS',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Vínculo de empregado com informações de Regime Próprio (Servidor Público)",
    acao: "Vínculo de Regime Próprio de Previdência Social. Solicitar a CTC no órgão público correspondente e averbar no INSS.",
    critico: true
  },
  'PRPSE': {
    sigla: 'PRPSE',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Vínculo de empregado do Regime de Previdência no Exterior",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PSUC-DIVERG-DT-ADM': {
    sigla: 'PSUC-DIVERG-DT-ADM',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência que indica que o vínculo é sucessor e foram encontradas divergências envolvendo a data de admissão (desabilitado desde 19/09/2024)",
    acao: "Indicador obsoleto ou descontinuado pelo INSS. Não costuma exigir tratamento para períodos recentes, mas verifique o histórico.",
    critico: false
  },
  'PVIN-ADMISSAO-DESLIG-PROC-TRAB': {
    sigla: 'PVIN-ADMISSAO-DESLIG-PROC-TRAB',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência por Alteração da Data de Admissão e Inclusão ou Alteração da Data de Desligamento, oriundas de Processo Trabalhista",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PVIN-ADMISSAO-PROC-TRAB': {
    sigla: 'PVIN-ADMISSAO-PROC-TRAB',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência por Alteração da Data de Admissão oriunda de Processo Trabalhista",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PVIN-ADM-OBITO': {
    sigla: 'PVIN-ADM-OBITO',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Data de admissão posterior ao óbito",
    acao: "Divergência de data de óbito. Apresentar certidão de nascimento/casamento atualizada ou justificar administrativamente.",
    critico: true
  },
  'PVIN-AGRUP-INC': {
    sigla: 'PVIN-AGRUP-INC',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência que sinaliza inconsistência em Vínculo agrupador quando não foi possível encontrar todos os seus vínculos agrupados relacionados",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PVIN-CAGED': {
    sigla: 'PVIN-CAGED',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Vínculo Oriundo da fonte CAGED",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PVIN-DESLIG-JUSTICA-TRAB': {
    sigla: 'PVIN-DESLIG-JUSTICA-TRAB',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência por Inclusão da Data de Desligamento feita pela Justiça do Trabalho por meio do Evento S-8299 do eSocial",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PVIN-DESLIG-OBITO': {
    sigla: 'PVIN-DESLIG-OBITO',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Data do desligamento posterior à data do óbito",
    acao: "Divergência de data de óbito. Apresentar certidão de nascimento/casamento atualizada ou justificar administrativamente.",
    critico: true
  },
  'PVIN-DESLIG-PROC-TRAB': {
    sigla: 'PVIN-DESLIG-PROC-TRAB',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência por Inclusão ou Alteração da Data de Desligamento oriunda de Processo Trabalhista",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PVIN-IRREG': {
    sigla: 'PVIN-IRREG',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Vínculo em situação de irregularidade",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PVIN-MAND-ELETIVO-TOTAL': {
    sigla: 'PVIN-MAND-ELETIVO-TOTAL',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Vínculo totalmente caracterizado como mandato eletivo",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PVIN-ME': {
    sigla: 'PVIN-ME',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Vínculo de mandato eletivo, passível de comprovação (substituído por PVIN-MAND-ELETIVO-TOTAL a partir de 10/09/2025)",
    acao: "Indicador obsoleto ou descontinuado pelo INSS. Não costuma exigir tratamento para períodos recentes, mas verifique o histórico.",
    critico: true
  },
  'PVIN-OBITO': {
    sigla: 'PVIN-OBITO',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Data de admissão posterior ao óbito (substituído por PVIN-ADM-OBITO em 01/10/2024)",
    acao: "Indicador obsoleto ou descontinuado pelo INSS. Não costuma exigir tratamento para períodos recentes, mas verifique o histórico.",
    critico: true
  },
  'PVIN-RE': {
    sigla: 'PVIN-RE',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Causa de rescisão estimada por não ter sido informada pela fonte (RAIS/FGTS/GRE)",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PVIN-REC-PROC-TRAB': {
    sigla: 'PVIN-REC-PROC-TRAB',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência de Reconhecimento de Vínculo oriundo de Processo Trabalhista",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PVIN-RESP-INDIRETO-PROC-TRAB': {
    sigla: 'PVIN-RESP-INDIRETO-PROC-TRAB',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência de Reconhecimento de Vínculo informado por Responsável Indireto em Processo Trabalhista",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PVIN-SUBSTIT-INC': {
    sigla: 'PVIN-SUBSTIT-INC',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência que sinaliza inconsistência em Vínculo prevalente quando não foi possível encontrar todos os seus vínculos relacionados",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PVIN-TRAB-INTERM': {
    sigla: 'PVIN-TRAB-INTERM',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência relacionada a Vínculo que possui informações de trabalho intermitente",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PVIN-UNIC-CONTR-PROC-TRAB': {
    sigla: 'PVIN-UNIC-CONTR-PROC-TRAB',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência de Vínculo que possui Unicidade Contratual oriunda de Processo Trabalhista",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'PVIN-UNIC-CONTR-TSVE-PROC-TRAB': {
    sigla: 'PVIN-UNIC-CONTR-TSVE-PROC-TRAB',
    tipo: 'Pendência',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Pendência de Vínculo que possui Unicidade Contratual do período de TSVE oriunda de Processo Trabalhista",
    acao: "Apresentar documentos (CTPS, contratos de trabalho, recibos, guias de recolhimento pagas) para regularizar o vínculo no INSS.",
    critico: true
  },
  'IAGRUP-MN-SM-EC103': {
    sigla: 'IAGRUP-MN-SM-EC103',
    tipo: 'Informativo',
    grupo: 'AJUSTES EC103 - AGRUPAMENTO',
    descricao: "Indicador de competência objeto de agrupamento que recebeu de outra competência mas permaneceu abaixo do mínimo (favorecida)",
    acao: "Competência ajustada através de agrupamento de contribuições. Verifique se o resultado atingiu o salário mínimo.",
    critico: false
  },
  'IAGRUP-SM-EC103': {
    sigla: 'IAGRUP-SM-EC103',
    tipo: 'Informativo',
    grupo: 'AJUSTES EC103 - AGRUPAMENTO',
    descricao: "Indicador de competência objeto de agrupamento que resultou em salário de contribuição igual ao valor mínimo (favorecida)",
    acao: "Competência ajustada através de agrupamento de contribuições. Verifique se o resultado atingiu o salário mínimo.",
    critico: false
  },
  'IAGRUP-VR-EC103': {
    sigla: 'IAGRUP-VR-EC103',
    tipo: 'Informativo',
    grupo: 'AJUSTES EC103 - AGRUPAMENTO',
    descricao: "Indicador de competência objeto de agrupamento onde restou valor residual (desfavorecida)",
    acao: "Competência ajustada através de agrupamento de contribuições. Verifique se o resultado atingiu o salário mínimo.",
    critico: false
  },
  'IAGRUP-ZER-EC103': {
    sigla: 'IAGRUP-ZER-EC103',
    tipo: 'Informativo',
    grupo: 'AJUSTES EC103 - AGRUPAMENTO',
    descricao: "Indicador de competência objeto de agrupamento que restou zerada (desfavorecida)",
    acao: "Competência ajustada através de agrupamento de contribuições. Verifique se o resultado atingiu o salário mínimo.",
    critico: false
  },
  'ICOMPL-VR-SM-EC103': {
    sigla: 'ICOMPL-VR-SM-EC103',
    tipo: 'Informativo',
    grupo: 'AJUSTES EC103 - COMPLEMENTAÇÃO',
    descricao: "Indicador de competência que possui recolhimento de complementação para o valor mínimo",
    acao: "Competência ajustada por meio de recolhimento de guia complementar. Sem pendências adicionais.",
    critico: false
  },
  'IVLR-DARF-LIMITADO': {
    sigla: 'IVLR-DARF-LIMITADO',
    tipo: 'Informativo',
    grupo: 'AJUSTES EC103 - COMPLEMENTAÇÃO',
    descricao: "Valor de DARF foi limitado de forma que o valor total da competência não ultrapasse o valor do Salário Mínimo na competência",
    acao: "Competência ajustada por meio de recolhimento de guia complementar. Sem pendências adicionais.",
    critico: false
  },
  'IREL-PREV-POSSUI-COMP-AJUST': {
    sigla: 'IREL-PREV-POSSUI-COMP-AJUST',
    tipo: 'Informativo',
    grupo: 'AJUSTES EC103 - OUTROS INDICADORES',
    descricao: "Relação Previdenciária possui alguma competência que foi ajustada (favorecida/desfavorecida)",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'ICED-VR-EXC-EC103': {
    sigla: 'ICED-VR-EXC-EC103',
    tipo: 'Informativo',
    grupo: 'AJUSTES EC103 - UTILIZAÇÃO',
    descricao: "Indicador de competência que cedeu valor excedente para outra competência",
    acao: "Competência ajustada utilizando excedentes de outras remunerações. Confirme se a carência do período foi homologada.",
    critico: false
  },
  'IUTILIZ-EXC-EC103': {
    sigla: 'IUTILIZ-EXC-EC103',
    tipo: 'Informativo',
    grupo: 'AJUSTES EC103 - UTILIZAÇÃO',
    descricao: "Indicador de competência que foi favorecida por valor de remuneração(ões) excedente(s) de outra(s) competência(s)",
    acao: "Competência ajustada utilizando excedentes de outras remunerações. Confirme se a carência do período foi homologada.",
    critico: false
  },
  'IUTILIZ-EXC-MN-SM-EC103': {
    sigla: 'IUTILIZ-EXC-MN-SM-EC103',
    tipo: 'Informativo',
    grupo: 'AJUSTES EC103 - UTILIZAÇÃO',
    descricao: "Indicador de competência que foi favorecida por valor de remuneração(ões) excedente(s) de outra(s) competência(s), mas permaneceu inferior ao mínimo",
    acao: "Competência ajustada utilizando excedentes de outras remunerações. Confirme se a carência do período foi homologada.",
    critico: false
  },
  'GFIP': {
    sigla: 'GFIP',
    tipo: 'Informativo',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Indica que remuneração da competência foi declarada em GFIP",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREC-DESINDEXA': {
    sigla: 'IREC-DESINDEXA',
    tipo: 'Informativo',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Indica que a contribuição da competência foi desindexada",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREC-FBR': {
    sigla: 'IREC-FBR',
    tipo: 'Acerto',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda (L 12470/2011) validado",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREC-FBR-DEF': {
    sigla: 'IREC-FBR-DEF',
    tipo: 'Acerto',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda deferido/válido via Portal CNIS",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREC-FBR-IND': {
    sigla: 'IREC-FBR-IND',
    tipo: 'Acerto',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento de segurado Facultativo de Baixa Renda indeferido/inválido via Portal CNIS",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: true
  },
  'IREC-INDPEND': {
    sigla: 'IREC-INDPEND',
    tipo: 'Informativo',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimentos com indicadores/pendências",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREC-LC123': {
    sigla: 'IREC-LC123',
    tipo: 'Informativo',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento no Plano Simplificado de Previdência Social (LC 123/2006)",
    acao: "Contribuição reduzida (5% ou 11%). Para aposentadoria por tempo de contribuição ou CTC, será necessário complementar para a alíquota de 20%.",
    critico: true
  },
  'IREC-LC123-SUP': {
    sigla: 'IREC-LC123-SUP',
    tipo: 'Informativo',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Recolhimento no Plano Simplificado de Previdência Social (LC 123/2006) superior ao salário mínimo",
    acao: "Contribuição reduzida (5% ou 11%). Para aposentadoria por tempo de contribuição ou CTC, será necessário complementar para a alíquota de 20%.",
    critico: true
  },
  'IREC-LIM-SM': {
    sigla: 'IREC-LIM-SM',
    tipo: 'Informativo',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Indica que a contribuição da competência foi limitada ao salário mínimo",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREC-MEI': {
    sigla: 'IREC-MEI',
    tipo: 'Informativo',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Indica que a contribuição da competência foi recolhida com código MEI",
    acao: "Contribuição reduzida (5% ou 11%). Para aposentadoria por tempo de contribuição ou CTC, será necessário complementar para a alíquota de 20%.",
    critico: true
  },
  'IRECOL': {
    sigla: 'IRECOL',
    tipo: 'Informativo',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Indica que a contribuição da competência é recolhimento",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IRECOL (ILEI123)': {
    sigla: 'IRECOL (ILEI123)',
    tipo: 'Informativo',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Indica que a contribuição da competência foi recolhida com código da Lei Complementar 123",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: true
  },
  'IRECOL (IMEI)': {
    sigla: 'IRECOL (IMEI)',
    tipo: 'Informativo',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Indica que a contribuição da competência foi recolhida com código MEI",
    acao: "Contribuição reduzida (5% ou 11%). Para aposentadoria por tempo de contribuição ou CTC, será necessário complementar para a alíquota de 20%.",
    critico: true
  },
  'IREM-TSVE-PER-QUARENTENA': {
    sigla: 'IREM-TSVE-PER-QUARENTENA',
    tipo: 'Informativo',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Remuneração informada após o término do TSVE referente ao período de Quarentena (aplicação suspensa)",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'ISALMIN': {
    sigla: 'ISALMIN',
    tipo: 'Informativo',
    grupo: 'CONTRIBUIÇÕES',
    descricao: "Indica que a contribuição da competência foi limitada ao salário mínimo (Extrato PRISMA/SABI)",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IDARF-CPF-NAO-INF': {
    sigla: 'IDARF-CPF-NAO-INF',
    tipo: 'Informativo',
    grupo: 'DARF - ERROS DE PROCESSAMENTO',
    descricao: "Indicador de Darf para CPF não informado no evento",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: true
  },
  'IDARF-ESPECIE-CI-INVALIDA': {
    sigla: 'IDARF-ESPECIE-CI-INVALIDA',
    tipo: 'Informativo',
    grupo: 'DARF - ERROS DE PROCESSAMENTO',
    descricao: "Indicador de Darf para Espécie CI inválida na competência",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IDARF-EXT-SEM-ANO-CIV': {
    sigla: 'IDARF-EXT-SEM-ANO-CIV',
    tipo: 'Informativo',
    grupo: 'DARF - ERROS DE PROCESSAMENTO',
    descricao: "Indicador de Darf para a inexistência de ano civil presente na Extrato",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: true
  },
  'IDARF-FIL-CAD-DIV': {
    sigla: 'IDARF-FIL-CAD-DIV',
    tipo: 'Informativo',
    grupo: 'DARF - ERROS DE PROCESSAMENTO',
    descricao: "Indicador de DARF para filiado com dados cadastrais divergentes entre CNIS e RFB",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: true
  },
  'IDARF-FIL-NAO-ENC': {
    sigla: 'IDARF-FIL-NAO-ENC',
    tipo: 'Informativo',
    grupo: 'DARF - ERROS DE PROCESSAMENTO',
    descricao: "Indicador de Darf para filiado não encontrado no cadastro de pessoas físicas",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: true
  },
  'IDARF-SEM-EMISS-ANT': {
    sigla: 'IDARF-SEM-EMISS-ANT',
    tipo: 'Informativo',
    grupo: 'DARF - ERROS DE PROCESSAMENTO',
    descricao: "Indicador de Darf sem emissão registrada anteriormente",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IDARF-TIPOFILIADO-INVALIDO': {
    sigla: 'IDARF-TIPOFILIADO-INVALIDO',
    tipo: 'Informativo',
    grupo: 'DARF - ERROS DE PROCESSAMENTO',
    descricao: "Indicador de Darf para Tipo de Filiado inválido na competência",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IDARF-TIPOFILIADO-NAO-INFORMADO': {
    sigla: 'IDARF-TIPOFILIADO-NAO-INFORMADO',
    tipo: 'Informativo',
    grupo: 'DARF - ERROS DE PROCESSAMENTO',
    descricao: "Indicador de Darf para Tipo de Filiado não informado na competência",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IDARF-ALT-CODRECEITA': {
    sigla: 'IDARF-ALT-CODRECEITA',
    tipo: 'Informativo',
    grupo: 'DARF - EVENTOS',
    descricao: "Indicador de Darf incluído por alteração de código de receita aplicável pelo INSS por outro código também aplicável",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IDARF-ALT-COMPETENCIA': {
    sigla: 'IDARF-ALT-COMPETENCIA',
    tipo: 'Informativo',
    grupo: 'DARF - EVENTOS',
    descricao: "Indicador de Darf incluído por alteração de competência dentro do período de vigência",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IDARF-ALT-CPF': {
    sigla: 'IDARF-ALT-CPF',
    tipo: 'Informativo',
    grupo: 'DARF - EVENTOS',
    descricao: "Indicador de Darf alterado pela RFB para o CPF do titular",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IDARF-ALT-DADOS': {
    sigla: 'IDARF-ALT-DADOS',
    tipo: 'Informativo',
    grupo: 'DARF - EVENTOS',
    descricao: "Indicador de Darf incluído por alteração de dados",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IDARF-DESFAZ-CANCEL': {
    sigla: 'IDARF-DESFAZ-CANCEL',
    tipo: 'Informativo',
    grupo: 'DARF - EVENTOS',
    descricao: "Indicador de Darf com Cancelamento Desfeito",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IDARF-DESFAZ-RESTIT-PARCIAL': {
    sigla: 'IDARF-DESFAZ-RESTIT-PARCIAL',
    tipo: 'Informativo',
    grupo: 'DARF - EVENTOS',
    descricao: "Indicador de Darf com Valor Restituído Parcial Desfeito",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IDARF-DESFAZ-RESTIT-TOTAL': {
    sigla: 'IDARF-DESFAZ-RESTIT-TOTAL',
    tipo: 'Informativo',
    grupo: 'DARF - EVENTOS',
    descricao: "Indicador de Darf com Valor Restituído Total Desfeito",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'PCTC-NTR': {
    sigla: 'PCTC-NTR',
    tipo: 'Informativo',
    grupo: 'GERAIS DO NIT OU DE DADOS CADASTRAIS',
    descricao: "Certidão de Tempo de Contribuição pendente de análise do INSS",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'ISE-CVU': {
    sigla: 'ISE-CVU',
    tipo: 'Informativo',
    grupo: 'SEGURADO ESPECIAL',
    descricao: "Período de segurado especial concomitante com outro período urbano",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: true
  },
  'IDT': {
    sigla: 'IDT',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Indicador de Demanda de Natureza Trabalhista",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IEAN': {
    sigla: 'IEAN',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Exposição a agente nocivo informada pelo empregador, passível de comprovação",
    acao: "Indicação de exposição a agentes nocivos. Excelente indício para aposentadoria especial. Solicite o PPP e o LTCAT.",
    critico: false
  },
  'IREM-ACD': {
    sigla: 'IREM-ACD',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração possui parcela de Acordo, Convenção ou Dissídio Coletivo",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREM-INDPEND': {
    sigla: 'IREM-INDPEND',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remunerações com indicadores/pendência",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREM-PARC-CEDIDO': {
    sigla: 'IREM-PARC-CEDIDO',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração possui parcela de remuneração decorrente de Trabalhador Cedido",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREM-PARC-DIRSIND': {
    sigla: 'IREM-PARC-DIRSIND',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração possui parcela de remuneração decorrente de Dirigente Sindical",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREM-PERQRT': {
    sigla: 'IREM-PERQRT',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração em período de quarentena (substituído por IREM-PER-QUARENTENA e IREM-TSVE-PER-QUARENTENA)",
    acao: "Indicador obsoleto ou descontinuado pelo INSS. Não costuma exigir tratamento para períodos recentes, mas verifique o histórico.",
    critico: false
  },
  'IREM-PER-QUARENTENA': {
    sigla: 'IREM-PER-QUARENTENA',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração informada após o desligamento referente ao período de quarentena",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREM-RECL-TRAB': {
    sigla: 'IREM-RECL-TRAB',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração possui parcela de reclamatória trabalhista (substituído por IREM-VINC-PROC-TRAB)",
    acao: "Indicador obsoleto ou descontinuado pelo INSS. Não costuma exigir tratamento para períodos recentes, mas verifique o histórico.",
    critico: false
  },
  'IREM-REINTEG-PARC-PROC-TRAB': {
    sigla: 'IREM-REINTEG-PARC-PROC-TRAB',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração de período de Reintegração parcial oriunda de Processo Trabalhista",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREM-REINTEG-TOT-PROC-TRAB': {
    sigla: 'IREM-REINTEG-TOT-PROC-TRAB',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração de período de Reintegração total oriunda de Processo Trabalhista",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREM-TRAB-INTERM': {
    sigla: 'IREM-TRAB-INTERM',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração relacionada a Trabalho Intermitente",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREM-TRAB-VERDE-AMARELO': {
    sigla: 'IREM-TRAB-VERDE-AMARELO',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Indicador remunerações pertencentes ao Vínculo que possua algum período de categoria relacionada a carteira verde amarela",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IREM-VINC-PROC-TRAB': {
    sigla: 'IREM-VINC-PROC-TRAB',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Remuneração no Vínculo oriunda de Processo Trabalhista",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IVIN-AGRUP-VINC': {
    sigla: 'IVIN-AGRUP-VINC',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Indicador de Vínculo Trabalhista gerado pelo Serviço de agrupamento de vínculos",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IVIN-AGRUP-VINC-PART': {
    sigla: 'IVIN-AGRUP-VINC-PART',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Indicador que marca o vínculo que foi alvo do Serviço de agrupamento de vínculos",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IVIN-DESLIG-JUSTICA-TRAB': {
    sigla: 'IVIN-DESLIG-JUSTICA-TRAB',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Inclusão da Data de Desligamento feita pela Justiça do Trabalho por meio do Evento S-8299 do eSocial",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IVIN-JORN-DIFERENCIADA': {
    sigla: 'IVIN-JORN-DIFERENCIADA',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Vínculo possui regime de jornada diferenciada",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IVIN-MAND-ELETIVO-PARCIAL': {
    sigla: 'IVIN-MAND-ELETIVO-PARCIAL',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Vínculo parcialmente caracterizado como mandato eletivo",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: true
  },
  'IVIN-POSSUI-REG-PRELIM': {
    sigla: 'IVIN-POSSUI-REG-PRELIM',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Indicador que informa que a Relação Trabalhista possui um registro preliminar informado anteriormente em eSocial",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IVIN-POSSUI-REM-TRAB-INTERM': {
    sigla: 'IVIN-POSSUI-REM-TRAB-INTERM',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Relação Trabalhista possui Remunerações de Trabalho Intermitente",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IVIN-POSSUI-REM-TRANS': {
    sigla: 'IVIN-POSSUI-REM-TRANS',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Vínculo possui remuneração que foi transferida para este por Cessionário de Dirigente Sindical ou Trabalhador Cedido",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IVIN-PROC-TRAB': {
    sigla: 'IVIN-PROC-TRAB',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Vínculo possui Processo Trabalhista",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IVIN-REG-PRELIM': {
    sigla: 'IVIN-REG-PRELIM',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Indicador que informa que a Relação Trabalhista é um registro preliminar de vínculo informado eSocial",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: true
  },
  'IVIN-REINTEG': {
    sigla: 'IVIN-REINTEG',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Vínculo possui reintegração no último desligamento (substituído por IVIN-REINTEG-PROC-TRAB e IVIN-REINTEG-SERV-PUBLICO)",
    acao: "Indicador obsoleto ou descontinuado pelo INSS. Não costuma exigir tratamento para períodos recentes, mas verifique o histórico.",
    critico: false
  },
  'IVIN-REINTEG-ANISTIA': {
    sigla: 'IVIN-REINTEG-ANISTIA',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Indicador de Reintegração por Anistia Legal",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'IVIN-REINTEG-OUTROSTIPOS': {
    sigla: 'IVIN-REINTEG-OUTROSTIPOS',
    tipo: 'Informativo',
    grupo: 'VÍNCULOS E REMUNERAÇÕES',
    descricao: "Vínculo possui reintegração no último desligamento por iniciativa do empregador ou por outros motivos",
    acao: "Indicador informativo. Enquadramento específico ou processamento já concluído. Geralmente não impede o direito.",
    critico: false
  },
  'BLOQ-EC103': {
    sigla: 'BLOQ-EC103',
    tipo: 'Pendência',
    grupo: 'AJUSTES EC103 - OUTROS INDICADORES',
    descricao: 'Remuneração pós-vínculo com bloqueio por competência posterior à EC 103/2019. Indica que o salário da competência não deve ser considerado para cálculo.',
    acao: 'Competência bloqueada. Verificar se a remuneração foi informada indevidamente ou se há necessidade de ajuste manual no cálculo.',
    critico: true
  },
  'NB': {
    sigla: 'NB',
    tipo: 'Informativo',
    grupo: 'BENEFÍCIO',
    descricao: 'Indica que a competência integrou o cálculo de um Número de Benefício (NB) já concedido pelo INSS, como aposentadoria, pensão ou auxílio.',
    acao: 'Indicador informativo. A competência já foi utilizada para concessão de benefício. Verifique se o NB correspondente consta no sistema.',
    critico: false
  },
}

export function getIndicatorDetails(sigla: string): IndicatorInfo {
  const cleanSigla = sigla.trim().toUpperCase()

  if (CNIS_INDICATORS[cleanSigla]) {
    return CNIS_INDICATORS[cleanSigla]
  }

  const baseKey = Object.keys(CNIS_INDICATORS).find(key => cleanSigla.startsWith(key))
  if (baseKey) {
    return {
      ...CNIS_INDICATORS[baseKey],
      sigla: cleanSigla
    }
  }

  return {
    sigla: cleanSigla,
    tipo: 'Outro',
    grupo: 'INDICADOR GERAL',
    descricao: 'Indicador de situação ou pendência no CNIS.',
    acao: 'Verifique a descrição deste indicador nas orientações gerais do INSS ou solicite esclarecimentos na agência da previdência social.',
    critico: false
  }
}
