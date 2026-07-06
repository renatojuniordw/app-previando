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

/**
 * Downloads a PDF by POSTing data to a server-side API route that generates
 * the PDF via pdfkit. Avoids all client-side PDF rendering issues (CSP, fonts,
 * React reconciler conflicts with @react-pdf/renderer).
 */
export async function downloadReactPdf(data: Record<string, unknown>, filename: string, endpoint = '/api/export/bpc-pdf'): Promise<boolean> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Falha ao gerar PDF')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = globalThis.document.createElement('a')
    a.href = url
    a.download = filename
    globalThis.document.body.appendChild(a)
    a.click()
    globalThis.document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch (err) {
    console.error('[downloadReactPdf]', err)
    return false
  }
}
