import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    // .opencode/.agents/.claude têm suas próprias node_modules (com testes de
    // terceiros, ex: zod) que o include acima capturava por engano.
    exclude: ['**/node_modules/**', '.next', 'tests/e2e', '.opencode/**', '.agents/**', '.claude/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/lib/**', 'src/services/**'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', 'node_modules'],
      thresholds: {
        statements: 50,
        branches: 40,
        functions: 50,
        lines: 50,
      },
    },
    setupFiles: ['./tests/setup/vitest-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
