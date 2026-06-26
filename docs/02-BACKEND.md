# 02 - BACKEND

> Documentacao atualizada em 2026-06-25. Reflete o estado atual do codebase.

---

## 1. Dependencias

### Core
| Pacote | Versao | Funcao |
|--------|--------|--------|
| `next` | ^14.2.35 | Framework fullstack (API routes + SSR) |
| `next-auth` | ^5.0.0-beta.25 | Autenticacao (NextAuth v5) |
| `@prisma/client` | ^5.22.0 | ORM para PostgreSQL |
| `prisma` | ^5.22.0 | Schema migrations |
| `zod` | ^3.24.1 | Validacao de schema |

### AI / Processamento
| Pacote | Versao | Funcao |
|--------|--------|--------|
| `openai` | ^4.73.1 | Client OpenAI (gpt-4.1-mini, gpt-4.1-nano) |
| `pdf-parse` | ^1.1.1 | Extracao de texto de PDF |
| `tesseract.js` | ^5.1.1 | OCR fallback para PDFs escaneados |

### Infraestrutura
| Pacote | Versao | Funcao |
|--------|--------|--------|
| `bullmq` | ^5.23.0 | Filas assincronas (BullMQ) |
| `ioredis` | ^5.4.1 | Client Redis |
| `@aws-sdk/client-s3` | ^3.699.0 | Cloudflare R2 (upload/download PDF) |
| `@aws-sdk/s3-request-presigner` | ^3.699.0 | URLs assinadas R2 |
| `mercadopago` | ^2.0.15 | Assinaturas recorrentes |
| `bcryptjs` | ^2.4.3 | Hash de senhas |
| `pdfkit` | ^0.19.1 | Geracao de PDF (export) |
| `@react-pdf/renderer` | ^4.5.1 | Renderizacao PDF no frontend |

### Utilidades
| Pacote | Versao | Funcao |
|--------|--------|--------|
| `axios` | ^1.7.9 | HTTP client |
| `date-fns` | ^4.1.0 | Manipulacao de datas |
| `date-fns-tz` | ^3.2.0 | Timezones |
| `clsx` | ^2.1.1 | Condicoes CSS |
| `tailwind-merge` | ^2.6.0 | Merge de classes Tailwind |
| `zustand` | ^5.0.2 | State management |
| `recharts` | ^2.15.0 | Graficos |
| `isomorphic-dompurify` | ^2.19.0 | Sanitizacao HTML |

---

## 2. CNIS Processing (Hibrido)

O processamento de CNIS segue uma estrategia **hibrida de 3 estagiros**, otimizada para velocidade e precisao:

### Fluxo Hibrindo

```
PDF Upload -> Extracao de Texto -> Parser Programatico (instantaneo)
                                      |
                              [Validacao AI - gpt-4.1-nano]
                              /                  \
                        Validado              Falhou/Incompleto
                          |                          |
                    SUMMARY_READY              Parser AI Completo (gpt-4.1-mini)
                          |                          |
                          +---------------- COMPLETED
```

### Estagio 1: Parser Programatico (Regex)
- **Arquivo:** `src/services/cnis/programmatic-parser.ts`
- **Funcao:** `parseCnisProgrammatically(pdfText)`
- **Modelo:** Deterministico, baseado em regex
- **Velocidade:** Instantaneo (ms)
- **Extrai:** NIT, nome, data de nascimento, periodos de contribuicao, salarios, gaps
- **Retorna:** `{ markdown: string, extractedData: CnisExtractedData }` ou `null`
- **Status:** Se bem-sucedido, avanca para validacao AI

### Estagio 2: Validacao AI (gpt-4.1-nano)
- **Arquivo:** `src/services/cnis/ai-parser.ts`
- **Funcao:** `validateCnisProgrammaticResult(pdfText, programmaticResult)`
- **Modelo:** `gpt-4.1-nano` (custo baixo)
- **Objetivo:** Validar se o resultado programatico esta correto
- **Retorna:** `{ isValid: boolean, issues?: string[] }`
- **Se valido:** Status `SUMMARY_READY` (resumo disponivel, detalhes em processamento)
- **Se invalido:** Avanca para parser AI completo

### Estagio 3: Parser AI Completo (gpt-4.1-mini)
- **Arquivo:** `src/services/cnis/ai-parser.ts`
- **Funcao:** `parseCnisWithAI(pdfText)`
- **Modelo:** `gpt-4.1-mini` (alta precisao)
- **max_tokens:** 16384
- **Retorna:** `CnisExtractedData` completo
- **Status:** `COMPLETED`

### Two-Pass Approach
- **SUMMARY_READY:** Dados basicos disponiveis (NIT, total contribuicoes, periodos) — UI pode mostrar resumo imediatamente
- **PROCESSING_DETAILS:** Detalhes completos em processamento (salarios, gaps)
- **COMPLETED:** Processamento 100% finalizado

### Worker: cnis-processing
- **Arquivo:** `src/jobs/cnis-worker.ts`
- **Fila:** `cnis-processing`
- **Concurrency:** 2 (2 jobs em paralelo)
- **Rate Limiter:** 5 jobs a cada 60s
- **Retries:** 3 tentativas com backoff exponencial (10s, 30s, 60s)
- **OCR Fallback:** Se pdf-parse falhar ou texto < 100 chars, usa Tesseract.js

### Notificacoes e Auditoria
- **Sucesso:** Notificacao `CNIS_PROCESSED` + audit log via `writeAuditDirect`
- **Falha:** Notificacao `CNIS_FAILED` + audit log via `writeAuditDirect`
- **Reprocessamento:** Rota `/api/cnis/[caseId]/reprocess` permite reprocessar

### Tipos (cnis/types.ts)
```typescript
interface CnisExtractedData {
  nit?: string | null
  nome?: string | null
  dataNascimento?: string | null
  totalContribuicoes?: number | null
  primeiraContribuicao?: string | null
  ultimaContribuicao?: string | null
  periodos?: Array<{
    empregador: string | null
    inicio: string | null
    fim: string | null
    salarios: Array<{ competencia: string; valor: number }>
    gaps: Array<string>
  }>
}
```
- `generateMarkdown(data)` gera resumo em markdown para exibicao

### Re-export (cnis-parser.ts)
- `cnis-parser.ts` re-exporta de `cnis/index.ts` para compatibilidade
- `cnis/index.ts` exporta `types`, `parseCnisWithAI`, `parseCnisProgrammatically`

---

## 3. BullMQ Workers

### Visao Geral
- **Arquivo principal:** `src/jobs/worker.ts`
- **Comando:** `npm run worker` (ts-node src/jobs/worker.ts)
- **Conexao:** Redis via `process.env.REDIS_URL`

### Workers Ativos

#### cnis-processing
- **Arquivo:** `src/jobs/cnis-worker.ts`
- **Fila:** `cnis-processing`
- **Concurrency:** 2
- **Rate Limiter:** 5 jobs / 60s
- **Funcao:** Processamento hibrido de CNIS (programatico + AI)
- **Retries:** 3 tentativas com backoff exponencial

#### audit-log
- **Arquivo:** `src/jobs/audit-worker.ts`
- **Fila:** `audit-log`
- **Concurrency:** 10
- **Funcao:** Escrita assincrona de logs de auditoria no banco

#### deadline-notifications
- **Arquivo:** `src/jobs/deadline-worker.ts`
- **Fila:** `deadline-notifications`
- **Concurrency:** 1
- **Cron:** `0 8 * * *` (diariamente as 08:00)
- **Funcao:** Verifica prazos de casos (1, 3 e 7 dias)
- **Notificacoes:** `DEADLINE_1D`, `DEADLINE_3D`, `DEADLINE_7D`
- **Deduplicacao:** Verifica se notificacao ja existe para o mesmo usuario/caso/tipo

### Crons Removidos
- **NENHUM** cron para `reset-usage` (reset inline em plan-guard)
- **NENHUM** cron para `update-priorities`
- **NENHUM** cron para `cleanup-pdfs`

---

## 4. Service Layer

### Previdencia (Calculos)

#### previdencia-service.ts (Facade)
- **Arquivo:** `src/services/previdencia-service.ts`
- **Padrao:** Facade — delega para orquestradores especializados
- **Metodos:**
  - `runAndSaveCalculation(input)` → `CalculationOrchestrator.run()`
  - `runAndSaveSimulation(input)` → `SimulationOrchestrator.run()`
  - `runAndSaveRetroativo(input)` → `RetroativoOrchestrator.run()`

#### calculation-orchestrator.ts
- **Arquivo:** `src/services/previdencia/calculation-orchestrator.ts`
- **Input:** `caseId`, `modalidade`, `dib`, `gender`, `tempoEspecialAnos`, `dependentesPensao`
- **Fluxo:**
  1. `findAndValidateCnis(caseId)` — valida CNIS e extrai data de nascimento
  2. Busca salario minimo e regras de aposentadoria na DIB
  3. `calculatePrevidenciario()` — motor de calculo (pure domain logic)
  4. Salva no banco com `mapModalidadeToDb()`

#### simulation-orchestrator.ts
- **Arquivo:** `src/services/previdencia/simulation-orchestrator.ts`
- **Input:** `caseId`, `scenarioName`, `gender`, `dibProjetada`, `valorContribuicaoFutura`, `modalidade`, `tempoEspecialAnos`
- **Fluxo:**
  1. `findAndValidateCnis(caseId)` — valida CNIS
  2. Busca salario minimo e regras vigentes
  3. `projectSimulations()` — projecao previdenciaria
  4. Salva simulacao no banco

#### retroativo-orchestrator.ts
- **Arquivo:** `src/services/previdencia/retroativo-orchestrator.ts`
- **Input:** `caseId`, `dataInicioDireito`, `dataRequerimento`, `valorMensalBruto`, `valorDescontos`, `descricaoDescontos`
- **Fluxo:**
  1. Busca indices INPC historicos do banco (`prisma.inpcIndex`)
  2. `calculateRetroativos()` — calculo de parcelas vencidas com atualizacao monetaria INPC
  3. Salva retroativo + parcelas no banco

#### helpers.ts
- **Arquivo:** `src/services/previdencia/helpers.ts`
- **Funcao:** `findAndValidateCnis(caseId)` — helper compartilhado
- **Valida:** CNIS existe, status `COMPLETED`, data de nascimento presente
- **Lancamento:** Erro se CNIS nao encontrado, em processamento ou sem data de nascimento

### CNIS

#### cnis-parser.ts
- **Arquivo:** `src/services/cnis-parser.ts`
- Re-exporta de `cnis/index.ts` para compatibilidade

#### cnis/index.ts
- **Arquivo:** `src/services/cnis/index.ts`
- Exporta: `types`, `parseCnisWithAI`, `parseCnisProgrammatically`

#### cnis/ai-parser.ts
- **Arquivo:** `src/services/cnis/ai-parser.ts`
- `parseCnisWithAI(pdfText)` — parser completo via gpt-4.1-mini
- `validateCnisProgrammaticResult(pdfText, programmaticResult)` — validacao via gpt-4.1-nano
- System prompt especializado em Direito Previdenciario
- Sanitizacao de texto para AI via `sanitizeForAI()`

#### cnis/programmatic-parser.ts
- **Arquivo:** `src/services/cnis/programmatic-parser.ts`
- `parseCnisProgrammatically(pdfText)` — parser deterministico por regex
- Extrai: NIT, nome, data de nascimento, periodos, salarios, gaps
- Normaliza quebras de linha, espacos, caracteres especiais

#### cnis/types.ts
- **Arquivo:** `src/services/cnis/types.ts`
- `CnisExtractedData` — interface de dados extraidos
- `generateMarkdown(data)` — gera resumo em markdown

### BPC

#### bpc/index.ts
- **Arquivo:** `src/services/bpc/index.ts`
- **6 funcoes AI:**
  1. `gerarPreAnalise(params)` — pre-analise BPC/LOAS
  2. `analisarLaudo(params)` — analise de laudo medico
  3. `gerarPerguntasSocial(params)` — perguntas de entrevista social
  4. `gerarPerguntasMedicas(params)` — perguntas medicas direcionadas
  5. `gerarChecklist(params)` — checklist de documentos
  6. `gerarCarrossel(tema, contexto)` — carrossel para midias sociais
- **Modelo:** gpt-4.1-mini (CRITICAL)
- **Salario minimo:** R$ 1.518,00 (constante `SALARIO_MINIMO_VIGENTE`)
- **Sanitizacao:** `sanitizeForAI()` com limites de tamanho por campo

### Opinion Generator

#### opinion-generator.ts
- **Arquivo:** `src/services/opinion-generator.ts`
- `generateOpinion(input)` — gera parecer juridico preliminar
- **Modelo:** gpt-4.1-mini
- **max_tokens:** 16384
- **Input:** clientName, benefitType, caseStatus, cnisSummary, calculations, notes
- **Output:** content, promptUsed, tokensUsed, costUsd, model
- System prompt com regras absolutas (max 4 paragrafos, disclaimer obrigatorio)

### Register

#### register.ts
- **Arquivo:** `src/services/register.ts`
- `createUser(input)` — registro de usuario com bcrypt (cost factor 12)
- Transacao Prisma: cria User + UsageRecord
- Plan padrao: `FREE`, status: `ACTIVE`

### Storage

#### r2.ts
- **Arquivo:** `src/services/r2.ts`
- Client Cloudflare R2 via AWS SDK S3
- `uploadPDF(buffer, userId, caseId)` — upload com key `cnis/{userId}/{caseId}/{timestamp}.pdf`
- `getSignedDownloadUrl(key)` — URL assinada (15 min expiry)
- `downloadPDF(key)` — download para buffer
- `deletePDF(key)` — exclusao

### Billing

#### mercadopago.ts
- **Arquivo:** `src/services/mercadopago.ts`
- Client Mercado Pago para assinaturas recorrentes
- `mpPreApproval` — instancia de PreApproval
- `MP_PLAN_IDS` — mapeamento SOLO/PRO para IDs do MP
- `PLAN_PRICES` — SOLO: R$299, PRO: R$599

---

## 5. Mapas de Rotas API

### Autenticacao
| Metodo | Rota | Funcao |
|--------|------|--------|
| All | `/api/auth/[...nextauth]` | NextAuth v5 (session, CSRF, signin, signout, callback) |
| POST | `/api/auth/register` | Registro de usuario (bcrypt) |

### Usage
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/usage` | Uso atual + limites do plano (com reset inline) |

### Clients
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/clients` | Lista clientes (paginado, busca, prioridade) |
| POST | `/api/clients` | Cria cliente (guardClientLimit, hash CPF) |
| GET | `/api/clients/[id]` | Detalhe do cliente (com casos, cpf mascarado) |
| PUT | `/api/clients/[id]` | Atualiza cliente |
| DELETE | `/api/clients/[id]` | Exclui cliente (com casos em cascata) |
| PATCH | `/api/clients/[id]/priority` | Atualiza prioridade |
| POST | `/api/clients/import` | Importacao CSV (3 imports/hora) |

### Cases
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/cases` | Lista casos (filtros: status, clientId, priority, benefitType, search, RMI, datas) |
| POST | `/api/cases` | Cria caso (12 tipos de beneficio) |
| GET | `/api/cases/[id]` | Detalhe do caso (com client, CNIS, calculos, simulacoes, pareceres, notas) |
| PATCH | `/api/cases/[id]` | Atualiza caso (status, priority, deadline, notas) |
| DELETE | `/api/cases/[id]` | Exclui caso (com CNIS em cascata) |
| PATCH | `/api/cases/[id]/status` | Altera status |

### Prontuario (Notas)
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/cases/[id]/notes` | Lista notas (filtro por tipo) |
| POST | `/api/cases/[id]/notes` | Cria nota (7 tipos: CONTATO, DOCUMENTO, JURIDICO, INTERNO, CALCULO, PENDENCIA, BPC) |
| PATCH | `/api/cases/[id]/notes/[nId]` | Atualiza nota |
| DELETE | `/api/cases/[id]/notes/[nId]` | Exclui nota |
| GET | `/api/cases/[id]/notes/diagnosis` | Diagnóstico AI (guard DIAGNOSIS, gpt-4.1-nano) |

### CNIS
| Metodo | Rota | Funcao |
|--------|------|--------|
| POST | `/api/cnis/upload` | Upload PDF (10 uploads/hora, valida MIME/tamanho/magic bytes) |
| GET | `/api/cnis/[caseId]` | Detalhe do CNIS (com URL assinada R2) |
| DELETE | `/api/cnis/[caseId]` | Exclui CNIS (cascata: calculos, simulacoes, pareceres, retroativos) |
| GET | `/api/cnis/[caseId]/status` | Status do processamento (com resumo se SUMMARY_READY/COMPLETED) |
| POST | `/api/cnis/[caseId]/reprocess` | Reprocessa CNIS (3 tentativas, backoff exponencial) |

### Calculos
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/cases/[id]/calculations` | Lista calculos do caso |
| POST | `/api/cases/[id]/calculations` | Executa calculo (guard calculation limit, PrevidenciaService) |
| DELETE | `/api/cases/[id]/calculations/[cId]` | Exclui calculo |
| PATCH | `/api/cases/[id]/calculations/[cId]/select` | Seleciona calculo como ativo |

### Retroativos
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/cases/[id]/retroativos` | Lista retroativos |
| POST | `/api/cases/[id]/retroativos` | Calcula retroativos (guard RETROATIVOS, INPC) |

### Simulacoes
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/cases/[id]/simulations` | Lista simulacoes (com auto-healing para simulacoes antigas) |
| POST | `/api/cases/[id]/simulations` | Executa simulacao (guard SIMULATOR, projecao previdenciaria) |
| DELETE | `/api/cases/[id]/simulations/[sId]` | Exclui simulacao |

### Checklist
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/cases/[id]/checklist` | Lista checklist do caso |
| PATCH | `/api/cases/[id]/checklist` | Atualiza checklist (itens, elegibilidade, pendencias) |

### Pareceres (Opinions)
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/cases/[id]/opinions` | Lista pareceres do caso |
| POST | `/api/cases/[id]/opinions` | Gera parecer AI (guard opinion limit, gpt-4.1-mini) |
| PUT | `/api/cases/[id]/opinions/[oId]` | Edita parecer (editedContent/customizedContent, status) |

### BPC (7 rotas)
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET/POST | `/api/cases/[id]/bpc` | Formulario BPC (GET: dados existentes, POST: salva formulario) |
| POST | `/api/cases/[id]/bpc/pre-analysis` | Pre-analise BPC (guard USE_BPC_MODULE, gpt-4.1-mini) |
| POST | `/api/cases/[id]/bpc/laudo` | Analise de laudo medico (guard USE_BPC_MODULE) |
| POST | `/api/cases/[id]/bpc/social` | Perguntas sociais (guard USE_BPC_MODULE) |
| POST | `/api/cases/[id]/bpc/medical` | Perguntas medicas (guard USE_BPC_MODULE) |
| POST | `/api/cases/[id]/bpc/checklist` | Checklist de documentos (guard USE_BPC_MODULE) |
| POST | `/api/cases/[id]/bpc/social-media` | Carrossel midias sociais (guard BPC_SOCIAL_MEDIA) |

### Sugestoes de Modalidades
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/cases/[id]/suggest-modalities` | Sugere modalidades (22 calculos, 10 req/min) |

### Export
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/export/pdf/[caseId]` | Gera PDF binario do caso (pdfkit, branding Previando) |

### Ferramentas
| Metodo | Rota | Funcao |
|--------|------|--------|
| POST | `/api/tools/social-media` | Carrossel BPC avulso (guard BPC_SOCIAL_MEDIA, audit log) |

### Billing
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/billing/plans` | Lista planos com precos e limites |
| POST | `/api/billing/subscribe` | Cria assinatura Mercado Pago (SOLO/PRO) |
| POST | `/api/billing/cancel` | Cancela assinatura |

### Webhooks
| Metodo | Rota | Funcao |
|--------|------|--------|
| POST | `/api/webhooks/mercadopago` | Webhook MP (assinaturas + pagamentos, verificacao de assinatura HMAC) |

### Notificacoes
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/notifications` | Lista notificacoes (50 mais recentes, unreadCount) |
| POST | `/api/notifications/[id]/read` | Marca notificacao como lida |

### Activity
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/activity` | Log de atividade (paginado, labels em portugues) |

### Dashboard
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/dashboard/summary` | Resumo do dashboard (clientes, casos, calculos, prazos, notas) |
| GET | `/api/dashboard/deadlines` | Prazos proximos (30 dias, ordenado por prioridade) |

### Dados de Referencia
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/modalidades` | Lista modalidades (getModalidades do banco) |
| GET | `/api/salario-minimo` | Salario minimo vigente (parametro `?dib=YYYY-MM-DD`) |
| GET | `/api/regras-aposentadoria` | Regras de elegibilidade (parametro `?dib=YYYY-MM-DD` obrigatorio) |

### Admin (requer `isAdmin`)
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/admin/metrics` | Metricas gerais (usuarios, receita, uso, casos) |
| GET | `/api/admin/users` | Lista usuarios (busca, filtro por plano/status, paginado) |
| PATCH | `/api/admin/users/[id]/plan` | Altera plano do usuario (FREE/SOLO/PRO) |
| PATCH | `/api/admin/users/[id]/status` | Suspende/ativa usuario |
| GET | `/api/admin/payments` | Lista pagamentos (filtro por status, paginado) |
| PATCH | `/api/admin/plans/[plan]` | Altera limites do plano (clientes, calculos, features) |
| GET | `/api/admin/modalidades` | Lista modalidades (inclui inativas) |
| POST | `/api/admin/modalidades` | Cria/atualiza modalidade (upsert por codigo) |
| PATCH | `/api/admin/modalidades/[id]` | Atualiza modalidade |
| DELETE | `/api/admin/modalidades/[id]` | Exclui modalidade |
| GET | `/api/admin/salario-minimo` | Lista salarios minimos historicos |
| POST | `/api/admin/salario-minimo` | Cria/atualiza salario minimo (upsert por vigencia) |
| PATCH | `/api/admin/salario-minimo/[id]` | Atualiza salario minimo |
| DELETE | `/api/admin/salario-minimo/[id]` | Exclui salario minimo |
| GET | `/api/admin/regras-aposentadoria` | Lista regras de aposentadoria |
| POST | `/api/admin/regras-aposentadoria` | Cria/atualiza regra (upsert por modalidade+genero+vigencia) |
| PATCH | `/api/admin/regras-aposentadoria/[id]` | Atualiza regra |
| DELETE | `/api/admin/regras-aposentadoria/[id]` | Exclui regra |

### Health
| Metodo | Rota | Funcao |
|--------|------|--------|
| GET | `/api/health` | Health check (DB, Redis, R2 env vars) |

---

## 6. Plan Guard System

### Arquivo
- `src/lib/plan-guard.ts`

### Funcionamento
- **Cache:** Redis com TTL de 300s (5 min) para `PlanLimit`
- **Reset inline:** Compara `usageMonthRef` com mes/ano atual. Se diferente, reseta contadores e atualiza referencia
- **Retorna:** 402 (Payment Required) quando limite e atingido

### Guards de Feature
```typescript
type PlanFeature =
  | 'SIMULATOR'      // simulatorEnabled
  | 'RETROATIVOS'    // retroativosEnabled
  | 'EXPORT_PDF'     // exportPdfEnabled
  | 'WHATSAPP_SHARE' // whatsappEnabled
  | 'DIAGNOSIS'      // diagnosisEnabled
  | 'USE_BPC_MODULE' // bpcEnabled
  | 'BPC_SOCIAL_MEDIA' // bpcEnabled
```

### Guards de Limite
- `guardClientLimit(userId, plan)` — limite de clientes
- `guardCalculationLimit(userId, plan)` — limite de calculos/mes
- `guardOpinionLimit(userId, plan)` — limite de pareceres/mes
- `guardBpcAnalysisLimit(userId, plan)` — limite de analises BPC/mes
- `guardBpcSocialMediaLimit(userId, plan)` — limite de midias sociais BPC/mes

### Notificacoes de Limite Proximo
- Threshold: 80% do limite
- Tipo: `PLAN_LIMIT_NEAR`
- Deduplicacao: 1 notificacao por tipo por dia (via Redis key `plan-limit-notif:{userId}:{date}`)

### Planos
| Plano | Preco | Clientes | Calculos/Mes | Pareceres/Mes | BPC/Mes |
|-------|-------|----------|--------------|---------------|---------|
| FREE | R$0 | 5 | 3 | 1 | 0 |
| SOLO | R$299 | 25 | 50 | 10 | 10 |
| PRO | R$599 | 100 | -1 (ilimitado) | -1 (ilimitado) | -1 (ilimitado) |

---

## 7. Sistema de Auditoria

### Arquivo
- `src/lib/audit.ts`

### Funcionamento
- **Fila:** `audit-log` via BullMQ
- **Fallback:** `writeAuditDirect()` para escritas imediatas se a fila falhar

### Funcoes
```typescript
async function logAudit({ userId, action, resource, req?, metadata? }): Promise<void>
async function writeAuditDirect(data: AuditJobData): Promise<void>
```

### Fluxo
1. `logAudit()` tenta enfileirar job na fila `audit-log`
2. Se a fila falha, fallback para `writeAuditDirect()` (escrita sincrona)
3. Worker `audit-log` (concurrency 10) processa jobs assincronos
4. `writeAuditDirect()` cria registro diretamente no banco (Prisma)

### Dados Capturados
- `userId`, `action`, `resource`
- `ipAddress` (via headers `cf-connecting-ip` ou `x-forwarded-for`)
- `userAgent`
- `metadata` (JSON)

### Acoes Registradas
`case.created`, `case.updated`, `case.deleted`, `case.status.changed`,
`cnis.upload`, `cnis.processed`, `cnis.failed`, `cnis.reprocess`,
`calculation.created`, `calculation.selected`, `retroative.created`,
`opinion.created`, `note.created`, `bpc.pre-analysis`, `bpc.laudo`,
`client.created`, `client.updated`, `client.deleted`, `simulation.created`,
`export.pdf`, `admin.user.suspend`, `admin.user.activate`,
`admin.plan.change`, `admin.plan.limit.change`

---

## 8. OpenAI Client

### Arquivo
- `src/lib/openai.ts`

### Configuracao
- **Singleton:** Lazy initialization com cache
- **Timeout:** 180s (3 minutos)
- **Max Retries:** 3
- **Proxy pattern:** Exporta `openai` como Proxy para uso direto

### Modelos (ai-models.ts)
- **CRITICAL:** `gpt-4.1-mini` (tarefas juridicas, CNIS, pareceres)
- **OPERATIONAL:** `gpt-4.1-nano` (resumos, classificacao, validacao)
- **max_tokens:** 16384
- **Custo estimado:** gpt-4.1-mini ~$0.0000008/token, gpt-4.1-nano ~$0.0000002/token

---

## 9. Libs Auxiliares

| Arquivo | Funcao |
|---------|--------|
| `lib/prisma.ts` | Singleton Prisma Client |
| `lib/redis.ts` | Singleton Redis (ioredis) |
| `lib/logger.ts` | Logger com prefixo por modulo |
| `lib/api-error.ts` | Handler centralizado de erros API |
| `lib/api.ts` | Utilidades de API (NextResponse helpers) |
| `lib/auth-server.ts` | Auth com refresh de plano (`authWithFreshPlan`) |
| `lib/ownership.ts` | Verificacao de ownership (case, client) |
| `lib/sanitize.ts` | Sanitizacao de input (XSS, CPF hash, AI text) |
| `lib/rate-limit.ts` | Rate limiting via Redis |
| `lib/mappers.ts` | Mapeamento API <-> DB (status, benefitType, noteType) |
| `lib/modalidades.ts` | Gerenciamento de modalidades (DB-backed) |
| `lib/previdencia-engine.ts` | Motor de calculo previdenciario (pure domain logic) |
| `lib/retroativos-engine.ts` | Motor de calculo de retroativos (INPC) |
| `lib/salario-minimo.ts` | Busca de salario minimo vigente |
| `lib/regras-aposentadoria.ts` | Busca de regras de elegibilidade |
| `lib/upload-validator.ts` | Validacao de upload PDF (MIME, tamanho, magic bytes) |
| `lib/bpc-notes.ts` | Helpers para notas BPC (salvar, formatar relato social) |
| `lib/pdf-generator.ts` | Geracao de PDF com pdfkit |
| `lib/constants.ts` | Constantes (BENEFIT_LABELS, etc) |
