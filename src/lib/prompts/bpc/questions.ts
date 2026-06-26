export const BPC_SOCIAL_QUESTIONS_SYSTEM_PROMPT = `Você é especialista em avaliação social previdenciária com base na Portaria nº 2/2015. Gera perguntas técnicas estruturadas por domínio da CIF para orientar o advogado durante a entrevista com o cliente. Responda SEMPRE com JSON válido, sem texto fora do JSON, seguindo exatamente o schema fornecido.`

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

  return `Gere perguntas para roteiro de entrevista social (BPC/LOAS) para este caso:

Patologia: ${params.patologia} | CID: ${params.cid || 'N/A'} | Idade: ${params.idade} | Faixa: ${faixaLabel}
Barreiras relatadas: ${params.barreiras}

Retorne JSON com exatamente este schema:
{
  "dominios": [
    {
      "id": "string único snake_case",
      "categoria": "I. FATORES AMBIENTAIS" ou "II. ATIVIDADES E PARTICIPAÇÃO",
      "titulo": "a) Nome do Domínio",
      "aspectosRelevantes": "O que tende a ser mais crítico para esta patologia neste domínio",
      "lacunas": "O que o advogado deve investigar com atenção",
      "perguntas": ["pergunta 1", "pergunta 2", ...]
    }
  ]
}

Crie exatamente 9 domínios, nesta ordem:
1. id: "fatores_produtos_tecnologia" | categoria: "I. FATORES AMBIENTAIS" | titulo: "a) Produtos e Tecnologia"
2. id: "fatores_habitabilidade" | categoria: "I. FATORES AMBIENTAIS" | titulo: "b) Condições de Habitabilidade"
3. id: "fatores_apoio_relacionamentos" | categoria: "I. FATORES AMBIENTAIS" | titulo: "c) Apoio e Relacionamentos"
4. id: "fatores_atitudes" | categoria: "I. FATORES AMBIENTAIS" | titulo: "d) Atitudes e Estigma"
5. id: "fatores_servicos" | categoria: "I. FATORES AMBIENTAIS" | titulo: "e) Serviços, Sistemas e Políticas"
6. id: "participacao_vida_domestica" | categoria: "II. ATIVIDADES E PARTICIPAÇÃO" | titulo: "a) Vida Doméstica"
7. id: "participacao_relacoes" | categoria: "II. ATIVIDADES E PARTICIPAÇÃO" | titulo: "b) Relações e Interações"
8. id: "participacao_areas_principais" | categoria: "II. ATIVIDADES E PARTICIPAÇÃO" | titulo: "c) Áreas Principais da Vida"
9. id: "participacao_vida_comunitaria" | categoria: "II. ATIVIDADES E PARTICIPAÇÃO" | titulo: "d) Vida Comunitária e Cívica"

Regras:
- Mínimo 6 perguntas por domínio, máximo 10
- Perguntas abertas e específicas para a patologia "${params.patologia}"
- Adapte para faixa etária: ${faixaLabel}
- aspectosRelevantes e lacunas devem ser concisos (1-2 frases)`
}

export function buildMedicalQuestionsUserPrompt(params: {
  patologia: string
  cid?: string
  idade: number
  faixaEtaria: string
  barreiras: string
  resumoLaudos?: string
  relatoSocial?: string
}): string {
  const faixaLabel = params.faixaEtaria === 'MENOR_16'
    ? 'Menor de 16 anos — foco em casa, escola, apoio familiar, desenvolvimento'
    : 'Maior de 16 anos — foco em trabalho, autonomia, vida comunitária, atividades diárias'

  const relatoSection = params.relatoSocial?.trim()
    ? `\nRELATO DA ENTREVISTA SOCIAL (coletado pelo advogado):\n${params.relatoSocial}\n`
    : ''

  return `Gere orientações técnicas para a Perícia Médica deste caso:

Patologia: ${params.patologia} | CID: ${params.cid || 'N/A'} | Idade: ${params.idade} | Faixa: ${faixaLabel}
Barreiras: ${params.barreiras}
Laudos: ${params.resumoLaudos || 'Não informado'}
${relatoSection}

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
