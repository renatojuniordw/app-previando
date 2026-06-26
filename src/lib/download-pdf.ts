/**
 * Downloads a PDF from the API route using fetch + blob URL,
 * avoiding window.open which can be blocked by browsers.
 */
export async function downloadPdf(caseId: string, filename?: string) {
  try {
    const res = await fetch(`/api/export/pdf/${caseId}`)
    if (!res.ok) throw new Error('Falha ao gerar PDF')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `previando-caso-${caseId}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    // Fallback: open in new tab
    window.open(`/api/export/pdf/${caseId}`, '_blank')
  }
}
