'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { useToast } from '@/store/toast'
import { CnisData, CnisExtractedData, Periodo } from '@/types/cnis'

export function useCnisEditing(cnis: CnisData | null, setCnis: (doc: CnisData) => void) {
  const { addToast } = useToast()

  const [tempExtractedData, setTempExtractedData] = useState<CnisExtractedData | null>(null)
  const [isModified, setIsModified] = useState(false)

  // Period edit modal
  const [showEditPeriodModal, setShowEditPeriodModal] = useState(false)
  const [editingPeriodIndex, setEditingPeriodIndex] = useState<number | null>(null)
  const [editEmpregador, setEditEmpregador] = useState('')
  const [editInicio, setEditInicio] = useState('')
  const [editFim, setEditFim] = useState('')
  const [editIsCurrent, setEditIsCurrent] = useState(false)

  // Salary edit modal
  const [showEditSalariesModal, setShowEditSalariesModal] = useState(false)
  const [editingSalariesIndex, setEditingSalariesIndex] = useState<number | null>(null)
  const [editSalarios, setEditSalarios] = useState<Array<{ competencia: string; valor: number }>>([])
  const [newCompetencia, setNewCompetencia] = useState('')
  const [newValor, setNewValor] = useState('')

  // Save confirm modal
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false)
  const [savingData, setSavingData] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (cnis?.extractedData) {
      setTempExtractedData(cnis.extractedData as unknown as CnisExtractedData)
      setIsModified(false)
    } else {
      setTempExtractedData(null)
      setIsModified(false)
    }
  }, [cnis])

  const discardChanges = () => {
    if (cnis?.extractedData) {
      setTempExtractedData(cnis.extractedData as unknown as CnisExtractedData)
      setIsModified(false)
    }
  }

  const openEditPeriod = (index: number) => {
    const p = tempExtractedData?.periodos?.[index]
    if (!p) return
    setEditingPeriodIndex(index)
    setEditEmpregador(p.empregador || '')
    setEditInicio(p.inicio || '')
    setEditFim(p.fim || '')
    setEditIsCurrent(!p.fim)
    setShowEditPeriodModal(true)
  }

  const savePeriod = () => {
    if (!tempExtractedData?.periodos || editingPeriodIndex === null) return
    const updatedPeriodos = [...tempExtractedData.periodos]
    updatedPeriodos[editingPeriodIndex] = {
      ...updatedPeriodos[editingPeriodIndex],
      empregador: editEmpregador,
      inicio: editInicio,
      fim: editIsCurrent ? null : editFim,
    }
    setTempExtractedData({ ...tempExtractedData, periodos: updatedPeriodos })
    setIsModified(true)
    setShowEditPeriodModal(false)
    addToast({ type: 'success', title: 'Vínculo atualizado' })
  }

  const openEditSalaries = (index: number) => {
    const p = tempExtractedData?.periodos?.[index]
    if (!p) return
    setEditingSalariesIndex(index)
    setEditSalarios(p.salarios ? [...p.salarios] : [])
    setNewCompetencia('')
    setNewValor('')
    setShowEditSalariesModal(true)
  }

  const addSalaryItem = () => {
    if (!newCompetencia || !newValor) return
    const cleanVal = newValor.replace(/[^\d,.-]/g, '').replace(',', '.')
    const parsedVal = parseFloat(cleanVal)
    if (isNaN(parsedVal)) {
      addToast({ type: 'error', title: 'Valor do salário inválido' })
      return
    }

    let formattedComp = newCompetencia
    if (newCompetencia.includes('/')) {
      const parts = newCompetencia.split('/')
      if (parts.length === 2) formattedComp = `${parts[1]}-${parts[0]}`
    }

    if (editSalarios.some(s => s.competencia === formattedComp)) {
      addToast({ type: 'error', title: 'Competência já registrada neste período' })
      return
    }

    const list = [...editSalarios, { competencia: formattedComp, valor: parsedVal }]
    list.sort((a, b) => b.competencia.localeCompare(a.competencia))
    setEditSalarios(list)
    setNewCompetencia('')
    setNewValor('')
  }

  const removeSalaryItem = (sIdx: number) => {
    setEditSalarios(editSalarios.filter((_, idx) => idx !== sIdx))
  }

  const saveSalaries = () => {
    if (!tempExtractedData?.periodos || editingSalariesIndex === null) return
    const updatedPeriodos = [...tempExtractedData.periodos]
    updatedPeriodos[editingSalariesIndex] = { ...updatedPeriodos[editingSalariesIndex], salarios: editSalarios }
    const totalContribuicoes = updatedPeriodos.reduce((acc, p) => acc + (p.salarios?.length || 0), 0)
    setTempExtractedData({ ...tempExtractedData, totalContribuicoes, periodos: updatedPeriodos })
    setIsModified(true)
    setShowEditSalariesModal(false)
    addToast({ type: 'success', title: 'Salários atualizados' })
  }

  const addPeriod = () => {
    const newPeriod: Periodo = {
      empregador: 'NOVO VÍNCULO ADICIONADO',
      inicio: new Date().toISOString().substring(0, 10),
      fim: null,
      salarios: [],
    }
    const list = tempExtractedData?.periodos ? [newPeriod, ...tempExtractedData.periodos] : [newPeriod]
    setTempExtractedData({ ...tempExtractedData, periodos: list })
    setIsModified(true)
    addToast({ type: 'success', title: 'Vínculo adicionado', message: 'Complete os detalhes clicando em editar.' })
  }

  const deletePeriodLocal = (index: number) => {
    if (!tempExtractedData?.periodos) return
    const list = tempExtractedData.periodos.filter((_, idx) => idx !== index)
    const totalContribuicoes = list.reduce((acc, p) => acc + (p.salarios?.length || 0), 0)
    setTempExtractedData({ ...tempExtractedData, totalContribuicoes, periodos: list })
    setIsModified(true)
    addToast({ type: 'success', title: 'Vínculo removido localmente' })
  }

  const handleSaveToDb = async (clientId: string) => {
    setSavingData(true)
    setSaveError('')
    try {
      const response = await api.put(`/cnis/${clientId}`, { extractedData: tempExtractedData })
      setCnis(response.data.cnisDocument)
      setIsModified(false)
      setShowSaveConfirmModal(false)
      addToast({ type: 'success', title: 'Alterações salvas', message: 'Dados do CNIS salvos no banco de dados com sucesso!' })
    } catch (err: unknown) {
      setSaveError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao salvar alterações no banco.')
    } finally {
      setSavingData(false)
    }
  }

  const handleExportCSV = () => {
    if (!tempExtractedData?.periodos) return
    let csvContent = 'Empregador,Data Inicio,Data Fim,Competencia,Valor Salario\n'

    tempExtractedData.periodos.forEach(p => {
      const emp = (p.empregador || 'Não informado').replace(/"/g, '""')
      const ini = p.inicio || ''
      const fim = p.fim || 'Em andamento'

      if (p.salarios && p.salarios.length > 0) {
        p.salarios.forEach(s => { csvContent += `"${emp}","${ini}","${fim}","${s.competencia}",${s.valor}\n` })
      } else {
        csvContent += `"${emp}","${ini}","${fim}","",\n`
      }
    })

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `cnis_${tempExtractedData.nit || 'extrato'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addToast({ type: 'success', title: 'CSV Gerado', message: 'Dados exportados com sucesso!' })
  }

  const editField = (field: keyof CnisExtractedData, value: string) => {
    setTempExtractedData(prev => prev ? { ...prev, [field]: value } : prev)
    setIsModified(true)
  }

  return {
    tempExtractedData,
    isModified,
    discardChanges,
    editField,
    // Period editing
    showEditPeriodModal, setShowEditPeriodModal,
    editingPeriodIndex,
    editEmpregador, setEditEmpregador,
    editInicio, setEditInicio,
    editFim, setEditFim,
    editIsCurrent, setEditIsCurrent,
    openEditPeriod,
    savePeriod,
    addPeriod,
    deletePeriodLocal,
    // Salary editing
    showEditSalariesModal, setShowEditSalariesModal,
    editSalarios,
    newCompetencia, setNewCompetencia,
    newValor, setNewValor,
    openEditSalaries,
    addSalaryItem,
    removeSalaryItem,
    saveSalaries,
    // Save modal
    showSaveConfirmModal, setShowSaveConfirmModal,
    savingData,
    saveError,
    handleSaveToDb,
    handleExportCSV,
  }
}
