import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: { baseURL: 'http://localhost:60002' },
  webServer: {
    command: 'npm run dev',
    port: 60002,
    reuseExistingServer: true,
  },
})
