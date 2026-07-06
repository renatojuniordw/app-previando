'use client'

import { useRef, useState } from 'react'
import api from '@/lib/api'
import { useToast } from '@/store/toast'

/**
 * O CNIS pertence ao cliente (1 por segurado) — upload é sempre feito por clientId.
 */
export function useCnisUpload(clientId: string, onUploaded: () => void) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  const uploadFile = async (file: File) => {
    if (!clientId) {
      setUploadError('Cliente ainda não identificado. Aguarde o carregamento da página.')
      return
    }
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setUploadError('Apenas arquivos PDF são aceitos.')
      return
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clientId', clientId)
      await api.post('/cnis/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      addToast({ type: 'info', title: 'CNIS enviado', message: 'Processando extrato do segurado...' })
      await onUploaded()
    } catch (err: unknown) {
      setUploadError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao enviar CNIS.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  return { uploading, uploadError, isDragging, fileRef, handleUpload, handleDragOver, handleDragLeave, handleDrop }
}
