import { describe, it, expect } from 'vitest'
import {
  AuxilioDoencaB31Strategy,
  AuxilioDoencaB91Strategy,
  SalarioMaternidadeStrategy,
  AuxilioReclusaoStrategy,
  PensaoMorteStrategy,
  BpcLoasStrategy,
} from '@/lib/strategies/assistenciais'

const baseInput = {
  idadeNaApuracao: 65,
  tempoContribuicaoAnos: 35,
  carenciaMeses: 200,
  salarioBeneficio: 3000,
  salarioMinimo: 1412,
  tetoPrevidenciario: 7500,
  gender: 'M' as const,
  dependentesPensao: 2,
  tempoEspecialAnos: 0,
}

describe('AuxilioDoencaB31Strategy', () => {
  it('modalidade correta', () => {
    expect(new AuxilioDoencaB31Strategy().modalidade).toBe('AUXILIO_DOENCA_B31')
  })

  it('elegível com carência suficiente', () => {
    const result = new AuxilioDoencaB31Strategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
  })

  it('coeficiente 0.91', () => {
    const result = new AuxilioDoencaB31Strategy().evaluate(baseInput)
    expect(result.coeficiente).toBe(0.91)
  })

  it('não elegível com carência insuficiente', () => {
    const input = { ...baseInput, carenciaMeses: 6 }
    const result = new AuxilioDoencaB31Strategy().evaluate(input)
    expect(result.elegivel).toBe(false)
    expect(result.pendencias[0]).toContain('Carência mínima')
  })
})

describe('AuxilioDoencaB91Strategy', () => {
  it('modalidade correta', () => {
    expect(new AuxilioDoencaB91Strategy().modalidade).toBe('AUXILIO_DOENCA_B91')
  })

  it('sempre elegível — acidentário não exige carência', () => {
    const input = { ...baseInput, carenciaMeses: 0 }
    const result = new AuxilioDoencaB91Strategy().evaluate(input)
    expect(result.elegivel).toBe(true)
    expect(result.pendencias).toHaveLength(0)
  })

  it('coeficiente 0.91', () => {
    const result = new AuxilioDoencaB91Strategy().evaluate(baseInput)
    expect(result.coeficiente).toBe(0.91)
  })
})

describe('SalarioMaternidadeStrategy', () => {
  it('modalidade correta', () => {
    expect(new SalarioMaternidadeStrategy().modalidade).toBe('SALARIO_MATERNIDADE')
  })

  it('sempre elegível', () => {
    const result = new SalarioMaternidadeStrategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
  })

  it('coeficiente 1.0', () => {
    const result = new SalarioMaternidadeStrategy().evaluate(baseInput)
    expect(result.coeficiente).toBe(1.0)
  })
})

describe('AuxilioReclusaoStrategy', () => {
  it('modalidade correta', () => {
    expect(new AuxilioReclusaoStrategy().modalidade).toBe('AUXILIO_RECLUSAO')
  })

  it('elegível com salário abaixo do limite', () => {
    const input = { ...baseInput, salarioBeneficio: 1000 }
    const result = new AuxilioReclusaoStrategy().evaluate(input)
    expect(result.elegivel).toBe(true)
  })

  it('não elegível com salário acima do limite', () => {
    const input = { ...baseInput, salarioBeneficio: 5000 }
    const result = new AuxilioReclusaoStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
  })

  it('coeficiente 1.0', () => {
    const result = new AuxilioReclusaoStrategy().evaluate(baseInput)
    expect(result.coeficiente).toBe(1.0)
  })
})

describe('PensaoMorteStrategy', () => {
  it('modalidade correta', () => {
    expect(new PensaoMorteStrategy().modalidade).toBe('PENSAO_MORTE')
  })

  it('elegível com carência suficiente', () => {
    const result = new PensaoMorteStrategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
  })

  it('coeficiente baseado em dependentes', () => {
    const input = { ...baseInput, dependentesPensao: 3 }
    const result = new PensaoMorteStrategy().evaluate(input)
    expect(result.coeficiente).toBe(0.8)
  })

  it('coeficiente máximo 1.0', () => {
    const input = { ...baseInput, dependentesPensao: 10 }
    const result = new PensaoMorteStrategy().evaluate(input)
    expect(result.coeficiente).toBe(1.0)
  })

  it('não elegível com carência insuficiente', () => {
    const input = { ...baseInput, carenciaMeses: 10 }
    const result = new PensaoMorteStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
  })
})

describe('BpcLoasStrategy', () => {
  it('modalidade correta', () => {
    expect(new BpcLoasStrategy().modalidade).toBe('BPC_LOAS')
  })

  it('elegível com idade mínima', () => {
    const result = new BpcLoasStrategy().evaluate(baseInput)
    expect(result.elegivel).toBe(true)
  })

  it('não elegível com idade abaixo', () => {
    const input = { ...baseInput, idadeNaApuracao: 50 }
    const result = new BpcLoasStrategy().evaluate(input)
    expect(result.elegivel).toBe(false)
  })

  it('coeficiente 1.0', () => {
    const result = new BpcLoasStrategy().evaluate(baseInput)
    expect(result.coeficiente).toBe(1.0)
  })
})
