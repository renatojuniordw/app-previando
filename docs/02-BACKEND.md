# 02 — BACKEND

> Última atualização: 2026-07-22

---

## 1. Dependências

### Core
| Pacote | Versão | Função |
|--------|--------|--------|
| `next` | ^14.2.35 | Framework fullstack (API routes + SSR) |
| `next-auth` | ^5.0.0-beta.31 | Autenticação (NextAuth v5) |
| `@prisma/client` | ^5.22.0 | ORM para PostgreSQL |
| `prisma` | ^5.22.0 | Schema migrations |
| `zod` | ^3.24.1 | Validação de schema |

### AI / Processamento
| Pacote | Versão | Função |
|--------|--------|--------|
| `openai` | ^4.73.1 | Client OpenAI |
| `pdf-parse` | ^1.1.1 | Extração de texto de PDF |
| `tesseract.js` | ^5.1.1 | OCR fallback |
| `pdfkit` | ^0.19.1 | Geração de PDF (server-side) |
| `@react-pdf/renderer` | ^4.5.1 | Renderização PDF no frontend |

### Infraestrutura
| Pacote | Versão | Função |
|--------|--------|--------|
| `bullmq` | ^5.23.0 | Filas assíncronas |
| `ioredis` | ^5.4.1 | Client Redis |
| `@aws-sdk/client-s3` | ^3.699.0 | Cloudflare R2 |
| `@aws-sdk/s3-request-presigner` | ^3.699.0 | URLs assinadas R2 |
| `mercadopago` | ^3.2.0 | Assinaturas recorrentes |
| `bcryptjs` | ^2.4.3 | Hash de senhas |

### Utilidades
| Pacote | Versão | Função |
|--------|--------|--------|
| `axios` | ^1.7.9 | HTTP client |
| `date-fns` | ^4.1.0 | Manipulação de datas |
| `date-fns-tz` | ^3.2.0 | Timezones |
| `zustand` | ^5.0.2 | State management |
| `recharts` | ^2.15.0 | Gráficos |
| `react-markdown` | ^10.1.0 | Renderização markdown |
| `isomorphic-dompurify` | ^2.19.0 | Sanitização HTML |
| `resend` | ^6.18.0 | Envio de email via Resend API |
| `lucide-react` | ^0.468.0 | Ícones |
| `clsx` / `tailwind-merge` | — | Classes CSS condicionais |
| `react-hook-form` | ^7.54.2 | Formulários |
| `@dnd-kit/core` | ^6.3.1 | Drag & drop (Kanban) |

---

## 2. CNIS Processing (Híbrido)

### Fluxo Híbrido

```
PDF Upload → Extração de Texto → Parser Programático (instantâneo)
                                      |
                              [Validação AI - gpt-4.1-nano]
                              /                  \
                        Validado              Falhou/Incompleto
                          |                          |
                    SUMMARY_READY              Parser AI Completo (gpt-4.1-mini)
                          |                          |
                          +---------------- COMPLETED
```

### Estágio 1: Parser Programático (Regex)
- **Arquivo:** `src/services/cnis/programmatic-parser.ts`
- **Função:** `parseCnisProgrammatically(pdfText)`
- **Modelo:** Determinístico, baseado em regex
- **Velocidade:** Instantâneo (ms)
- **Extrai:** NIT, nome, data de nascimento, períodos, salários, gaps, indicadores (BLOQ-EC103, PSC-MEN, etc.)

### Estágio 2: Validação AI (gpt-4.1-nano)
- **Arquivo:** `src/services/cnis/ai-parser.ts`
- **Função:** `validateCnisProgrammaticResult(pdfText, result)`
- **Modelo:** `gpt-4.1-nano`
- **Objetivo:** Validar NIT, nome, primeira e última contribuição

### Estágio 3: Parser AI Completo (gpt-4.1-mini)
- **Arquivo:** `src/services/cnis/ai-parser.ts`
- **Função:** `parseCnisWithAI(pdfText)`
- **Modelo:** `gpt-4.1-mini`
- **max_tokens:** 16384, **timeout:** 180s
- **Retorna:** `{ markdown, extractedData, tokens }`

### Worker: cnis-processing
- **Arquivo:** `src/jobs/cnis-worker.ts`
- **Fila:** `cnis-processing`
- **Concurrency:** 2, **Rate Limiter:** 5 jobs/60s
- **OCR Fallback:** pdf-parse < 100 chars → Tesseract.js
- **Notificações:** `CNIS_PROCESSED` ou `CNIS_FAILED` + audit log
- **Max páginas:** 200 (worker aborta PDFs com mais de 200 páginas)

---

## 3. BullMQ Workers

### Visão Geral
- **Arquivo principal:** `src/jobs/worker.ts`
- **Comando:** `npm run worker`
- **Conexão:** Redis via `REDIS_URL`

### Workers Ativos

| Worker | Arquivo | Concurrency | Descrição |
|--------|---------|-------------|-----------|
| `cnis-processing` | `src/jobs/cnis-worker.ts` | 2 | Processamento híbrido CNIS |
| `audit-log` | `src/jobs/audit-worker.ts` | 10 | Escrita assíncrona de auditoria |
| `deadline-notifications` | `src/jobs/deadline-worker.ts` | 1 | Notificações de prazo (cron 08:00) |
| `email-notifications` | `src/jobs/email-worker.ts` | 1 | Envio de emails em fila |
| `fee-payments` | `src/jobs/fee-worker.ts` | 1 | Processamento de pagamentos de honorários |

### Crons
- **NENHUM** cron reset-usage inline (reset no `plan-guard.ts`)
- **NENHUM** cron cleanup-pdfs
- **NENHUM** cron update-priorities

---

## 4. Service Layer

### Previdência (Cálculos)

#### previdencia-service.ts (Facade)
- **Arquivo:** `src/services/previdencia-service.ts`
- **Padrão:** Facade — delega para orquestradores especializados
- **Métodos:** `runAndSaveCalculation()`, `runAndSaveSimulation()`, `runAndSaveRetroativo()`

#### calculation-orchestrator.ts
- **Input:** `caseId`, `modalidade`, `dib`, `gender`, `tempoEspecialAnos`, `dependentesPensao`
- **Fluxo:** Valida CNIS → busca salário mínimo + regras → `calculatePrevidenciario()` → salva

#### simulation-orchestrator.ts
- **Input:** `caseId`, `scenarioName`, `gender`, `dibProjetada`, `valorContribuicaoFutura`, `modalidade`
- **Fluxo:** Valida CNIS → `projectSimulations()` → salva

#### retroativo-orchestrator.ts
- **Input:** `caseId`, `dataInicioDireito`, `dataRequerimento`, `valorMensalBruto`
- **Fluxo:** Busca INPC → `calculateRetroativos()` → salva

### CNIS
- **`cnis-parser.ts`** → re-exporta de `cnis/index.ts`
- **`cnis/index.ts`** → exporta types, `parseCnisWithAI`, `validateCnisProgrammaticResult`, `parseCnisProgrammatically`
- **`cnis/types.ts`** → `CnisExtractedData`, `generateMarkdown()`
- **`cnis/ai-parser.ts`** → parser completo via gpt-4.1-mini + validação via gpt-4.1-nano
- **`cnis/programmatic-parser.ts`** → parser determinístico por regex

### BPC
- **Arquivo:** `src/services/bpc/index.ts`
- **5 funções AI:** `gerarPreAnalise()`, `analisarLaudo()`, `gerarPerguntasSocial()`, `gerarPerguntasMedicas()`, `gerarChecklist()`
- **Modelo:** `gpt-4o-mini` (hardcoded)
- **`gerarPerguntasSocial`** retorna `RelatoSocialFromAI` (JSON estruturado, não texto)
- **Contexto cascateado:** cada função recebe resultados de etapas anteriores

### Opinion Generator
- **Arquivo:** `src/services/opinion-generator.ts`
- **Modelo:** `gpt-4.1-mini`, **max_tokens:** 16384, **temperature:** 0.3
- **Regras:** max 4 parágrafos, disclaimer obrigatório, rodapé "Calculado via Previando"

### Register
- **Arquivo:** `src/services/register.ts`
- **Transação:** Cria User + UsageRecord
- **Plan padrão:** FREE, status: ACTIVE

### Storage (R2)
- **Arquivo:** `src/services/r2.ts`
- **Funções:** `uploadPDF()`, `getSignedDownloadUrl()`, `downloadPDF()`, `deletePDF()`, `uploadDocument()`
- **uploadDocument:** key `documents/{userId}/{caseId}/{timestamp}_{fileName}`

### Mercado Pago
- **Arquivo:** `src/services/mercadopago.ts`
- **Preços:** SOLO: R$97, PRO: R$197

### Petição Inicial (IA)
- **Arquivo:** `src/services/peticao-generator.ts`
- **Modelo:** `gpt-4.1-mini`, **temperature:** 0.3
- **Gera:** Petição inicial completa com base nos dados do caso

### Revision Service
- **Arquivo:** `src/services/revision-service.ts`
- **Função:** Cálculo de revisão de benefício (diferença entre RMI concedido e revisado)

### Google Calendar
- **Arquivo:** `src/services/google-calendar.ts`
- **Função:** Sincronização com Google Agenda (OAuth2, list/insert/update events)

### Email Service
- **Arquivo:** `src/services/email-service.ts`
- **Função:** Envio de emails em fila (BullMQ) — templates em `src/lib/email/templates/`

### Cause Value Orchestrator
- **Arquivo:** `src/services/previdencia/cause-value-orchestrator.ts`
- **Função:** Cálculo de causa de pedir (valor da causa para petição inicial)

---

## 5. Mapa de Rotas API

### Autenticação
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| All | `/api/auth/[...nextauth]` | NextAuth v5 (session, signin, signout, callback) | - | - |
| POST | `/api/auth/register` | Registro (bcrypt cost 12) | 3 | 1h |
| POST | `/api/auth/forgot-password` | Envia email de redefinição (Resend) | 5 | 1h |
| POST | `/api/auth/reset-password` | Redefine senha com token | 5 | 1h |

### Usage
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/usage` | Uso atual + limites (com reset inline mensal) | - | - |

### Clients
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/clients` | Lista (paginado, busca, prioridade) | - | - |
| POST | `/api/clients` | Cria (hash CPF) | 60 | 1h |
| GET | `/api/clients/[id]` | Detalhe | - | - |
| PUT | `/api/clients/[id]` | Atualiza | 20 | 1h |
| DELETE | `/api/clients/[id]` | Exclui | 5 | 1h |
| PATCH | `/api/clients/[id]/priority` | Prioridade | 20 | 1h |
| POST | `/api/clients/import` | CSV (3/hora) | 3 | 1h |

### Cases
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/cases` | Lista (filtros: status, clientId, priority, benefitType, search) | - | - |
| POST | `/api/cases` | Cria (12 tipos) | - | - |
| GET | `/api/cases/[id]` | Detalhe (caseOverview com client, CNIS, cálculos) | - | - |
| PATCH | `/api/cases/[id]` | Atualiza | 20 | 1h |
| DELETE | `/api/cases/[id]` | Exclui | 5 | 1h |
| PATCH | `/api/cases/[id]/status` | Status | 20 | 1h |
| POST | `/api/cases/[id]/scenarios` | Gera cenários de simulação | 5 | 1h |

### Import de Casos
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| POST | `/api/cases/import` | Importa casos em lote via CSV | 3 | 1h |
| POST | `/api/cases/import/preview` | Preview/validação de importação | 10 | 1h |

### Prontuário (Notes)
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/cases/[id]/notes` | Lista (7 tipos) | - | - |
| POST | `/api/cases/[id]/notes` | Cria | 20 | 1h |
| PATCH/DELETE | `/api/cases/[id]/notes/[nId]` | Atualiza/Exclui | - | - |
| GET | `/api/cases/[id]/notes/diagnosis` | Diagnóstico IA | 10 | 1h |

### CNIS
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| POST | `/api/cnis/upload` | Upload PDF | 10 | 1h |
| GET/DELETE | `/api/cnis/[caseId]` | Detalhe/Exclui | - | - |
| GET | `/api/cnis/[caseId]/status` | Status | - | - |
| POST | `/api/cnis/[caseId]/reprocess` | Reprocessa | - | - |

### Cálculos
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/cases/[id]/calculations` | Lista | - | - |
| POST | `/api/cases/[id]/calculations` | Executa | 10 | 1h |
| DELETE | `/api/cases/[id]/calculations/[cId]` | Exclui | 10 | 1h |
| PATCH | `/api/cases/[id]/calculations/[cId]/select` | Seleciona ativo | 20 | 1h |

### Retroativos
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/cases/[id]/retroativos` | Lista | - | - |
| POST | `/api/cases/[id]/retroativos` | Calcula | 10 | 1h |

### Simulações
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET/POST | `/api/cases/[id]/simulations` | Lista/Executa | - | - |
| DELETE | `/api/cases/[id]/simulations/[sId]` | Exclui | - | - |

### Checklist
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET/PATCH | `/api/cases/[id]/checklist` | Lista/Atualiza | - | - |

### Pareceres (Opinions)
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/cases/[id]/opinions` | Lista | - | - |
| POST | `/api/cases/[id]/opinions` | Gera | 20 | 1h |
| PUT | `/api/cases/[id]/opinions/[oId]` | Edita | - | - |

### BPC (7 rotas)
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/cases/[id]/bpc` | Lista | - | - |
| POST | `/api/cases/[id]/bpc` | Formulário (upsert) | 10 | 1h |
| POST | `/api/cases/[id]/bpc/pre-analysis` | Pré-análise | 15 | 1h |
| POST | `/api/cases/[id]/bpc/laudo` | Análise de laudo | 15 | 1h |
| POST | `/api/cases/[id]/bpc/social` | Gera relato social (JSON estruturado) | 15 | 1h |
| PATCH | `/api/cases/[id]/bpc/social` | Salva relato editado | - | - |
| POST | `/api/cases/[id]/bpc/medical` | Perguntas médicas | 15 | 1h |
| POST | `/api/cases/[id]/bpc/checklist` | Checklist | 15 | 1h |

### Search
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/search` | Busca global (casos, clientes) | - | - |

### CEP
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/cep?cep=...` | Busca CEP (ViaCEP) | - | - |

### Notificações
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/notifications` | Lista (50 recentes) | - | - |
| POST | `/api/notifications/[id]/read` | Marca como lida | - | - |

### Activity
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/activity` | Log de atividade (paginado) | - | - |

### Dashboard
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/dashboard/summary` | Resumo (clientes, casos, cálculos, prazos) | - | - |
| GET | `/api/dashboard/deadlines` | Prazos próximos (30 dias) | - | - |
| GET | `/api/dashboard/insights` | Insights do dashboard | - | - |

### Honorários
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/cases/[id]/fees` | Lista honorários | - | - |
| POST | `/api/cases/[id]/fees` | Cria honorário | - | - |
| GET | `/api/fees` | Lista global | - | - |

### Export
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/export/pdf/[caseId]` | Gera PDF (pdfkit) | - | - |
| GET | `/api/export/bpc-pdf` | Exporta PDF BPC | - | - |
| GET | `/api/export/data` | Exporta dados | - | - |

### Portal do Cliente
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/portal/[token]` | Dados do caso via token | - | - |
| GET | `/api/portal/[token]/documents` | Documentos compartilhados | - | - |
| GET | `/api/portal/[token]/timeline` | Timeline do caso | - | - |
| GET | `/api/portal/[token]/faq` | FAQ customizada | - | - |
| GET | `/api/portal/[token]/export-pdf` | Exporta PDF do portal | - | - |
| POST | `/api/portal/[token]/simulate` | Simulador no portal | 5 | 1h |
| POST | `/api/portal/[token]/verify` | Verifica identidade | 10 | 1h |
| POST | `/api/cases/[id]/portal` | Gera token de acesso | 5 | 1h |
| PATCH | `/api/cases/[id]/portal/config` | Configura portal | 10 | 1h |

> **Portal DRY:** As 7 rotas do portal usam `getPortalAccess()` de `src/lib/portal-access.ts` para centralizar a lógica de validação de token, expiração e acesso. Este helper substitui a repetição manual nas rotas.

### Success Analysis
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| POST | `/api/cases/[id]/success-analysis` | Gera análise de sucesso | - | - |

### Viability Score
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| POST | `/api/cases/[id]/viability-score` | Score de viabilidade | - | - |

### Suporte
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/support/tickets` | Lista chamados | - | - |
| POST | `/api/support/tickets` | Abre chamado | - | - |

### Conversion Tracking
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| POST | `/api/track/conversion` | Rastreia evento de conversão | - | - |

### Cron
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/cron/reset-usage` | Reseta uso mensal | - | - |

### Health
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/health` | Health check (DB, Redis, R2) | - | - |

### Admin (requer `isAdmin`)
| Método | Rota | Função | Limite | Janela |
|--------|------|--------|----------|---------|
| GET | `/api/admin/metrics` | Métricas | - | - |
| GET | `/api/admin/users` | Lista usuários | - | - |
| PATCH | `/api/admin/users/[id]/plan` | Altera plano | - | - |
| PATCH | `/api/admin/users/[id]/status` | Suspende/ativa | - | - |
| GET | `/api/admin/payments` | Pagamentos | - | - |
| PATCH | `/api/admin/plans/[plan]` | Edita PlanLimit | - | - |
| GET/POST | `/api/admin/modalidades` | CRUD Modalidades | - | - |
| PATCH/DELETE | `/api/admin/modalidades/[id]` | CRUD | - | - |
| GET/POST | `/api/admin/salario-minimo` | CRUD Salário Mínimo | - | - |
| PATCH/DELETE | `/api/admin/salario-minimo/[id]` | CRUD | - | - |
| GET/POST | `/api/admin/regras-aposentadoria` | CRUD Regras | - | - |
| PATCH/DELETE | `/api/admin/regras-aposentadoria/[id]` | CRUD | - | - |

### Rate Limiting Coverage (2026-07-07)

Todas as rotas de mutação possuem rate limiting via sliding window Redis + fallback em memória:

| Rota | Limite | Janela |
|------|--------|--------|
| POST /api/auth/register | 3 | 1h |
| POST /api/auth/forgot-password | 5 | 1h |
| POST /api/auth/reset-password | 5 | 1h |
| POST /api/cnis/upload | 10 | 1h |
| POST /api/cases/[id]/notes | 20 | 1h |
| POST /api/cases/[id]/bpc | 10 | 1h |
| POST /api/cases/[id]/bpc/pre-analysis | 15 | 1h |
| POST /api/cases/[id]/bpc/laudo | 15 | 1h |
| POST /api/cases/[id]/bpc/social | 15 | 1h |
| POST /api/cases/[id]/bpc/medical | 15 | 1h |
| POST /api/cases/[id]/bpc/checklist | 15 | 1h |
| POST /api/cases/[id]/opinions | 20 | 1h |
| GET /api/cases/[id]/notes/diagnosis | 10 | 1h |
| POST /api/cases/[id]/suggest-modalities | 10 | 1h |
| POST /api/billing/subscribe | 5 | 1h |
| POST /api/clients | 60 | 1h |
| POST /api/clients/import | 3 | 1h |
| POST /api/cases/[id]/pdf/[tool] | 20 | 1h |
| POST /api/pdf/[tool] | 20 | 1h |
| PATCH /api/cases/[id]/status | 20 | 1h |
| POST /api/cases/[id]/calculations | 10 | 1h |
| POST /api/cases/[id]/retroativos | 10 | 1h |
| POST /api/cases/[id]/portal | 5 | 1h |
| PATCH /api/cases/[id]/portal/config | 10 | 1h |
| PUT /api/cases/[id] | 20 | 1h |
| DELETE /api/cases/[id] | 5 | 1h |
| PUT /api/clients/[id] | 20 | 1h |
| DELETE /api/clients/[id] | 5 | 1h |
| POST /api/clients/bulk | 3 | 1h |
| PATCH /api/clients/[id]/priority | 20 | 1h |
| PATCH /api/clients/[id]/active | 20 | 1h |
| PUT /api/users/password | 5 | 1h |
| PUT /api/users/profile | 10 | 1h |
| DELETE /api/users/account | 2 | 1h |
| POST /api/clients/import/preview | 10 | 1h |
| PATCH /api/cases/[id]/calculations/[cId]/select | 20 | 1h |
| DELETE /api/cases/[id]/calculations/[cId] | 10 | 1h |
| POST /api/cases/import | 3 | 1h |
| POST /api/cases/import/preview | 10 | 1h |
| POST /api/cases/[id]/scenarios | 5 | 1h |

---

## 6. Plan Guard System

### Arquivo
- `src/lib/plan-guard.ts`

### Funcionamento
- **Cache:** Redis com TTL de 300s
- **Reset inline:** Compara `usageMonthRef` com mês/ano atual
- **Retorna:** 402 (Payment Required)

### Guards Atômicos
Os guards agora operam de forma **atômica**: verificam e consomem o recurso numa única operação Redis (check + consume). Isso elimina race conditions entre verificação e consumo em requisições concorrentes. A função `guardAtomic()` usa `WATCH`/`MULTI` do Redis ou `INCR` com verificação de limite.

### PlanFeature
```typescript
type PlanFeature =
  | 'SIMULATOR'
  | 'RETROATIVOS'
  | 'EXPORT_PDF'
  | 'DIAGNOSIS'
  | 'USE_BPC_MODULE'
  // NOTA: BPC_SOCIAL_MEDIA foi removido do PlanFeature
  // O carrossel BPC não é mais gerado via IA no backend
```

### Guards de Limite
- `guardClientLimit()`, `guardCalculationLimit()`, `guardOpinionLimit()`
- `guardBpcAnalysisLimit()`

### Notificações de Limite Próximo
- Threshold: 80%
- Deduplicação: 1 notificação por tipo/dia via Redis

---

## 7. Sistema de Auditoria

### Arquivo
- `src/lib/audit.ts`

### Funcionamento
- **Fila:** `audit-log` via BullMQ
- **Fallback:** `writeAuditDirect()` para escritas síncronas

### Ações Registradas
`case.created`, `case.updated`, `case.deleted`, `case.status.changed`,
`cnis.upload`, `cnis.processed`, `cnis.failed`, `cnis.reprocess`,
`calculation.created`, `calculation.selected`, `retroative.created`,
`opinion.created`, `note.created`, `bpc.pre-analysis`, `bpc.laudo`,
`client.created`, `client.updated`, `client.deleted`, `simulation.created`,
`export.pdf`, `admin.user.suspend`, `admin.user.activate`,
`admin.plan.change`, `admin.plan.limit.change`

### Verificação de Integridade
- `verifyAuditChainIntegrity()` agora opera em **lotes de 1000 registros**
- Evita timeout em chains com milhões de entradas
- Percorre a cadeia de hash SHA-256 em batches, validando cada elo

---

## 8. Libs Adicionais (atualizado 2026-07-22)

| Arquivo | Função |
|---------|--------|
| `lib/env-validator.ts` | Valida 14 env vars obrigatórias no startup (NEXT_PUBLIC_APP_URL, DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, CPF_HASH_SALT, R2_*, OPENAI_API_KEY, MERCADOPAGO_*, ADMIN_EMAIL, ADMIN_PASSWORD, RESEND_API_KEY, GOOGLE_*) |
| `lib/json-schema.ts` | Utilitários de schema JSON (validação, transformação) |
| `lib/portal-access.ts` | Helper `getPortalAccess()` — centraliza validação de token, expiração e acesso do portal. DRY nas 7 rotas do portal. |
| `lib/case-import-parser.ts` | Parser de CSV para importação de casos em lote (validação, transformação, duplicatas) |
| `lib/glossary.ts` | Glossário de termos previdenciários para portal |
| `lib/cnj-parser.ts` | Parser de números de processo CNJ |
| `lib/feature-marketing.ts` | Funis de conversão e marketing |
| `lib/track-conversion.ts` | Rastreamento de eventos de conversão |
| `lib/fetch-client-info.ts` | Fetch de info de clientes com cache |
| `lib/client-import-parser.ts` | Parser de CSV para importação de clientes |
| `lib/encryption.ts` | Criptografia de dados sensíveis (BPC) |
| `lib/cpf.ts` | Validação e formatação de CPF |
| `lib/br-data.ts` | Dados brasileiros (estados, cidades) |
| `lib/csp.ts` | Content Security Policy (nonce-based) |
| `lib/request-ip.ts` | Extração de IP do request |
| `lib/sanitize-server.ts` | Sanitização server-side adicional |
| `lib/account-deletion.ts` | Soft delete de conta (LGPD) |
| `lib/oauth-token-adapter.ts` | Adaptador de token OAuth |
| `lib/cnis-status.ts` | Helpers de status CNIS |
| `lib/fee-status.ts` | Helpers de status de honorários |
| `lib/previdenciario-constants.ts` | Constantes previdenciárias |
| `lib/cause-value-engine.ts` | Motor de cálculo de causa de pedir |
| `lib/prisma-user-encryption.ts` | Criptografia de dados do usuário no Prisma |
| `lib/prisma-bpc-encryption.ts` | Criptografia de dados BPC no Prisma |
| `email/templates/` | Templates de email (password reset, etc.) |
| `prompts/` | Prompts de IA por domínio |

---

## 9. OpenAI Client

### Arquivo
- `src/lib/openai.ts`
- **Singleton:** Lazy initialization
- **Timeout:** 180s
- **Max Retries:** 3
- **loggingFetch:** Wrapper de fetch com logging de requisições para depuração

### Modelos (ai-models.ts)
- **CRITICAL:** `gpt-4.1-mini` (CNIS, pareceres, diagnóstico)
- **OPERATIONAL:** `gpt-4.1-nano` (validação, classificação)
- **BPC (hardcoded):** `gpt-4o-mini`
- **max_tokens:** 16384

---

## 10. Libs Auxiliares (Core)

| Arquivo | Função |
|---------|--------|
| `lib/prisma.ts` | Singleton Prisma Client (log em dev) |
| `lib/redis.ts` | Singleton Redis (ioredis, lazyConnect) |
| `lib/logger.ts` | Logger com suporte a JSON (produção) e colorido (dev) |
| `lib/api-error.ts` | Handler centralizado: NotFoundError, ForbiddenError, ValidationError, PlanLimitError |
| `lib/api.ts` | Axios client com interceptor 402 → UpgradeModal |
| `lib/auth-server.ts` | Auth com refresh de plano |
| `lib/admin-guard.ts` | Guard admin com cache Redis |
| `lib/ownership.ts` | Anti-IDOR (retorna 404) |
| `lib/sanitize.ts` | sanitizeInput, hashCPF, maskCPF, sanitizeForAI, sanitizePhone, escapeHtml |
| `lib/rate-limit.ts` | Sliding window Redis + fallback em memória |
| `lib/mappers.ts` | Mapeamento API ↔ DB (status, benefitType, noteType, modality) |
| `lib/modalidades.ts` | Gerenciamento de modalidades (DB-backed + fallback) |
| `lib/previdencia-engine.ts` | Motor de cálculo (pure domain logic) |
| `lib/retroativos-engine.ts` | Motor de retroativos (INPC) |
| `lib/salario-minimo.ts` | Busca salário mínimo vigente |
| `lib/regras-aposentadoria.ts` | Busca regras de elegibilidade |
| `lib/previdenciario-constants.ts` | Constantes (coeficientes, carências, pisos/tetos) |
| `lib/upload-validator.ts` | Validação PDF (MIME, tamanho, magic bytes) |
| `lib/bpc-notes.ts` | Helpers: saveBpcToNotes, formatRelatoSocialText |
| `lib/pdf-generator.ts` | Geração de PDF com pdfkit |
| `lib/resend.ts` | Cliente Resend compartilhado (API key validada no startup) |
| `lib/email.ts` | Envio de email (password reset via Resend) |
| `lib/constants.ts` | BENEFIT_LABELS, STATUS_LABELS, PRIORITY_LABELS |

---

## 11. Variáveis de Ambiente Obrigatórias

Validadas por `env-validator.ts` no startup (13 vars):

```env
NEXT_PUBLIC_APP_URL
DATABASE_URL
REDIS_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
CPF_HASH_SALT
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_ACCOUNT_ID
R2_PUBLIC_URL
OPENAI_API_KEY
MERCADO_PAGO_ACCESS_TOKEN
ADMIN_EMAIL
ADMIN_PASSWORD
RESEND_API_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

> **Nota:** `REQUIRED_VARS` no `env-validator.ts` contém a lista completa verificada no startup. O app falha cedo (fail-fast) se alguma variável obrigatória estiver ausente.

---

## 12. Known Fixes & Patches

### 2026-07-22 — Guards Atômicos e Portal DRY
- **Plan-guard atômico**: `guardAtomic()` — operação única de check + consume
- **Portal DRY**: `getPortalAccess()` em `portal-access.ts` centraliza validação
- **Auditoria paginada**: `verifyAuditChainIntegrity()` em lotes de 1000

### 2026-07-07 — Security Hardening
- **OpenAPI CORS**: Removido `Access-Control-Allow-Origin: '*'` da rota `/api/openapi`
- **Webhook timing-safe**: Trocado `===` por `timingSafeEqual` na verificação HMAC do MP
- **Rate limiting expandido**: Adicionado rate limit em 17 rotas críticas (notes, bpc, calculations, subscribe, portal, etc.)
- **CEP validation**: Adicionado regex `/^\d{8}$/` + `AbortSignal.timeout(5000)`
- **Pre-existing TS fix**: `src/app/api/export/bpc-pdf/route.ts` — `ClientInfo | null` vs `ClientInfo | undefined`
- **Dead code removed**: `Copy` import, `BpcConsolidatedPDFDocument` dynamic import, `acimaDoLimite` assignment, `Loader2` import in BpcResult, `getPageCount` function
