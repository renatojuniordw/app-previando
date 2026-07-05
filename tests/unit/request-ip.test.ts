import { describe, it, expect } from 'vitest'
import { getClientIp } from '@/lib/request-ip'

function createRequest(headers: Record<string, string>): Request {
  const h = new Headers()
  for (const [key, value] of Object.entries(headers)) {
    h.set(key, value)
  }
  return new Request('http://localhost', { headers: h })
}

describe('getClientIp', () => {
  it('retorna cf-connecting-ip quando presente', () => {
    const req = createRequest({ 'cf-connecting-ip': '1.2.3.4' })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('trim do cf-connecting-ip', () => {
    const req = createRequest({ 'cf-connecting-ip': ' 1.2.3.4 ' })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('retorna último IP do x-forwarded-for', () => {
    const req = createRequest({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' })
    expect(getClientIp(req)).toBe('3.3.3.3')
  })

  it('retorna único IP do x-forwarded-for', () => {
    const req = createRequest({ 'x-forwarded-for': '1.1.1.1' })
    expect(getClientIp(req)).toBe('1.1.1.1')
  })

  it('cf-connecting-ip tem precedência sobre x-forwarded-for', () => {
    const req = createRequest({
      'cf-connecting-ip': '1.2.3.4',
      'x-forwarded-for': '5.5.5.5, 6.6.6.6',
    })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('retorna unknown quando não há headers', () => {
    const req = createRequest({})
    expect(getClientIp(req)).toBe('unknown')
  })

  it('lida com x-forwarded-for com espaços', () => {
    const req = createRequest({ 'x-forwarded-for': ' 1.1.1.1 , 2.2.2.2 ' })
    expect(getClientIp(req)).toBe('2.2.2.2')
  })
})
