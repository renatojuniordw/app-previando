import { describe, it, expect } from 'vitest'
import {
  welcomeEmail,
  cnisProcessedEmail,
  deadlineReminderEmail,
  paymentConfirmedEmail,
  paymentFailedEmail,
  limitNearEmail,
} from '@/lib/email/templates'

describe('welcomeEmail', () => {
  it('retorna subject e html', () => {
    const { subject, html } = welcomeEmail('João')
    expect(subject).toContain('Bem-vindo')
    expect(html).toContain('João')
  })

  it('html contém primeiros passos', () => {
    const { html } = welcomeEmail('Maria')
    expect(html).toContain('Cadastre')
    expect(html).toContain('Crie um caso')
  })

  it('html contém link para dashboard', () => {
    const { html } = welcomeEmail('Teste')
    expect(html).toContain('/dashboard')
  })
})

describe('cnisProcessedEmail', () => {
  it('sucesso: subject e html corretos', () => {
    const { subject, html } = cnisProcessedEmail('João', '/cases/1', 150, 'success')
    expect(subject).toContain('processado com sucesso')
    expect(html).toContain('150')
    expect(html).toContain('Processado')
  })

  it('falha: subject e html corretos', () => {
    const { subject, html } = cnisProcessedEmail('Maria', '/cases/2', 0, 'failed')
    expect(subject).toContain('Falha')
    expect(html).toContain('não pôde ser processado')
  })
})

describe('deadlineReminderEmail', () => {
  it('prazo não urgente', () => {
    const { subject, html } = deadlineReminderEmail('João', 'Aposentadoria', '2025-12-01', 30, '/cases/1')
    expect(subject).toContain('Lembrete')
    expect(html).toContain('Lembrete de Prazo')
  })

  it('prazo urgente (<=3 dias)', () => {
    const { subject, html } = deadlineReminderEmail('João', 'Aposentadoria', '2025-07-08', 2, '/cases/1')
    expect(subject).toContain('URGENTE')
    expect(html).toContain('Prazo Urgente')
  })

  it('exibe dias restantes', () => {
    const { html } = deadlineReminderEmail('João', 'Aposentadoria', '2025-12-01', 15, '/cases/1')
    expect(html).toContain('15 dias')
  })
})

describe('paymentConfirmedEmail', () => {
  it('retorna subject e html corretos', () => {
    const { subject, html } = paymentConfirmedEmail('SOLO', 'R$ 97,00', '01/08/2025')
    expect(subject).toContain('Pagamento confirmado')
    expect(subject).toContain('SOLO')
    expect(html).toContain('97')
    expect(html).toContain('01/08/2025')
  })
})

describe('paymentFailedEmail', () => {
  it('retorna subject e html corretos', () => {
    const { subject, html } = paymentFailedEmail('PRO', '/settings/billing')
    expect(subject).toContain('Problema no pagamento')
    expect(html).toContain('Não foi possível')
  })

  it('html contém botão para atualizar pagamento', () => {
    const { html } = paymentFailedEmail('SOLO', '/billing')
    expect(html).toContain('/billing')
  })
})

describe('limitNearEmail', () => {
  it('retorna subject e html corretos', () => {
    const { subject, html } = limitNearEmail('cálculos', 9, 10)
    expect(subject).toContain('9 de 10')
    expect(html).toContain('Limite Próximo')
  })

  it('html contém link para planos', () => {
    const { html } = limitNearEmail('clientes', 45, 50)
    expect(html).toContain('/settings/billing')
  })
})
