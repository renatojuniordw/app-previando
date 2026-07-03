'use client'

import { useEffect, useMemo } from 'react'
import { getModalitiesForBenefit, type ApiBenefitType } from '@/lib/mappers'
interface ModalitySelectProps {
  benefitType: string | null
  modalidades: { codigo: string; label: string }[]
  value: string
  onChange: (value: string) => void
  label?: string
  hint?: string
  selectClassName?: string
  labelClassName?: string
  hintClassName?: string
  wrapperClassName?: string
  selectId?: string
}

export function ModalitySelect({
  benefitType,
  modalidades,
  value,
  onChange,
  label = 'Regra / modalidade previdenciária',
  hint = 'Escolha a modalidade que melhor se enquadra ao perfil do segurado',
  selectClassName = 'neo-input',
  labelClassName = 'neo-label',
  hintClassName = 'mt-1 font-sans text-[10px] text-slate-400',
  wrapperClassName = '',
  selectId = 'modalidade',
}: ModalitySelectProps) {
  const viableModalities = benefitType
    ? getModalitiesForBenefit(benefitType as ApiBenefitType)
    : null

  const filteredModalidades = useMemo(() => {
    if (viableModalities && viableModalities.length > 0) {
      return modalidades.filter((m) => viableModalities.includes(m.codigo))
    }
    return modalidades
  }, [modalidades, viableModalities])

  useEffect(() => {
    if (viableModalities && viableModalities.length === 1 && viableModalities[0] !== value) {
      onChange(viableModalities[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benefitType])

  const hidden = viableModalities?.length === 1

  return (
    <div className={hidden ? 'hidden' : wrapperClassName}>
      <label htmlFor={selectId} className={labelClassName}>
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClassName}
      >
        {filteredModalidades.map((item) => (
          <option key={item.codigo} value={item.codigo}>
            {item.label}
          </option>
        ))}
      </select>
      {hint && <p className={hintClassName}>{hint}</p>}
    </div>
  )
}
