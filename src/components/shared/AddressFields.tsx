'use client'

import { Input } from '@/components/ui/Input'
import { formatCEP, stripNonDigits } from '@/lib/masks'
import { useCepLookup } from '@/hooks/useCepLookup'
import { ESTADOS } from '@/lib/br-data'

export interface AddressValues {
  street: string
  streetNumber: string
  complement: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

interface AddressFieldsProps {
  values: AddressValues
  onChange: (field: keyof AddressValues, value: string) => void
}

const labelClasses = 'block text-sm font-semibold text-slate-700 mb-1'
const selectClasses =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors'

/** Endereço completo com preenchimento automático via busca de CEP. */
export function AddressFields({ values, onChange }: AddressFieldsProps) {
  const { cepLoading, lookupCep } = useCepLookup((address) => {
    onChange('street', address.street)
    onChange('neighborhood', address.neighborhood)
    onChange('city', address.city)
    onChange('state', address.state)
  })

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = stripNonDigits(e.target.value).slice(0, 8)
    onChange('zipCode', formatCEP(raw))
    if (raw.length === 8) lookupCep(raw)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-5">
        <Input
          label="CEP"
          value={values.zipCode}
          onChange={handleCepChange}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
          loading={cepLoading}
          placeholder="00000-000"
          inputMode="numeric"
          autoComplete="postal-code"
        />
        <Input
          label="Logradouro"
          value={values.street}
          onChange={(e) => onChange('street', e.target.value)}
          placeholder="Rua, Avenida..."
          autoComplete="street-address"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Input
          label="Número"
          value={values.streetNumber}
          onChange={(e) => onChange('streetNumber', e.target.value)}
          placeholder="S/N"
          autoComplete="address-line2"
        />
        <Input
          label="Complemento"
          value={values.complement}
          onChange={(e) => onChange('complement', e.target.value)}
          placeholder="Apto, Bloco..."
        />
        <Input
          label="Bairro"
          value={values.neighborhood}
          onChange={(e) => onChange('neighborhood', e.target.value)}
          placeholder="Bairro"
          autoComplete="address-line2"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-5">
        <Input
          label="Cidade"
          value={values.city}
          onChange={(e) => onChange('city', e.target.value)}
          placeholder="Cidade"
          autoComplete="address-level2"
        />
        <div>
          <label htmlFor="address-state" className={labelClasses}>UF</label>
          <select
            id="address-state"
            value={values.state}
            onChange={(e) => onChange('state', e.target.value)}
            className={selectClasses}
          >
            <option value="">UF</option>
            {ESTADOS.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  )
}
