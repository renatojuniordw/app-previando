const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export async function validatePDFUpload(buffer: Buffer, fileName: string, mimeType: string): Promise<void> {
  if (mimeType !== 'application/pdf') {
    throw new Error('Apenas arquivos PDF são aceitos.')
  }

  if (buffer.byteLength > MAX_SIZE_BYTES) {
    throw new Error('Tamanho máximo permitido: 10MB.')
  }

  // Verifica magic bytes: todo PDF começa com %PDF-
  const header = buffer.slice(0, 5).toString('ascii')
  if (!header.startsWith('%PDF-')) {
    throw new Error('Arquivo não é um PDF válido.')
  }

  if (!fileName.toLowerCase().endsWith('.pdf')) {
    throw new Error('Extensão do arquivo deve ser .pdf.')
  }
}
