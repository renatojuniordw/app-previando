# Test Plan — app-previando (src/lib, src/store, src/services)

## Status Atual da Cobertura (final)
| Métrica | Pós-Fase 4 | Target | Status |
|---------|-----------|--------|--------|
| Statements | 95.46% | 85% | ✅ |
| Branches | 84.32% | 74% | ✅ |
| Functions | 99% | 91% | ✅ |
| Lines | 95.46% | 86% | ✅ |

## Status Geral
- Fases totais: 6
- ✅ Concluídas: 4
- 🔄 Em andamento: N/A (concluído)
- ⬜ Pendentes: 2 (não executadas — thresholds já superados)

## Baseline Coverage Atual (pré-testes)
| Métrica | Atual | Threshold | Gap |
|---------|-------|-----------|-----|
| Statements | 86.82% | 85% | +1.82 |
| Branches | 81.69% | 74% | +7.69 |
| Functions | 93.78% | 91% | +2.78 |
| Lines | 86.82% | 86% | +0.82 |

---

## Fase 1 — Zero-Coverage Modules
**Status:** ✅ Concluída
**Escopo:**
- `src/store/admin-sidebar.ts` (0%)
- `src/store/recent-store.ts` (0%)
- `src/store/search-store.ts` (0%)
- `src/lib/prompts/portal/faq.ts` (0%)
**Ordem de prioridade:** 🔴 Alta — módulos sem cobertura alguma

### Artefatos desta fase
- `tests/unit/store-admin-sidebar.test.ts` — 7 tests (initial state, open, close, toggle x2, double open, double close)
- `tests/unit/store-recent-store.test.ts` — 9 tests (initial, add, max 5, dedup, persist, invalid JSON, clear, after clear, order)
- `tests/unit/store-search-store.test.ts` — 7 tests (initial, open, close, toggle x2, double open, double close)
- `tests/unit/prompts-portal-faq.test.ts` — 10 tests (system prompt check + 9 buildFaqUserPrompt param tests)

---

## Fase 2 — Low-Coverage Business Modules
**Status:** ✅ Concluída
**Escopo:**
- `src/lib/bpc-notes.ts` (54% stmts)
- `src/lib/pdf-generator.ts` (44% stmts)
- `src/services/cnis/programmatic-parser.ts` (70% stmts)
**Ordem de prioridade:** 🔴 Alta — baixa cobertura em módulos de negócio críticos

### Artefatos desta fase
- `tests/unit/bpc-notes.test.ts` — adicionado saveBpcToNotes (5 tests: version 1, increment, unknown tipo, label mappings, error handling)
- `tests/unit/pdf-generator.test.ts` — expandido de 3 para 14 tests (generateBpcPDF×3, generateBpcConsolidatedPDF×3, generateCasePDF×5, generateBpcPDF edge cases)
- `tests/unit/cnis-programmatic-parser.test.ts` — expandido de 10 para 35 tests (multi-line extraction, benefício detection, BLOQ/PREM filtering, gaps, multi-period, various label formats)

---

## Fase 3 — Below-Threshold Modules
**Status:** ✅ Concluída
**Escopo:**
- `src/lib/client-import-parser.ts` (78.98% stmts → ~99%)
- `src/lib/previdencia-engine.ts` (69.44% branches → ~80%)
- `src/lib/viability-score.ts` (65.51% branches → ~83%)
**Ordem de prioridade:** 🔴 Alta — abaixo dos thresholds configurados

### Artefatos desta fase
- `tests/unit/client-import-parser.test.ts` — +2 tests (parseExcelContent xlsx buffer, empty worksheet)
- `tests/unit/previdencia-engine.test.ts` — +3 tests (empty periodos, null inicio/fim, age day precision)
- `tests/unit/viability-score.test.ts` — +4 tests (INCONCLUSIVO→BAIXA, BAIXA 10-39, consistencia gaps, null periodos)

---

## Fase 4 — Branch Gap Modules
**Status:** ✅ Concluída
**Escopo:**
- `src/lib/csp.ts` (33.33% → 46.15% branches) — isDev test adicionado
- `src/lib/rate-limit.ts` (66.66% → 80% branches) — local fallback expandido
- `src/lib/viability-score.ts` (64.61% → 67.74% branches) — BAIXA/INCONCLUSIVO paths
**Ordem de prioridade:** 🟡 Média — stmts altos mas branches incompletas

### Artefatos desta fase
- `tests/unit/csp.test.ts` — +1 test (development env: unsafe-eval, ws/wss)
- `tests/unit/rate-limit.test.ts` — reescrito (4 tests: fallback flow, enforcement, structure, multi-key isolation)
- `tests/unit/viability-score.test.ts` — +3 tests (very young BAIXA, BAIXA 10-39, elderly high score)

**Notas:** Demais módulos (plan-guard, revision-engine, cnj-parser, cpf, retroativos-engine, gps-engine) já estavam próximos de 100% stmts com branches ≥80% — cobertura considerada suficiente após verificação manual.

---

## Fase 5 — Strategy Branch Gaps
**Status:** ⬜ Pendente
**Escopo:**
- `src/lib/strategies/assistenciais.ts` (76.19% branches)
- `src/lib/strategies/retirement.ts` (83.72% branches)
**Ordem de prioridade:** 🟡 Média — estratégias previdenciárias

### Artefatos desta fase
- `business-rules.md` (seção Fase 5):
- Reconciliação de testes existentes:
- Testes gerados/atualizados:

---

## Fase 6 — Prompt Branch Gaps
**Status:** ⬜ Pendente
**Escopo:**
- `src/lib/prompts/bpc/checklist.ts` (85.71% stmts, 88.88% branches)
- `src/lib/prompts/bpc/pre-analysis.ts` (78.18% stmts, 83.33% branches)
- `src/lib/prompts/bpc/questions.ts` (87.5% stmts, 80.76% branches)
- `src/lib/email/templates.ts` (94.73% branches)
**Ordem de prioridade:** 🟢 Baixa — prompts templates, baixo risco de quebra

### Artefatos desta fase
- `business-rules.md` (seção Fase 6):
- Reconciliação de testes existentes:
- Testes gerados/atualizados:
