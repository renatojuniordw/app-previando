import { test, expect } from '@playwright/test'

test.describe('Portal e páginas públicas', () => {

  test('/portal/[token-invalido] retorna 404', async ({ page }) => {
    const response = await page.goto('/portal/token-invalido-teste-123')
    expect(response?.status()).toBe(404)
  })

  test('/termos carrega (página pública)', async ({ page }) => {
    await page.goto('/termos')
    await expect(page).toHaveURL(/\/termos/)
    // Verifica que a página retornou status 200
    const status = (await page.goto('/termos'))?.status()
    expect(status).toBe(200)
  })

  test('/privacidade carrega (página pública)', async ({ page }) => {
    await page.goto('/privacidade')
    await expect(page).toHaveURL(/\/privacidade/)
    const status = (await page.goto('/privacidade'))?.status()
    expect(status).toBe(200)
  })

})
