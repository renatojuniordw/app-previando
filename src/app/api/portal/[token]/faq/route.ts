import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'
import { hashPortalToken } from '@/lib/portal-session'
import { openai } from '@/lib/openai'
import { AI_MODELS } from '@/lib/ai-models'
import { redis } from '@/lib/redis'
import { PORTAL_FAQ_SYSTEM_PROMPT, buildFaqUserPrompt } from '@/lib/prompts/portal/faq'
import { getModalityLabel } from '@/lib/modalidade-labels'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const access = await prisma.clientAccess.findUnique({
      where: { tokenHash: hashPortalToken(params.token) },
      include: {
        case: {
          include: {
            client: { select: { birthDate: true } },
            calculations: {
              where: { isSelected: true },
              orderBy: { rmi: 'desc' },
              take: 1,
              select: { modality: true, rmi: true, eligible: true },
            },
          },
        },
      },
    })

    if (!access || access.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Acesso não encontrado ou expirado.' }, { status: 404 })
    }

    const c = access.case

    const cacheKey = `portal:faq:${params.token}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      return NextResponse.json({ faqs: JSON.parse(cached) })
    }

    const bestCalc = c.calculations[0]
    const clientAge = c.client.birthDate
      ? Math.floor((Date.now() - new Date(c.client.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined

    const userPrompt = buildFaqUserPrompt({
      benefitType: c.benefitType,
      modalityLabel: bestCalc ? getModalityLabel(bestCalc.modality) : undefined,
      clientAge,
      eligible: bestCalc?.eligible ?? false,
      rmi: bestCalc ? Number(bestCalc.rmi) : undefined,
    })

    const completion = await openai.chat.completions.create({
      model: AI_MODELS.OPERATIONAL,
      messages: [
        { role: 'system', content: PORTAL_FAQ_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'Erro ao gerar FAQ.' }, { status: 500 })
    }

    const parsed = JSON.parse(content)
    const faqs = parsed.faqs || parsed

    await redis.set(cacheKey, JSON.stringify(faqs), 'EX', 86400)

    return NextResponse.json({ faqs })
  } catch (err) {
    return handleApiError(err)
  }
}
