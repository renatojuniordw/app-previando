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
      include: [
        'src/lib/cpf.ts', 'src/lib/utils.ts', 'src/lib/sanitize.ts',
        'src/lib/plan-guard.ts', 'src/lib/ownership.ts',
        'src/lib/gps-engine.ts', 'src/lib/retroativos-engine.ts',
        'src/lib/previdencia-engine.ts', 'src/lib/revision-engine.ts',
        'src/lib/viability-score.ts', 'src/lib/mappers.ts',
        'src/lib/masks.ts', 'src/lib/cnj-parser.ts',
        'src/lib/upload-validator.ts', 'src/lib/request-ip.ts',
        'src/lib/csp.ts', 'src/lib/fee-status.ts',
        'src/lib/modalidade-labels.ts', 'src/lib/constants.ts',
        'src/lib/previdenciario-constants.ts', 'src/lib/ai-models.ts',
        'src/lib/portal-config.ts', 'src/lib/encryption.ts',
        'src/lib/portal-session.ts', 'src/lib/client-import-parser.ts',
        'src/lib/prompts/**/*.ts', 'src/lib/email/templates.ts',
        'src/lib/strategies/assistenciais.ts', 'src/lib/strategies/retirement.ts',
        'src/lib/strategies/revision.ts', 'src/lib/strategies/revision-types.ts',
        'src/lib/strategies/registry.ts', 'src/lib/api-error.ts',
        'src/store/**/*.ts',
        'src/services/cnis/programmatic-parser.ts',
      ],
      exclude: ['**/*.test.ts', '**/*.spec.ts', 'node_modules'],
      thresholds: {
        statements: 83,
        branches: 71,
        functions: 85,
        lines: 83,
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
