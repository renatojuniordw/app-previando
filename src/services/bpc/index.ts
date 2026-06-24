import { getOpenAI } from '@/lib/openai'
import { sanitizeForAI } from '@/lib/sanitize'

function s(input: string | undefined, maxLen: number = 3000): string {
  return sanitizeForAI(input ?? '', maxLen)
}

export interface BpcAnalysisParams {
  patologia: string
  cid?: string
  idade: number
  faixaEtaria: 'MENOR_16' | 'MAIOR_16'
  rendaFamiliar: number
  membrosGrupo: number
  rendaPerCapita: number
  barreirasRelatadas: string
  resumoLaudos?: string
}

const CRITERIOS_LEGAIS = `
Critérios legais para concessão do BPC/LOAS:
1. Renda familiar per capita ≤ 1/4 do salário mínimo
2. Impedimento de longo prazo (mínimo 2 anos) que obstrua a participação plena na sociedade
3. Avaliação biopsicossocial baseada na Portaria Conjunta MDS/INSS nº 2/2015 e modelo CIF
`

function faixaLabel(faixa: 'MENOR_16' | 'MAIOR_16'): string {
  return faixa === 'MENOR_16'
    ? 'Menor de 16 anos — foco em casa, escola, apoio familiar, desenvolvimento'
    : 'Maior de 16 anos — foco em trabalho, autonomia, vida comunitária, atividades diárias'
}

export async function gerarPreAnalise(params: BpcAnalysisParams): Promise<string> {
  const { patologia, cid, idade, faixaEtaria, rendaFamiliar, membrosGrupo, rendaPerCapita, barreirasRelatadas, resumoLaudos } = params
  const p = s(patologia, 500)
  const c = s(cid, 50)
  const b = s(barreirasRelatadas, 3000)
  const r = s(resumoLaudos, 3000)

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 3000,
    messages: [
      {
        role: 'system',
        content: `Você é um especialista em direito previdenciário brasileiro com foco em BPC/LOAS.
Analisa casos com base na Portaria Conjunta MDS/INSS nº 2/2015 e no modelo
biopsicossocial da CIF. Seja técnico, objetivo e direto.
Nunca invente informações — use apenas o que foi fornecido.
Se dados insuficientes, aponte explicitamente o que falta.

${CRITERIOS_LEGAIS}`
      },
      {
        role: 'user',
        content: `Analise a viabilidade deste caso de BPC/LOAS:

Patologia: ${p} | CID: ${c || 'N/A'}
Idade: ${idade} anos | Faixa: ${faixaLabel(faixaEtaria)}
Renda familiar: R$ ${rendaFamiliar.toFixed(2)} | Membros: ${membrosGrupo}
Renda per capita: R$ ${rendaPerCapita.toFixed(2)}

Barreiras relatadas:
${b}

Resumo dos laudos:
${r || 'Não informado'}

Avalie:
1. Se o caso preenche os critérios legais (renda + impedimento longo prazo)
2. Pontos positivos identificados
3. Pontos críticos ou frágeis
4. Sugestões para robustecer a prova social e médica
5. Lacunas documentais que precisam ser corrigidas
6. Feedback final: viável, frágil ou inviável — com justificativa técnica

Base: Portaria nº 2/2015, modelo biopsicossocial CIF.`
      }
    ]
  })

  return response.choices[0].message.content ?? 'Não foi possível gerar a análise.'
}

export async function analisarLaudo(laudo: string, params: BpcAnalysisParams): Promise<string> {
  const { patologia, faixaEtaria } = params
  const p = s(patologia, 500)
  const l = s(laudo, 5000)

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 3000,
    messages: [
      {
        role: 'system',
        content: `Você é um especialista em análise de documentação médica para fins de BPC/LOAS.
Avalia laudos com base na Portaria nº 2/2015 e na CIF.
Seja direto. Aponte o que está bom e o que está ruim sem enrolação.`
      },
      {
        role: 'user',
        content: `Analise este laudo médico para fins de BPC/LOAS:

Patologia: ${p} | Faixa etária: ${faixaLabel(faixaEtaria)}

LAUDO:
${l}

Avalie:
1. O laudo descreve impedimento de longo prazo? (mínimo 2 anos)
2. Há descrição funcional suficiente das limitações?
3. O conteúdo é compatível com os critérios da CIF?
4. A linguagem é compatível com a Portaria nº 2/2015?
5. Há coerência entre medicação prescrita e gravidade do quadro?
6. Menciona barreiras, necessidade de terceiros ou risco social?
7. Pontos positivos e negativos (objetivo e direto)
8. O laudo sustenta o pedido ou precisa de complementação?
9. Como seria o laudo ideal para este caso? (estrutura, conteúdos mínimos)

Classificação final: APTO | PARCIALMENTE APTO | INAPTO — com justificativa.`
      }
    ]
  })

  return response.choices[0].message.content ?? 'Não foi possível analisar o laudo.'
}

export async function gerarPerguntasSocial(params: BpcAnalysisParams): Promise<string> {
  const { patologia, cid, idade, faixaEtaria, barreirasRelatadas } = params
  const p = s(patologia, 500)
  const c = s(cid, 50)
  const b = s(barreirasRelatadas, 3000)

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 3000,
    messages: [
      {
        role: 'system',
        content: `Você é especialista em avaliação social previdenciária com base na Portaria
nº 2/2015. Gera perguntas técnicas estruturadas por domínio da CIF para
orientar o advogado sobre o que explorar com o cliente antes da avaliação social.
As perguntas são para o ADVOGADO usar ao preparar o cliente — não são scripts
para o cliente decorar respostas.`
      },
      {
        role: 'user',
        content: `Gere perguntas técnicas para a Avaliação Social deste caso de BPC/LOAS:

Patologia: ${p} | CID: ${c || 'N/A'} | Idade: ${idade} | Faixa: ${faixaLabel(faixaEtaria)}
Barreiras: ${b}

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

Adapte às especificidades da faixa etária: ${faixaEtaria}`
      }
    ]
  })

  return response.choices[0].message.content ?? 'Não foi possível gerar as perguntas.'
}

export async function gerarPerguntasMedicas(params: BpcAnalysisParams): Promise<string> {
  const { patologia, cid, idade, faixaEtaria, barreirasRelatadas, resumoLaudos } = params
  const p = s(patologia, 500)
  const c = s(cid, 50)
  const b = s(barreirasRelatadas, 3000)
  const r = s(resumoLaudos, 3000)

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 3000,
    messages: [
      {
        role: 'system',
        content: `Você é especialista em perícia médica previdenciária com base na Portaria
nº 2/2015 e na CIF. Gera orientações técnicas para o advogado preparar a
perícia médica. As perguntas são para o ADVOGADO entender o que o perito
vai avaliar — não são scripts para o cliente.`
      },
      {
        role: 'user',
        content: `Gere orientações técnicas para a Perícia Médica deste caso:

Patologia: ${p} | CID: ${c || 'N/A'} | Idade: ${idade} | Faixa: ${faixaLabel(faixaEtaria)}
Barreiras: ${b}
Laudos: ${r || 'Não informado'}

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

Adapte para faixa etária: ${faixaEtaria}`
      }
    ]
  })

  return response.choices[0].message.content ?? 'Não foi possível gerar as perguntas.'
}

export async function gerarChecklist(params: BpcAnalysisParams): Promise<string> {
  const { patologia, cid, faixaEtaria } = params
  const p = s(patologia, 500)
  const c = s(cid, 50)

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 1500,
    messages: [
      {
        role: 'system',
        content: `Gere um checklist objetivo de documentos necessários para instruir
pedido de BPC/LOAS, adaptado à patologia e ao contexto do caso.`
      },
      {
        role: 'user',
        content: `Gere checklist de documentação para BPC/LOAS:

Patologia: ${p} | CID: ${c || 'N/A'} | Faixa: ${faixaLabel(faixaEtaria)}

Liste:
1. Documentos obrigatórios (sem eles o pedido não prospera)
2. Documentos recomendados (fortalecem o caso)
3. Documentos opcionais (podem ajudar em casos específicos)
4. Documentos que frequentemente estão incompletos nesta patologia
5. O que verificar em cada documento antes de juntar ao processo

Formato: lista objetiva, sem enrolação.`
      }
    ]
  })

  return response.choices[0].message.content ?? 'Não foi possível gerar o checklist.'
}

export async function gerarCarrossel(tema: string, contexto: string): Promise<string> {
  const t = s(tema, 500)
  const ctx = s(contexto, 3000)

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.5,
    max_tokens: 2000,
    messages: [
      {
        role: 'system',
        content: `Você é especialista em conteúdo jurídico educativo para redes sociais.
Cria carrosséis para Instagram sobre direito previdenciário com linguagem
simples, empática e acessível. Nunca use juridiquês.`
      },
      {
        role: 'user',
        content: `Crie um carrossel de 10 slides sobre: ${t}

Contexto: ${ctx}

Estrutura obrigatória:
1. Hook (afirmativo, impactante — sem perguntas)
2. Introdução ao problema
3. O contraste
4. O diagnóstico
5. O vilão (barreira principal)
6. A mudança de perspectiva
7. A lição principal
8. Exemplos práticos
9. A oportunidade
10. Call to Action (sem emojis)

Regras:
- Linguagem simples, empática, sem juridiquês
- Sem perguntas no slide 1 e no slide 10
- Emojis apenas em listas comparativas ✅/❌ (máx. 2 slides)
- Objetivo: gerar confiança e identificação — não vender diretamente`
      }
    ]
  })

  return response.choices[0].message.content ?? 'Não foi possível gerar o carrossel.'
}
