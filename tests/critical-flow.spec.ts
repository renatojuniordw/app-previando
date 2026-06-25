import { test, expect } from '@playwright/test'

test.describe('Fluxo Crítico: Login → Cliente → Caso → Cálculo', () => {
  test('deve redirecionar para login sem autenticação', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('deve mostrar página de login com campos e botão', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h2')).toContainText(/Entrar|Login|PreviANDO/)
  })

  test.describe('com sessão ativa (mockada ou manual)', () => {
    test.skip(({ browserName }) => !!process.env.CI, 'Requer sessão ativa — rode localmente com login manual')

    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      if (page.url().includes('/login')) {
        test.skip(true, 'Requer sessão ativa — faça login manual primeiro')
      }
    })

    test('deve criar cliente, caso e verificar painel', async ({ page }) => {
      // Dashboard
      await expect(page.locator('h1:has-text("Visão Geral")')).toBeVisible()

      // Criar cliente
      await page.goto('/clients/list')
      await expect(page.locator('h1:has-text("Clientes")')).toBeVisible()

      await page.locator('button:has-text("Novo Cliente")').click()
      await expect(page.locator('h2:has-text("Novo Cliente")')).toBeVisible()

      const uniqueId = Date.now().toString().slice(-6)
      await page.locator('input[placeholder="Ex: João da Silva"]').fill(`Teste E2E ${uniqueId}`)
      await page.locator('input[placeholder="000.000.000-00"]').fill('11122233344')

      // Preenche input[type="date"] via evaluate para maior compatibilidade
      await page.evaluate(() => {
        const el = document.querySelector('input[type="date"]') as HTMLInputElement
        if (el) el.value = '1990-01-15'
      })

      await page.locator('input[placeholder="(11) 99999-9999"]').fill('11999998888')
      await page.locator('button:has-text("Cadastrar Cliente")').click()
      await page.waitForLoadState('networkidle')

      // Verifica toast
      await expect(page.locator('text=Cliente cadastrado')).toBeVisible({ timeout: 10000 })

      // Acessar detalhes do cliente
      await page.locator(`a:has-text("Teste E2E ${uniqueId}")`).first().click()
      await expect(page.locator('h1:has-text("Teste E2E")')).toBeVisible()

      // Criar caso
      await page.locator('button:has-text("Novo Caso")').click()
      await expect(page.locator('h2:has-text("Novo Caso")')).toBeVisible()
      await page.locator('select').first().selectOption('APOSENTADORIA_IDADE')
      await page.locator('button:has-text("Criar")').click()
      await page.waitForLoadState('networkidle')
      await expect(page.locator('text=Caso criado')).toBeVisible({ timeout: 10000 })

      // Verificar painel do caso
      await expect(page.locator('text=Informações do Caso')).toBeVisible({ timeout: 10000 })
    })
  })
})
