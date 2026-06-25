import { getOpenAI } from '@/lib/openai'
import { sanitizeForAI } from '@/lib/sanitize'
import { BPC_PRE_ANALYSIS_SYSTEM_PROMPT, buildPreAnalysisUserPrompt } from '@/lib/prompts/bpc/pre-analysis'
import { BPC_LAUDO_SYSTEM_PROMPT, buildLaudoAnalysisUserPrompt } from '@/lib/prompts/bpc/laudo-analysis'
import { BPC_SOCIAL_QUESTIONS_SYSTEM_PROMPT, BPC_MEDICAL_QUESTIONS_SYSTEM_PROMPT, buildSocialQuestionsUserPrompt, buildMedicalQuestionsUserPrompt } from '@/lib/prompts/bpc/questions'
import { BPC_CHECKLIST_SYSTEM_PROMPT, buildChecklistUserPrompt } from '@/lib/prompts/bpc/checklist'
import { BPC_CAROUSEL_SYSTEM_PROMPT, buildCarouselUserPrompt } from '@/lib/prompts/bpc/carousel'

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

  const userPrompt = buildPreAnalysisUserPrompt({
    patologia: p,
    cid: c,
    idade,
    faixaEtaria,
    rendaFamiliar,
    membrosGrupo,
    rendaPerCapita,
    barreiras: b,
    resumoLaudos: r,
  })

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 3000,
    messages: [
      { role: 'system', content: BPC_PRE_ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  })

  return response.choices[0].message.content ?? 'Não foi possível gerar a análise.'
}

export async function analisarLaudo(laudo: string, params: BpcAnalysisParams): Promise<string> {
  const { patologia, faixaEtaria } = params
  const p = s(patologia, 500)
  const l = s(laudo, 5000)

  const userPrompt = buildLaudoAnalysisUserPrompt({
    patologia: p,
    faixaEtaria,
    laudo: l,
  })

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 3000,
    messages: [
      { role: 'system', content: BPC_LAUDO_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  })

  return response.choices[0].message.content ?? 'Não foi possível analisar o laudo.'
}

export async function gerarPerguntasSocial(params: BpcAnalysisParams): Promise<string> {
  const { patologia, cid, idade, faixaEtaria, barreirasRelatadas } = params
  const p = s(patologia, 500)
  const c = s(cid, 50)
  const b = s(barreirasRelatadas, 3000)

  const userPrompt = buildSocialQuestionsUserPrompt({
    patologia: p,
    cid: c,
    idade,
    faixaEtaria,
    barreiras: b,
  })

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 3000,
    messages: [
      { role: 'system', content: BPC_SOCIAL_QUESTIONS_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  })

  return response.choices[0].message.content ?? 'Não foi possível gerar as perguntas.'
}

export async function gerarPerguntasMedicas(params: BpcAnalysisParams): Promise<string> {
  const { patologia, cid, idade, faixaEtaria, barreirasRelatadas, resumoLaudos } = params
  const p = s(patologia, 500)
  const c = s(cid, 50)
  const b = s(barreirasRelatadas, 3000)
  const r = s(resumoLaudos, 3000)

  const userPrompt = buildMedicalQuestionsUserPrompt({
    patologia: p,
    cid: c,
    idade,
    faixaEtaria,
    barreiras: b,
    resumoLaudos: r,
  })

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 3000,
    messages: [
      { role: 'system', content: BPC_MEDICAL_QUESTIONS_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  })

  return response.choices[0].message.content ?? 'Não foi possível gerar as perguntas.'
}

export async function gerarChecklist(params: BpcAnalysisParams): Promise<string> {
  const { patologia, cid, faixaEtaria } = params
  const p = s(patologia, 500)
  const c = s(cid, 50)

  const userPrompt = buildChecklistUserPrompt({
    patologia: p,
    cid: c,
    faixaEtaria,
  })

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 1500,
    messages: [
      { role: 'system', content: BPC_CHECKLIST_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  })

  return response.choices[0].message.content ?? 'Não foi possível gerar o checklist.'
}

export async function gerarCarrossel(tema: string, contexto: string): Promise<string> {
  const t = s(tema, 500)
  const ctx = s(contexto, 3000)

  const userPrompt = buildCarouselUserPrompt(t, ctx)

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.5,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: BPC_CAROUSEL_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  })

  return response.choices[0].message.content ?? 'Não foi possível gerar o carrossel.'
}
