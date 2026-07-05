import { describe, it, expect } from 'vitest'
import { validatePDFUpload } from '@/lib/upload-validator'

describe('validatePDFUpload', () => {
  it('aceita PDF válido', async () => {
    const buffer = Buffer.from('%PDF-1.4 rest of content')
    await expect(validatePDFUpload(buffer, 'doc.pdf', 'application/pdf')).resolves.toBeUndefined()
  })

  it('rejeita MIME type inválido', async () => {
    const buffer = Buffer.from('%PDF-1.4')
    await expect(validatePDFUpload(buffer, 'doc.pdf', 'image/png')).rejects.toThrow('Apenas arquivos PDF são aceitos.')
  })

  it('rejeita arquivo maior que 10MB', async () => {
    const buffer = Buffer.alloc(10 * 1024 * 1024 + 1, 0)
    buffer.write('%PDF-')
    await expect(validatePDFUpload(buffer, 'doc.pdf', 'application/pdf')).rejects.toThrow('Tamanho máximo permitido: 10MB.')
  })

  it('rejeita arquivo sem magic bytes PDF', async () => {
    const buffer = Buffer.from('NOT A PDF content')
    await expect(validatePDFUpload(buffer, 'doc.pdf', 'application/pdf')).rejects.toThrow('Arquivo não é um PDF válido.')
  })

  it('rejeita extensão não .pdf', async () => {
    const buffer = Buffer.from('%PDF-1.4 content')
    await expect(validatePDFUpload(buffer, 'doc.txt', 'application/pdf')).rejects.toThrow('Extensão do arquivo deve ser .pdf.')
  })

  it('aceita exatamente 10MB', async () => {
    const buffer = Buffer.alloc(10 * 1024 * 1024, 0)
    buffer.write('%PDF-')
    await expect(validatePDFUpload(buffer, 'doc.pdf', 'application/pdf')).resolves.toBeUndefined()
  })

  it('rejeita extensão .PDF em maiúsculas', async () => {
    const buffer = Buffer.from('%PDF-1.4 content')
    await expect(validatePDFUpload(buffer, 'doc.PDF', 'application/pdf')).resolves.toBeUndefined()
  })
})
