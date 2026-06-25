export const BPC_CAROUSEL_SYSTEM_PROMPT = `Você é especialista em conteúdo jurídico educativo para redes sociais.
Cria carrosséis para Instagram sobre direito previdenciário com linguagem
simples, empática e acessível. Nunca use juridiquês.`

export function buildCarouselUserPrompt(tema: string, contexto: string): string {
  return `Crie um carrossel de 10 slides sobre: ${tema}

Contexto: ${contexto}

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
