export const BPC_SOCIAL_QUESTIONS_SYSTEM_PROMPT = `Você é especialista em avaliação social previdenciária com base na Portaria
nº 2/2015. Gera perguntas técnicas estruturadas por domínio da CIF para
orientar o advogado sobre o que explorar com o cliente antes da avaliação social.
As perguntas são para o ADVOGADO usar ao preparar o cliente — não são scripts
para o cliente decorar respostas.`

export const BPC_MEDICAL_QUESTIONS_SYSTEM_PROMPT = `Você é especialista em perícia médica previdenciária com base na Portaria
nº 2/2015 e na CIF. Gera orientações técnicas para o advogado preparar a
perícia médica. As perguntas são para o ADVOGADO entender o que o perito
vai avaliar — não são scripts para o cliente.`

export function buildSocialQuestionsUserPrompt(params: {
  patologia: string
  cid?: string
  idade: number
  faixaEtaria: string
  barreiras: string
}): string {
  const faixaLabel = params.faixaEtaria === 'MENOR_16'
    ? 'Menor de 16 anos — foco em casa, escola, apoio familiar, desenvolvimento'
    : 'Maior de 16 anos — foco em trabalho, autonomia, vida comunitária, atividades diárias'

  return `Gere perguntas técnicas para a Avaliação Social deste caso de BPC/LOAS:

Patologia: ${params.patologia} | CID: ${params.cid || 'N/A'} | Idade: ${params.idade} | Faixa: ${faixaLabel}
Barreiras: ${params.barreiras}

Gere no mínimo 8 perguntas por domínio, estruturadas assim:

I. FATORES AMBIENTAIS:
  a) Produtos e Tecnologia
  b) Condições de Habitabilidade e Mudanças Ambientais
  c) Apoio e Relacionamentos
  d) Atitudes (preconceito, estigma)
  e) Serviços, Sistemas e Políticas

II. ATIVIDADES E PARTICIPAÇÃO:
  a) Vida Doméstica
  b) Relações e Interações Interpessoais
  c) Áreas Principais da Vida (escola/trabalho)
  d) Vida Comunitária, Social e Cívica

Para cada domínio:
- Liste as perguntas que o advogado deve explorar
- Indique quais aspectos tendem a ser mais relevantes para esta patologia
- Aponte lacunas de informação se houver

Adapte às especificidades da faixa etária: ${params.faixaEtaria}`
}

export function buildMedicalQuestionsUserPrompt(params: {
  patologia: string
  cid?: string
  idade: number
  faixaEtaria: string
  barreiras: string
  resumoLaudos?: string
}): string {
  const faixaLabel = params.faixaEtaria === 'MENOR_16'
    ? 'Menor de 16 anos — foco em casa, escola, apoio familiar, desenvolvimento'
    : 'Maior de 16 anos — foco em trabalho, autonomia, vida comunitária, atividades diárias'

  return `Gere orientações técnicas para a Perícia Médica deste caso:

Patologia: ${params.patologia} | CID: ${params.cid || 'N/A'} | Idade: ${params.idade} | Faixa: ${faixaLabel}
Barreiras: ${params.barreiras}
Laudos: ${params.resumoLaudos || 'Não informado'}

Gere entre 20 e 25 perguntas técnicas que o perito tende a fazer,
cobrindo obrigatoriamente:

FUNÇÕES DO CORPO (conforme patologia):
- Funções mentais: sono, intelectuais, temperamento, atenção, memória, percepção
- Funções neurológicas: consciência, orientação, controle motor, convulsões
- Funções neuromusculoesqueléticas: força, tônus, amplitude, marcha, dor
- Funções sensoriais: acuidade visual, campo visual, sensibilidade à luz

ATIVIDADES E PARTICIPAÇÃO (responsabilidade do perito):
  a) Aprendizagem e Aplicação do Conhecimento
  b) Tarefas e Demandas Gerais
  c) Comunicação
  d) Mobilidade
  e) Cuidado Pessoal

Para cada grupo:
- Aponte o que o perito tende a focar nesta patologia
- Indique quais documentos complementares fortalecem cada aspecto
- Sinalize inconsistências comuns entre queixa e achados clínicos

Adapte para faixa etária: ${params.faixaEtaria}`
}
