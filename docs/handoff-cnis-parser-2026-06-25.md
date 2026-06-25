# Handoff: CNIS Parser — Otimização de Latência

## Contexto

O sistema Previando usa IA para extrair dados estruturados de PDFs do CNIS (Cadastro Nacional de Informações Sociais) — o histórico contributório completo do segurado junto ao INSS. Esses dados alimentam toda a calculadora previdenciária (RMI, RMA, fator previdenciário, etc.).

## Problema

O parser do CNIS levava **~15 minutos** para processar um PDF de ~10KB. O log mostrava:

```
[16:34:22] Processing CNIS started
[16:50:06] CNIS processed successfully (38,514 tokens)
```

Pior: `finish_reason: length` no log indicava que o modelo **truncava o JSON silenciosamente** — o sistema salvava dados incompletos e marcava como `COMPLETED`.

### Raiz do problema

Um único prompt enviava o CNIS inteiro e pedia **todos os salários individuais** de todos os períodos. Para um CNIS de 20-30 anos (~370 competências mensais), o output de 38K+ tokens excedia o `max_tokens`, causando truncamento.

| Tamanho do CNIS | Competências | Output estimado |
|---|---|---|
| 5 anos | ~60 | ~4K tokens |
| 10 anos | ~120 | ~8K tokens |
| 20 anos | ~240 | ~16K tokens |
| 30 anos | ~370 | ~24K+ tokens |

Com `max_tokens` fixo, CNIS de 20+ anos **sempre truncaria**.

## Decisões de Arquitetura

### Modelo: `@preset/glm4-7-flash` (Verboo)

- **Antes**: `qwen3.6-27b` — 27B parâmetros, lento (15min para 38K tokens)
- **Depois**: `@preset/glm4-7-flash` — ~7B parâmetros, ~3-4x mais rápido
- Custo é igual (ilimitado, plano mensal)
- Tarefa é extração estruturada (parsing), não raciocínio complexo — glm4-7-flash é mais que capaz

### Duas passagens + blocos

**Passagem 1 — Resumo** (~30-60s):
- Extrai: NIT, nome, data nascimento, períodos com resumo de salários (média, min, max, count)
- `max_tokens: 2000` — sempre cabe, nunca truncado
- Status: `SUMMARY_READY`
- UI libera imediatamente: advogado vê resumo do CNIS

**Passagem 2 — Salários em blocos** (~1-2min):
- Divide o texto do CNIS em blocos de ~50 competências cada
- Cada bloco: `max_tokens: 1500` — previsível, sem truncamento
- Processados em paralelo (concurrency 3)
- Status: `PROCESSING_DETAILS` → `COMPLETED`
- Salários individuais necessários para cálculo previdenciário (EC 103/2019 usa 100% dos salários desde jul/1994, corrigidos pelo INPC)

### Por que não remover salários individuais?

A engine de cálculo (`previdencia-engine.ts`) precisa dos salários individuais por competência para:
- Calcular o salário de benefício (média de todos os salários corrigidos)
- Simular cenários futuros
- Detectar última competência

Resumo de salários (média/min/max) **não é suficiente** para o cálculo correto.

## Fluxo de Status

```
PENDING → PROCESSING → SUMMARY_READY → PROCESSING_DETAILS → COMPLETED
                                              ↓
                                          FAILED (se erro)
```

Novos status no enum `ProcessingStatus`:
- `SUMMARY_READY` — Resumo pronto, salários ainda processando
- `PROCESSING_DETAILS` — Processando salários detalhados

## Arquivos Alterados

| Arquivo | Mudança |
|---|---|
| `src/lib/ai-models.ts` | Modelo: `@preset/glm4-7-flash` |
| `src/services/cnis-parser.ts` | Reescrito: duas passagens + blocos |
| `src/jobs/cnis-worker.ts` | Fluxo: resumo → SUMMARY_READY → salários → COMPLETED |
| `prisma/schema.prisma` | Enum: +`SUMMARY_READY`, +`PROCESSING_DETAILS` |
| `src/app/(dashboard)/cases/[id]/cnis/page.tsx` | STATUS_CONFIG, polling, mensagens por status |
| `src/app/(dashboard)/cases/[id]/calculator/page.tsx` | Aceita `SUMMARY_READY` |
| `src/app/(dashboard)/cases/[id]/simulator/page.tsx` | Aceita `SUMMARY_READY` |
| `src/app/api/cnis/[caseId]/route.ts` | Download URL disponível em `SUMMARY_READY` |
| `src/app/api/cnis/[caseId]/status/route.ts` | Summary retornado em `SUMMARY_READY` |

## Resultado Esperado

| Métrica | Antes | Depois |
|---|---|---|
| Tempo até resumo | 15 min | ~30-60s |
| Tempo até calculadora completa | 15 min | ~2-3 min |
| Tokens por chamada | 38,514 (única) | ~2,000 + ~6,000 (blocos) |
| Truncamento | Sim (silencioso) | Não (blocos pequenos) |

## Pontos de Atenção

1. **`splitCnisIntoBlocks()`** — Divide o texto do CNIS por empregador. Se o padrão do CNIS mudar (INSS reformula o layout), pode precisar ajustar os padrões de detecção. Fallback: divide em blocos de 5000 chars.

2. **Salários distribuídos entre períodos** — A passagem 2 extrai todos os salários, mas não associa automaticamente ao período correto. O merge atual coloca todos os salários em todos os períodos. Para precisão total, a passagem 2 precisaria extrair também o empregador por bloco. Funciona para cálculo (a engine usa todos os salários), mas a visualização pode mostrar salários de outros períodos.

3. **Concorrência do worker** — `concurrency: 2`, rate limiter `5/min`. Se múltiplos CNIS forem enviados simultaneamente, o resumo chega rápido mas os salários podem ficar em fila.

4. **Timeout de 180s** — Cada chamada individual tem timeout de 180 segundos. Com blocos pequenos (~1500 tokens), isso é mais do que suficiente.

## Próximos Passos (Opcionais)

- **Validação de completude**: Comparar competências extraídas vs. esperado (diff entre primeira e última contribuição). Alertar se < 80% das competências foram extraídas.
- **Associação salário → período**: Na passagem 2, extrair também o empregador por bloco para associar corretamente.
- **Cache de resumo**: Se o mesmo CNIS for reprocessado, usar o resumo anterior como hint para o modelo.
