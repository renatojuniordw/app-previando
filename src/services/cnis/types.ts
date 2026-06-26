export interface CnisExtractedData {
  nit?: string | null
  nome?: string | null
  dataNascimento?: string | null
  totalContribuicoes?: number | null
  primeiraContribuicao?: string | null
  ultimaContribuicao?: string | null
  periodos?: Array<{
    empregador: string | null
    inicio: string | null
    fim: string | null
    indicadores?: Array<string>
    salarios: Array<{ competencia: string; valor: number; indicadores?: Array<string> }>
    gaps: Array<string>
  }>
}

export function generateMarkdown(data: CnisExtractedData): string {
  let md = `# CNIS - ${data.nome ?? 'Segurado'}\n\n`
  md += `- **NIT**: ${data.nit ?? 'N/A'}\n`
  md += `- **Nascimento**: ${data.dataNascimento ?? 'N/A'}\n`
  md += `- **Primeira contribuição**: ${data.primeiraContribuicao ?? 'N/A'}\n`
  md += `- **Última contribuição**: ${data.ultimaContribuicao ?? 'N/A'}\n`
  md += `- **Total de competências**: ${data.totalContribuicoes ?? 'N/A'}\n\n`

  if (data.periodos?.length) {
    md += '## Períodos\n\n'
    for (const p of data.periodos) {
      const count = p.salarios?.length ?? 0
      const gapCount = p.gaps?.length ?? 0
      const gapNote = gapCount > 0 ? ` — **${gapCount} gap(s)**: ${p.gaps.join(', ')}` : ''
      const indNote = p.indicadores?.length ? ` [Indicadores: ${p.indicadores.join(', ')}]` : ''
      md += `- **${p.empregador ?? 'Empregador não identificado'}**: ${p.inicio ?? '?'} → ${p.fim ?? 'Ativo'} (${count} competências${gapNote})${indNote}\n`
    }
  }

  return md
}
