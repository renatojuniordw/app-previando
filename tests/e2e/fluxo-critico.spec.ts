import { test, expect } from '@playwright/test'

/**
 * Fluxo crítico: Login → Criar cliente → Upload CNIS → Calcular → Gerar parecer
 *
 * Este arquivo contém esboços (skipped) de cada etapa com descrição do que
 * precisaria ser mockado para rodar end-to-end sem dependências externas.
 *
 * Mockagens necessárias (globais):
 * 1. next-auth — mockar sessão de usuário autenticado
 * 2. PostgreSQL — usar banco de testes isolado ou mockar Prisma
 * 3. Redis — mockar ou usar Redis de teste
 * 4. AWS S3 (para upload CNIS) — mockar com minio local ou stub
 * 5. OpenAI API (para cálculos/pareceres) — mockar resposta simulada
 * 6. Fila BullMQ — mockar ou desabilitar workers
 */

test.skip('Fluxo: Login — usuário autentica com sucesso', async ({ page }) => {
  // Mock necessário:
  //   - next-auth credentials provider retornando usuário válido
  //   - Prisma.findUnique retornando user + conta ativa
  //
  // await page.goto('/login')
  // await emailInput.fill('admin@previando.com.br')
  // await passwordInput.fill('senha_correta')
  // await submitButton.click()
  // await expect(page).toHaveURL(/\/dashboard/)
})

test.skip('Fluxo: Criar cliente — formulário de cadastro de cliente', async ({ page }) => {
  // Mock necessário:
  //   - Sessão autenticada
  //   - POST /api/clients retornando 201 com { id, nome, cpf }
  //   - Prisma.client.create aceito no backend
  //
  // await page.goto('/clientes/novo')
  // await nomeInput.fill('Maria Silva')
  // await cpfInput.fill('123.456.789-00')
  // await submitButton.click()
  // await expect(page).toHaveURL(/\/clientes\/\d+/)
})

test.skip('Fluxo: Upload CNIS — upload de arquivo PDF do CNIS', async ({ page }) => {
  // Mock necessário:
  //   - Sessão autenticada
  //   - Cliente já criado (navegar para página do cliente)
  //   - POST /api/upload retornando presigned S3 URL ou sucesso
  //   - Prisma.cnis.create aceito
  //   - Worker BullMQ processando o CNIS (ou mock direto)
  //
  // await page.goto(`/clientes/${clienteId}/cnis`)
  // await fileInput.setInputFiles('fixtures/cnis-exemplo.pdf')
  // await uploadButton.click()
  // await expect(page.getByText(/processado|sucesso/i)).toBeVisible()
})

test.skip('Fluxo: Fazer cálculo — cálculo previdenciário', async ({ page }) => {
  // Mock necessário:
  //   - Sessão autenticada
  //   - CNIS já processado no cliente
  //   - GET /api/calculo retornando resultado mockado
  //   - OpenAI API mockada retornando análise simulada
  //   - GPS Engine / Previdencia Engine retornando valores conhecidos
  //
  // await page.goto(`/clientes/${clienteId}/calcular`)
  // await page.getByRole('button', { name: /calcular/i }).click()
  // await expect(page.getByText(/resultado|cálculo|r\$/i)).toBeVisible()
})

test.skip('Fluxo: Gerar parecer — geração do parecer jurídico', async ({ page }) => {
  // Mock necessário:
  //   - Sessão autenticada
  //   - Cálculo já realizado no cliente
  //   - POST /api/parecer retornando PDF gerado
  //   - React-pdf renderer mockado ou puppeteer disponível
  //   - OpenAI API mockada para texto do parecer
  //   - S3 mockado para armazenamento do PDF
  //
  // await page.goto(`/clientes/${clienteId}/parecer`)
  // await page.getByRole('button', { name: /gerar parecer/i }).click()
  // await expect(page.getByText(/parecer gerado|download/i)).toBeVisible()
})
