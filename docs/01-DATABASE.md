# 01 — DATABASE
> PostgreSQL 16 + Prisma ORM — banco: previando_db
> Última atualização: 2026-07-07

---

## Schema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Models

### NextAuth (Autenticação)

#### Account
Tabela: `accounts`

Armazena contas de provedores externos (Google, etc.).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `userId` | `String` | FK para `User` |
| `type` | `String` | Tipo de conta (ex: "oauth") |
| `provider` | `String` | Provedor |
| `providerAccountId` | `String` | ID no provedor |
| `refresh_token` | `String? @db.Text` | Token de refresh |
| `access_token` | `String? @db.Text` | Token de acesso |
| `expires_at` | `Int?` | Expiração |
| `token_type` | `String?` | Tipo do token |
| `scope` | `String?` | Escopo |
| `id_token` | `String? @db.Text` | Token de identidade |
| `session_state` | `String?` | Estado da sessão |

**Relações:** `user -> User` (Cascade on delete)
**Índices:** `@@unique([provider, providerAccountId])`

---

#### Session
Tabela: `sessions`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `sessionToken` | `String @unique` | Token da sessão |
| `userId` | `String` | FK para `User` |
| `expires` | `DateTime` | Data de expiração |

**Relações:** `user -> User` (Cascade on delete)

---

#### VerificationToken
Tabela: `verification_tokens`

| Campo | Tipo | Descrição |
|---|---|---|
| `identifier` | `String` | Identificador (ex: e-mail) |
| `token` | `String @unique` | Token de verificação |
| `expires` | `DateTime` | Data de expiração |

**Índices:** `@@unique([identifier, token])`

---

### Usuários (Advogados)

#### User
Tabela: `users`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `name` | `String?` | Nome |
| `email` | `String? @unique` | E-mail |
| `emailVerified` | `DateTime?` | Data de verificação do e-mail |
| `image` | `String?` | URL da imagem do perfil |
| `password` | `String?` | Hash bcrypt |
| `oabNumber` | `String?` | Número OAB |
| `cpf` | `String?` | CPF do advogado |
| `phone` | `String?` | Telefone |
| `maritalStatus` | `String?` | Estado civil |
| `profession` | `String?` | Profissão |
| `street` | `String?` | Logradouro |
| `streetNumber` | `String?` | Número |
| `complement` | `String?` | Complemento |
| `neighborhood` | `String?` | Bairro |
| `city` | `String?` | Cidade |
| `state` | `String?` | Estado |
| `zipCode` | `String?` | CEP |
| `plan` | `Plan @default(FREE)` | Plano |
| `planStatus` | `PlanStatus @default(ACTIVE)` | Status da assinatura |
| `mpCustomerId` | `String? @unique` | ID do cliente no MP |
| `mpSubscriptionId` | `String? @unique` | ID da assinatura no MP |
| `mpSubscriptionStatus` | `String?` | Status da assinatura MP |
| `planExpiresAt` | `DateTime?` | Expiração do plano |
| `isAdmin` | `Boolean @default(false)` | Acesso administrativo |
| `firstLoginAt` | `DateTime?` | Primeiro login |
| `passwordChangedAt` | `DateTime?` | Invalida JWT emitidos antes do reset |
| `termsAcceptedAt` | `DateTime?` | Aceite LGPD (Art. 7º, I) |
| `deletedAt` | `DateTime?` | Soft delete (LGPD Art. 18, VI) |
| `createdAt` | `DateTime @default(now())` | Criação |
| `updatedAt` | `DateTime @updatedAt` | Atualização |

**Relações:** contém `accounts`, `sessions`, `clients`, `cases`, `caseNotes`, `usageRecord?`, `payments`, `auditLogs`, `notifications`, `clientAccess`, `documents`, `supportTickets`

---

#### Plan (Enum)
| Valor | Descrição |
|---|---|
| `FREE` | Plano gratuito |
| `SOLO` | Plano individual |
| `PRO` | Plano profissional |

#### PlanStatus (Enum)
| Valor | Descrição |
|---|---|
| `ACTIVE` | Ativa |
| `PAST_DUE` | Pagamento atrasado |
| `CANCELLED` | Cancelada |
| `SUSPENDED` | Suspenso |

---

### Limites por Plano

#### PlanLimit
Tabela: `plan_limits`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `plan` | `Plan @unique` | Plano (único) |
| `maxClients` | `Int` | Máximo de clientes |
| `maxCalculationsPerMonth` | `Int` | Máx. cálculos/mês (-1 = ilimitado) |
| `maxOpinionsPerMonth` | `Int` | Máx. pareceres/mês |
| `maxNotesPerCase` | `Int` | Máx. notas por caso (-1 = ilimitado) |
| `simulatorEnabled` | `Boolean` | Simulador habilitado |
| `retroactiveEnabled` | `Boolean` | Retroativos habilitados |
| `exportPdfEnabled` | `Boolean` | Export PDF |
| `watermarkEnabled` | `Boolean` | Marca d'água |
| `diagnosisEnabled` | `Boolean` | Diagnóstico IA |
| `bpcEnabled` | `Boolean` | Módulo BPC |
| `bpcAnalysesPerMonth` | `Int` | Análises BPC/mês |
| `bpcSocialMediaPerMonth` | `Int` | Carrosséis BPC/mês |
| `revisionEnabled` | `Boolean @default(false)` | Revisão de benefício |
| `maxRevisionsPerMonth` | `Int @default(0)` | Máx. revisões/mês |
| `gpsEnabled` | `Boolean @default(false)` | Guias GPS |
| `viabilityScoreEnabled` | `Boolean @default(false)` | Score de viabilidade |
| `peticaoEnabled` | `Boolean` | Petição Inicial IA |
| `maxPeticoesPerMonth` | `Int` | Máx. petições/mês |
| `processInterpretEnabled` | `Boolean` | Interpretação de movimentações IA |
| `maxProcessInterpretPerMonth` | `Int` | Máx. interpretações/mês |
| `updatedAt` | `DateTime @updatedAt` | Atualização |

---

### Uso Atual

#### UsageRecord
Tabela: `usage_records`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `userId` | `String @unique` | FK para `User` |
| `totalClients` | `Int @default(0)` | Total de clientes |
| `calculationsThisMonth` | `Int @default(0)` | Cálculos este mês |
| `opinionsThisMonth` | `Int @default(0)` | Pareceres este mês |
| `bpcAnalysesThisMonth` | `Int @default(0)` | Análises BPC este mês |
| `bpcSocialMediaThisMonth` | `Int @default(0)` | Posts BPC este mês |
| `peticoesThisMonth` | `Int @default(0)` | Petições este mês |
| `processInterpretThisMonth` | `Int @default(0)` | Interpretações de mov. este mês |
| `usageMonthRef` | `DateTime @default(now())` | Referência do mês |
| `updatedAt` | `DateTime @updatedAt` | Atualização |

**Observação:** Os campos `peticoesThisMonth` e `processInterpretThisMonth` foram adicionados junto com a feature de interpretação de movimentações.

**Relações:** `user -> User` (Cascade on delete)

---

### Clientes (Segurados)

#### Client
Tabela: `clients`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `userId` | `String` | FK para `User` |
| `name` | `String` | Nome |
| `cpfHash` | `String` | Hash HMAC-SHA256 |
| `birthDate` | `DateTime` | Data de nascimento |
| `gender` | `String?` | 'M' ou 'F' |
| `phone` | `String?` | Telefone (5511999999999) |
| `email` | `String?` | E-mail |
| `maritalStatus` | `String?` | Estado civil |
| `profession` | `String?` | Profissão |
| `street` | `String?` | Logradouro |
| `streetNumber` | `String?` | Número |
| `complement` | `String?` | Complemento |
| `neighborhood` | `String?` | Bairro |
| `city` | `String?` | Cidade |
| `state` | `String?` | Estado |
| `zipCode` | `String?` | CEP |
| `priority` | `Priority @default(NORMAL)` | Prioridade |
| `notes` | `String?` | Observações |
| `active` | `Boolean @default(true)` | Ativo (plano limit) |
| `anonymizedAt` | `DateTime?` | LGPD Art. 18, IV |
| `createdAt` | `DateTime @default(now())` | Criação |
| `updatedAt` | `DateTime @updatedAt` | Atualização |

**Relações:** `user -> User` (Cascade), `cases -> Case[]`, `cnisDocument -> CnisDocument?`
**Índices:** `@@index([userId])`

---

#### Priority (Enum)
| Valor | Descrição |
|---|---|
| `CRITICAL` | Crítico |
| `ATTENTION` | Atenção |
| `NORMAL` | Normal |

---

### Casos

#### Case
Tabela: `cases`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `userId` | `String` | FK para User |
| `clientId` | `String` | FK para Client |
| `status` | `CaseStatus @default(PROSPECTING)` | Status |
| `priority` | `Priority @default(NORMAL)` | Prioridade |
| `benefitType` | `BenefitType` | Tipo de benefício |
| `processNumber` | `String?` | Número do processo |
| `processLastCheck` | `DateTime?` | Última verificação |
| `processLastMovDate` | `DateTime?` | Última movimentação |
| `processLastMovCount` | `Int?` | Contagem de movimentos |
| `processLastSummary` | `String? @db.Text` | Resumo da movimentação |
| `deadlineDays` | `Int?` | Prazo em dias |
| `deadlineDate` | `DateTime?` | Data do prazo |
| `notes` | `String?` | Observações |
| `portalConfig` | `Json` | Configuração do Portal do Cliente |
| `createdAt` | `DateTime @default(now())` | Criação |
| `updatedAt` | `DateTime @updatedAt` | Atualização |

**Relações:** `user -> User`, `client -> Client`, `cnisDocument?`, `calculations[]`, `retroactives[]`, `opinions[]`, `checklists[]`, `simulations[]`, `caseNotes[]`, `bpcAnalysis?`
**Índices:** `@@index([userId])`, `@@index([clientId])`, `@@index([userId, status])`, `@@index([priority, deadlineDate])`, `@@index([processNumber])`

**PortalConfig (JSON):**
```json
{
  "showProcessTracking": true,
  "showCalculations": true,
  "showRetroactives": false,
  "showInterpretation": false
}
```
---

#### CaseStatus (Enum)
| Valor | Descrição |
|---|---|
| `PROSPECTING` | Em prospecção |
| `ANALYSIS` | Em análise |
| `READY_TO_REQUEST` | Pronto para requerer |
| `PROCESSING` | Em processamento |
| `FINISHED` | Finalizado |

#### BenefitType (Enum)
| Valor | Descrição |
|---|---|
| `RETIREMENT_BY_AGE` | Apos. por Idade |
| `RETIREMENT_BY_CONTRIBUTION_TIME` | Apos. por Tempo de Contribuição |
| `SPECIAL_RETIREMENT` | Apos. Especial |
| `HYBRID_RETIREMENT` | Apos. Híbrida |
| `POINTS_RETIREMENT` | Apos. por Pontos |
| `SICKNESS_BENEFIT` | Auxílio-Doença |
| `ACCIDENT_BENEFIT` | Auxílio-Acidente |
| `MATERNITY_PAY` | Salário-Maternidade |
| `PRISONER_BENEFIT` | Auxílio-Reclusão |
| `DEATH_PENSION` | Pensão por Morte |
| `BPC_LOAS` | BPC/LOAS |
| `BENEFIT_REVIEW` | Revisão de Benefício |

---

### Prontuário (CaseNote) — Imutável

#### CaseNote
Tabela: `case_notes`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `caseId` | `String` | FK para Case |
| `userId` | `String` | FK para User |
| `type` | `NoteType` | Tipo da nota |
| `content` | `String @db.Text` | Conteúdo |
| `version` | `Int` | Sequencial (1, 2, 3...) |
| `createdAt` | `DateTime @default(now())` | Criação |

**Nota:** Sem `updatedAt` — registro imutável por design.
**Relações:** `case -> Case` (Cascade), `user -> User` (Cascade)
**Índices:** `@@index([caseId])`, `@@index([caseId, type])`, `@@index([caseId, createdAt])`

#### NoteType (Enum)
| Valor | Descrição |
|---|---|
| `CONTACT` | Contato |
| `DOCUMENT` | Documento |
| `LEGAL` | Jurídico |
| `INTERNAL` | Observação interna |
| `CALCULATION` | Estratégia de cálculo |
| `PENDING_ISSUE` | Pendência |
| `BPC_ANALYSIS` | Análise BPC/LOAS |

---

### CNIS

#### CnisDocument
Tabela: `cnis_documents`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `caseId` | `String @unique` | FK para Case (um por caso) |
| `r2Key` | `String` | Chave no R2 |
| `fileName` | `String` | Nome do arquivo |
| `fileSizeBytes` | `Int` | Tamanho em bytes |
| `markdownContent` | `String @db.Text` | Conteúdo em markdown |
| `extractedData` | `Json` | Dados estruturados |
| `processingStatus` | `ProcessingStatus @default(PENDING)` | Status do processamento |
| `processingError` | `String?` | Erro de processamento |
| `nit` | `String?` | NIT |
| `totalContributions` | `Int?` | Total de contribuições |
| `firstContribution` | `DateTime?` | Primeira contribuição |
| `lastContribution` | `DateTime?` | Última contribuição |
| `createdAt` | `DateTime @default(now())` | Criação |
| `updatedAt` | `DateTime @updatedAt` | Atualização |

**Relações:** `case -> Case` (Cascade)

#### ProcessingStatus (Enum)
| Valor | Descrição |
|---|---|
| `PENDING` | Aguardando |
| `PROCESSING` | Processando |
| `SUMMARY_READY` | Resumo pronto |
| `PROCESSING_DETAILS` | Processando detalhes |
| `COMPLETED` | Concluído |
| `FAILED` | Falhou |

---

### Cálculos

#### Calculation
Tabela: `calculations`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `caseId` | `String` | FK para Case |
| `modality` | `CalculationModality` | Modalidade |
| `isSelected` | `Boolean @default(false)` | Selecionado |
| `inputParams` | `Json` | Parâmetros de entrada |
| `benefitSalary` | `Decimal(12,2)` | Salário de benefício |
| `rmi` | `Decimal(12,2)` | RMI |
| `rma` | `Decimal(12,2)` | RMA |
| `socialSecurityFactor` | `Decimal(6,4)?` | Fator previdenciário |
| `coefficient` | `Decimal(6,4)?` | Coeficiente |
| `expectedDib` | `DateTime?` | DIB previsto |
| `gracePeriodMet` | `Boolean` | Carência atendida |
| `contributionTime` | `Int?` | Tempo de contribuição (meses) |
| `ageAtCalculation` | `Int?` | Idade no cálculo |
| `eligible` | `Boolean` | Elegível |
| `pendingIssues` | `String[]` | Pendências |
| `calculationMemory` | `Json` | Memória de cálculo |
| `salaryPeriods` | `Json` | Períodos salariais |
| `createdAt` | `DateTime @default(now())` | Criação |

**Relações:** `case -> Case` (Cascade)
**Índices:** `@@index([caseId])`

#### CalculationModality (Enum)
`POINTS_86_96`, `TOLL_50`, `TOLL_100`, `MINIMUM_AGE_65_62`, `CONTRIBUTION_TIME`, `RETIREMENT_BY_AGE`, `SPECIAL_RETIREMENT`, `HYBRID`, `SICKNESS_BENEFIT_B31`, `SICKNESS_BENEFIT_B91`, `MATERNITY_PAY`, `PRISONER_BENEFIT`, `DEATH_PENSION`, `BPC_LOAS`

---

### Retroativos

#### Retroactive
Tabela: `retroactives`

`entitlementStartDate`, `requestDate`, `monthsLate`, `monthlyGrossValue`, `totalGrossValue`, `totalCorrectedValue`, `correctionIndex`, `discountValue`, `discountDescription`, `finalNetValue`, `calculationMemory`, `createdAt`

**Relações:** `case -> Case` (Cascade)

---

### Checklist

#### Checklist
Tabela: `checklists`

`benefitType`, `items` (Json), `eligible`, `pendingIssues` (String[]), `createdAt`

**Relações:** `case -> Case` (Cascade)

---

### Pareceres

#### Opinion
Tabela: `opinions`

`promptUsed` (Text), `generatedContent` (Text), `customizedContent` (Text?), `model`, `tokensUsed`, `generationCostUsd` (Decimal(8,6)), `status` (OpinionStatus), `createdAt`, `updatedAt`

**Enum OpinionStatus:** `GENERATED`, `REVIEWED`, `FINALIZED`

---

### Simulações

#### Simulation
Tabela: `simulations`

`scenarioName`, `scenarioParams` (Json), `rmiProjected`, `rmaProjected`, `dibProjected`, `gainVsNow`, `createdAt`

---

### Pagamentos

#### Payment
Tabela: `payments`

`mpPaymentId` (unique), `mpSubscriptionId?`, `plan`, `amount`, `currency`, `status` (PaymentStatus), `paidAt?`, `periodStart?`, `periodEnd?`, `createdAt`

**Enum PaymentStatus:** `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `REFUNDED`

---

### Salário Mínimo Histórico

#### MinimumWage
Tabela: `minimum_wages`

`effectiveDate` (unique), `value`, `ceiling`, `legislation`, `readjustment` (Float?), `createdAt`, `updatedAt`

---

### Regras de Aposentadoria

#### RetirementRule
Tabela: `retirement_rules`

`modality`, `gender`, `effectiveDate`, `minimumAge` (Decimal(5,1)?), `contributionYears` (Int?), `minimumPoints` (Int?), `gracePeriodMonths` (Int?), `description`, `legislation`, `notes` (Text?)

**Índices:** `@@unique([modality, gender, effectiveDate])`

---

### Modalidades

#### ModalityLabel
Tabela: `modality_labels`

`code` (unique), `label`, `description` (Text?), `active` (default true), `order` (Int)

---

### Análise BPC/LOAS

#### BpcFaixaEtaria (Enum)
`MENOR_16`, `MAIOR_16`

#### BpcAnalysis
Tabela: `bpc_analyses`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `caseId` | `String @unique` | FK para Case |
| `patologia` | `String` | Patologia |
| `cid` | `String?` | CID |
| `idade` | `Int` | Idade |
| `faixaEtaria` | `BpcFaixaEtaria` | Faixa etária |
| `rendaFamiliar` | `Float` | Renda familiar |
| `membrosGrupo` | `Int` | Membros do grupo |
| `rendaPerCapita` | `Float` | Renda per capita |
| `barreiras` | `String? @db.Text` | Barreiras |
| `resumoLaudos` | `String? @db.Text` | Resumo dos laudos |
| `preAnalise` | `String? @db.Text` | Pré-análise |
| `analiseLaudo` | `String? @db.Text` | Análise do laudo |
| `perguntasSocial` | `String? @db.Text` | Perguntas sociais (texto) |
| `perguntasMedicas` | `String? @db.Text` | Perguntas médicas |
| `checklist` | `String? @db.Text` | Checklist |
| `relatoSocial` | `Json?` | Relato social estruturado |
| `createdAt` | `DateTime @default(now())` | Criação |
| `updatedAt` | `DateTime @updatedAt` | Atualização |

**Relações:** `case -> Case` (Cascade)

---

### Notificações

#### Notification
Tabela: `notifications`

`userId`, `type` (NotificationType), `caseId?`, `message`, `read` (Boolean, default false), `createdAt`

**Enum NotificationType:** `DEADLINE_7D`, `DEADLINE_3D`, `DEADLINE_1D`, `PLAN_LIMIT_NEAR`, `CNIS_PROCESSED`, `CNIS_FAILED`

---

### Auditoria

#### AuditLog
Tabela: `audit_logs`

`userId`, `action`, `resource`, `ipAddress?`, `userAgent?`, `metadata` (Json?), `createdAt`

---

### Índices INPC

#### InpcIndex
Tabela: `inpc_indices`

`competence` (unique, "YYYY-MM"), `value` (Decimal(10,6)), `createdAt`, `updatedAt`

---

### Documentos Avulsos

#### Document
Tabela: `documents`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `caseId` | `String` | FK para Case |
| `userId` | `String` | FK para User |
| `r2Key` | `String @unique` | Chave no R2 |
| `fileName` | `String` | Nome do arquivo |
| `contentType` | `String` | Tipo MIME |
| `createdAt` | `DateTime @default(now())` | Criação |

**Índices:** `@@index([caseId])`, `@@index([userId])`

---

### Guias GPS/DAS

#### GpsGuide
Tabela: `gps_guides`

`categoria`, `plano`, `salarioContribuicao`, `valorCalculado`, `aliquota`, `codigoPagamento`, `competencia`, `pdfUrl?`, `createdAt`

---

### Revisão de Benefício

#### Revision
Tabela: `revisions`

`tipoRevisao`, `rmiConcedido`, `rmiRevisado`, `diferencaMensal`, `diferencaPercentual`, `retroativos5Anos`, `elegivel`, `pendencias` (String[]), `createdAt`

---

### Honorários

#### Fee
Tabela: `fees`

`retroactiveId?` (unique), `description`, `type` (FeeType), `totalAmount`, `paidAmount`, `dueDate?`, `status` (FeeStatus), `notes?`, `createdAt`, `updatedAt`

#### FeePayment
Tabela: `fee_payments`

`feeId`, `amount`, `paidAt`, `notes?`, `createdAt`

#### FeeType Enum
`FIXED`, `CONTINGENCY`, `PERCENTAGE`, `OTHER`

#### FeeStatus Enum
`PENDING`, `PARTIAL`, `PAID`, `OVERDUE`, `CANCELLED`

---

### Eventos de Webhook

#### WebhookEvent
Tabela: `webhook_events`

`provider`, `eventType`, `externalId?`, `payload` (Json), `processedAt?`, `error?`, `createdAt`
**Índices:** `@@index([provider, externalId])`, `@@index([processedAt])`

---

### Auditoria — Cadeia de Hash

#### AuditChainState
Tabela: `audit_chain_state`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `Int @id @default(1)` | Única linha (id fixo) |
| `lastHash` | `String @default("genesis")` | SHA-256 da última entrada |

Serializa workers concorrentes via `SELECT ... FOR UPDATE`.

---

### Suporte / Chamados

#### SupportTicket
Tabela: `support_tickets`

`userId`, `subject`, `message` (Text), `status` (TicketStatus), `priority` (TicketPriority), `adminNotes?`, `createdAt`, `updatedAt`
**Índices:** `@@index([userId])`, `@@index([status])`, `@@index([createdAt])`

#### TicketStatus Enum
`OPEN`, `IN_PROGRESS`, `WAITING_USER`, `RESOLVED`, `CLOSED`

#### TicketPriority Enum
`LOW`, `NORMAL`, `HIGH`, `URGENT`

---

## Seed Inicial

O seed (`prisma/seed.ts`) popula automaticamente:

### 1. Usuário Admin
Admin via env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Plano PRO.

### 2. PlanLimit (Limites SaaS)
| Campo | FREE | SOLO | PRO |
|---|---|---|---|
| `maxClients` | 3 | 30 | -1 |
| `maxCalculationsPerMonth` | 5 | -1 | -1 |
| `maxOpinionsPerMonth` | 1 | 20 | -1 |
| `maxNotesPerCase` | 10 | -1 | -1 |
| Demais features | false | true | true |
| `bpcAnalysesPerMonth` | 0 | 50 | -1 |
| `bpcSocialMediaPerMonth` | 0 | 5 | -1 |

### 3. MinimumWage
37 registros históricos (jul/1994 a jan/2026).

### 4. RetirementRule
Regras de elegibilidade para todas as modalidades, incluindo progressão anual de pontos (2019-2028/2029).

### 5. ModalityLabel
14 modalidades com labels em português.

### 6. InpcIndex
29 registros INPC mensais (jan/2024 a mai/2026).

---

## Comandos

```bash
npx prisma migrate dev --name <nome>
npx prisma generate
npm run db:seed
npx prisma migrate deploy
npx prisma studio
```

---

## Variáveis de Ambiente

```env
DATABASE_URL="postgresql://previando:senha@localhost:60003/previando_db"
DATABASE_URL_UNPOOLED="postgresql://previando:senha@localhost:60003/previando_db"
```

---

## Regras

1. CPF apenas como hash HMAC-SHA256 com salt fixo
2. Monetário sempre `Decimal(12,2)` — nunca `Float`
3. Datas sempre UTC — conversão no frontend
4. `CaseNote` nunca editada ou deletada (imutabilidade)
5. `PlanLimit` editável pelo admin sem redeploy
6. `UsageRecord` criado junto com o usuário no registro
7. PostgreSQL exposto apenas em `127.0.0.1` (porta 60003)
8. `.env.production` e `.env.development` no `.gitignore` — evita vazamento de secrets
9. Todos os uploads validados: MIME, magic bytes, tamanho, extensão
