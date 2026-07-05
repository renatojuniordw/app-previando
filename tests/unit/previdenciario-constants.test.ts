import { describe, it, expect } from 'vitest'
import {
  SALARIO_MINIMO_FALLBACK,
  TETO_PREVIDENCIARIO_FALLBACK,
  CARENCIA_APOSENTADORIA_MESES,
  CARENCIA_AUXILIO_DOENCA_MESES,
  CARENCIA_PENSAO_MORTE_MESES,
  COEFICIENTE_BASE,
  ACRESCIMO_ANUAL,
  ANOS_BASE_EXCEDENTE_M,
  ANOS_BASE_EXCEDENTE_F,
  MULTIPLICADOR_ESPECIAL_ACRESCIMO_M,
  MULTIPLICADOR_ESPECIAL_ACRESCIMO_F,
  FATOR_PREVID_MIN,
  FATOR_PREVID_MAX,
  DENOMINADOR_PEDAGIO_50,
  COEFICIENTE_AUXILIO_DOENCA,
  DATA_LIMITE_94,
  FALLBACK_INPC_MENSAL,
} from '@/lib/previdenciario-constants'

describe('previdenciario-constants', () => {
  it('SALARIO_MINIMO_FALLBACK é positivo', () => {
    expect(SALARIO_MINIMO_FALLBACK).toBeGreaterThan(0)
    expect(SALARIO_MINIMO_FALLBACK).toBe(1621)
  })

  it('TETO_PREVIDENCIARIO_FALLBACK é maior que salário mínimo', () => {
    expect(TETO_PREVIDENCIARIO_FALLBACK).toBeGreaterThan(SALARIO_MINIMO_FALLBACK)
  })

  it('carência aposentadoria é 180 meses', () => {
    expect(CARENCIA_APOSENTADORIA_MESES).toBe(180)
  })

  it('carência auxílio-doença é 12 meses', () => {
    expect(CARENCIA_AUXILIO_DOENCA_MESES).toBe(12)
  })

  it('carência pensão morte é 18 meses', () => {
    expect(CARENCIA_PENSAO_MORTE_MESES).toBe(18)
  })

  it('coeficiente base é 0.60', () => {
    expect(COEFICIENTE_BASE).toBe(0.6)
  })

  it('acréscimo anual é 0.02', () => {
    expect(ACRESCIMO_ANUAL).toBe(0.02)
  })

  it('anos base excedente homem é 20', () => {
    expect(ANOS_BASE_EXCEDENTE_M).toBe(20)
  })

  it('anos base excedente mulher é 15', () => {
    expect(ANOS_BASE_EXCEDENTE_F).toBe(15)
  })

  it('multiplicador especial homem é 0.4', () => {
    expect(MULTIPLICADOR_ESPECIAL_ACRESCIMO_M).toBe(0.4)
  })

  it('multiplicador especial mulher é 0.2', () => {
    expect(MULTIPLICADOR_ESPECIAL_ACRESCIMO_F).toBe(0.2)
  })

  it('fator previdenciário min é 0.4', () => {
    expect(FATOR_PREVID_MIN).toBe(0.4)
  })

  it('fator previdenciário max é 1.2', () => {
    expect(FATOR_PREVID_MAX).toBe(1.2)
  })

  it('denominador pedágio 50 é 2200', () => {
    expect(DENOMINADOR_PEDAGIO_50).toBe(2200)
  })

  it('coeficiente auxílio-doença é 0.91', () => {
    expect(COEFICIENTE_AUXILIO_DOENCA).toBe(0.91)
  })

  it('DATA_LIMITE_94 é 01/07/1994', () => {
    expect(DATA_LIMITE_94.getUTCFullYear()).toBe(1994)
    expect(DATA_LIMITE_94.getUTCMonth()).toBe(6)
    expect(DATA_LIMITE_94.getUTCDate()).toBe(1)
  })

  it('FALLBACK_INPC_MENSAL é 0.35%', () => {
    expect(FALLBACK_INPC_MENSAL).toBe(0.0035)
  })
})
