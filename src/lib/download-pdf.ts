/**
 * Downloads a PDF from the API route using fetch + blob URL,
 * avoiding window.open which can be blocked by browsers.
 * Returns true on success, false on failure.
 */
export async function downloadPdf(caseId: string | string[], filename?: string): Promise<boolean> {
  const id = Array.isArray(caseId) ? caseId[0] : caseId
  try {
    const res = await fetch(`/api/export/pdf/${id}`)
    if (!res.ok) throw new Error('Falha ao gerar PDF')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `previando-caso-${id}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch {
    window.open(`/api/export/pdf/${id}`, '_blank')
    return false
  }
}
