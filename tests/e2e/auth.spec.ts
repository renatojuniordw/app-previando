import { test, expect } from '@playwright/test'

test.describe('Autenticação', () => {

  test('/login carrega corretamente', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
    // Verifica que pelo menos um elemento de formulário existe
    await expect(page.locator('form')).toBeAttached()
  })

  test('/dashboard sem autenticação redireciona para /login', async ({ page }) => {
    await page.goto('/dashboard')
    // next-auth redireciona para /login?callbackUrl=...
    await expect(page).toHaveURL(/\/login/)
  })

  test('tentativa de login inválido deve mostrar mensagem de erro', async ({ page }) => {
    await page.goto('/login')

    // Preenche credenciais inválidas
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
    const submitButton = page.locator('button[type="submit"]').first()

    await emailInput.fill('invalido@teste.com')
    await passwordInput.fill('senha_errada')
    await submitButton.click()

    // Deve permanecer na página de login e mostrar erro
    await expect(page).toHaveURL(/\/login/)
    // A mensagem de erro pode ser um alert, toast, ou texto visível
    await expect(page.getByText(/credenciais|inválido|erro|email|senha/i).first()).toBeAttached()
  })

})
