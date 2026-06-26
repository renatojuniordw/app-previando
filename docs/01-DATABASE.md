# 01 — DATABASE
> PostgreSQL 16 + Prisma ORM — banco: previando_db

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

Armazena contas de provedores externos (Google, etc.) integradas via NextAuth.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `userId` | `String` | FK para `User` |
| `type` | `String` | Tipo de conta (ex: "oauth") |
| `provider` | `String` | Provedor (ex: "google") |
| `providerAccountId` | `String` | ID da conta no provedor |
| `refresh_token` | `String? @db.Text` | Token de atualização |
| `access_token` | `String? @db.Text` | Token de acesso |
| `expires_at` | `Int?` | Expiração do token (timestamp) |
| `token_type` | `String?` | Tipo do token (ex: "bearer") |
| `scope` | `String?` | Escopo de permissões |
| `id_token` | `String? @db.Text` | Token de identidade |
| `session_state` | `String?` | Estado da sessão |

**Relações:** `user -> User` (Cascade on delete)
**Índices:** `@@unique([provider, providerAccountId])`

---

#### Session
Tabela: `sessions`

Sessões ativas de autenticação.

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

Tokens de verificação de e-mail.

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

Usuário do sistema (advogado).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `name` | `String?` | Nome do usuário |
| `email` | `String? @unique` | E-mail (único) |
| `emailVerified` | `DateTime?` | Data de verificação do e-mail |
| `image` | `String?` | URL da imagem do perfil |
| `password` | `String?` | Hash da senha (bcrypt) |
| `oabNumber` | `String?` | Número OAB |
| `phone` | `String?` | Telefone |
| `plan` | `Plan @default(FREE)` | Plano do usuário |
| `planStatus` | `PlanStatus @default(ACTIVE)` | Status da assinatura |
| `mpCustomerId` | `String? @unique` | ID do cliente no Mercado Pago |
| `mpSubscriptionId` | `String? @unique` | ID da assinatura no Mercado Pago |
| `mpSubscriptionStatus` | `String?` | Status da assinatura MP |
| `planExpiresAt` | `DateTime?` | Data de expiração do plano |
| `isAdmin` | `Boolean @default(false)` | Acesso administrativo |
| `createdAt` | `DateTime @default(now())` | Data de criação |
| `updatedAt` | `DateTime @updatedAt` | Data de atualização |

**Relações:** `accounts`, `sessions`, `clients`, `cases`, `caseNotes`, `usageRecord?`, `payments`, `auditLogs`, `notifications`

---

#### Plan (Enum)
Planos disponíveis no sistema SaaS.

| Valor | Descrição |
|---|---|
| `FREE` | Plano gratuito |
| `SOLO` | Plano individual |
| `PRO` | Plano profissional |

---

#### PlanStatus (Enum)
Status da assinatura do plano.

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

Configura os limites e recursos disponíveis por plano.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `plan` | `Plan @unique` | Plano (único por plano) |
| `maxClients` | `Int` | Máximo de clientes |
| `maxCalculationsPerMonth` | `Int` | Máx. cálculos/mês (-1 = ilimitado) |
| `maxOpinionsPerMonth` | `Int` | Máx. pareceres/mês (-1 = ilimitado) |
| `maxNotesPerCase` | `Int` | Máx. notas por caso (-1 = ilimitado, FREE = 10) |
| `simulatorEnabled` | `Boolean @default(false)` | Simulador habilitado |
| `retroactiveEnabled` | `Boolean @default(false)` | Retroativos habilitados |
| `exportPdfEnabled` | `Boolean @default(false)` | Exportação PDF habilitada |
| `whatsappEnabled` | `Boolean @default(false)` | WhatsApp habilitado |
| `watermarkEnabled` | `Boolean @default(true)` | Marca d'água habilitada |
| `diagnosisEnabled` | `Boolean @default(false)` | Diagnóstico habilitado |
| `bpcEnabled` | `Boolean @default(false)` | Análise BPC habilitada |
| `bpcAnalysesPerMonth` | `Int @default(0)` | Máx. análises BPC/mês |
| `bpcSocialMediaPerMonth` | `Int @default(0)` | Máx. posts redes sociais BPC/mês |
| `updatedAt` | `DateTime @updatedAt` | Data de atualização |

---

### Uso Atual

#### UsageRecord
Tabela: `usage_records`

Rastreia o consumo mensal de recursos por usuário.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `userId` | `String @unique` | FK para `User` (único por usuário) |
| `totalClients` | `Int @default(0)` | Total de clientes ativos |
| `calculationsThisMonth` | `Int @default(0)` | Cálculos realizados este mês |
| `opinionsThisMonth` | `Int @default(0)` | Pareceres gerados este mês |
| `bpcAnalysesThisMonth` | `Int @default(0)` | Análises BPC este mês |
| `bpcSocialMediaThisMonth` | `Int @default(0)` | Posts redes sociais BPC este mês |
| `usageMonthRef` | `DateTime @default(now())` | Referência do mês de uso |
| `updatedAt` | `DateTime @updatedAt` | Data de atualização |

**Relações:** `user -> User` (Cascade on delete)

---

### Clientes (Segurados)

#### Client
Tabela: `clients`

Segurado (cliente do advogado).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `userId` | `String` | FK para `User` |
| `name` | `String` | Nome do segurado |
| `cpfHash` | `String` | CPF hash HMAC-SHA256 (nunca plain text) |
| `birthDate` | `DateTime` | Data de nascimento |
| `phone` | `String?` | Telefone (formato: 5511999999999, DDI sem +) |
| `email` | `String?` | E-mail |
| `priority` | `Priority @default(NORMAL)` | Prioridade do cliente |
| `notes` | `String?` | Observações |
| `createdAt` | `DateTime @default(now())` | Data de criação |
| `updatedAt` | `DateTime @updatedAt` | Data de atualização |

**Relações:** `user -> User` (Cascade on delete), `cases -> Case[]`
**Índices:** `@@index([userId])`

---

#### Priority (Enum)
Nível de prioridade do cliente.

| Valor | Descrição |
|---|---|
| `CRITICAL` | Crítico |
| `ATTENTION` | Atenção |
| `NORMAL` | Normal |

---

### Casos

#### Case
Tabela: `cases`

Caso previdenciário vinculado a um cliente e usuário.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `userId` | `String` | FK para `User` |
| `clientId` | `String` | FK para `Client` |
| `status` | `CaseStatus @default(PROSPECTING)` | Status do caso |
| `priority` | `Priority @default(NORMAL)` | Prioridade |
| `benefitType` | `BenefitType` | Tipo de benefício |
| `processNumber` | `String?` | Número do processo judicial |
| `processLastCheck` | `DateTime?` | Última verificação do processo |
| `processLastMovDate` | `DateTime?` | Data da última movimentação |
| `processLastMovCount` | `Int?` | Contagem de movimentações |
| `processLastSummary` | `String? @db.Text` | Resumo da última movimentação |
| `deadlineDays` | `Int?` | Prazo em dias |
| `deadlineDate` | `DateTime?` | Data do prazo |
| `notes` | `String?` | Observações |
| `createdAt` | `DateTime @default(now())` | Data de criação |
| `updatedAt` | `DateTime @updatedAt` | Data de atualização |

**Relações:** `user -> User` (Cascade on delete), `client -> Client` (Cascade on delete), `cnisDocument?`, `calculations`, `retroactives`, `opinions`, `checklists`, `simulations`, `caseNotes`, `bpcAnalysis?`
**Índices:** `@@index([userId])`, `@@index([clientId])`, `@@index([userId, status])`, `@@index([priority, deadlineDate])`, `@@index([processNumber])`

---

#### CaseStatus (Enum)
Status do caso previdenciário.

| Valor | Descrição |
|---|---|
| `PROSPECTING` | Em prospecção |
| `ANALYSIS` | Em análise |
| `READY_TO_REQUEST` | Pronto para requerer |
| `PROCESSING` | Em processamento |
| `FINISHED` | Finalizado |

---

#### BenefitType (Enum)
Tipo de benefício previdenciário.

| Valor | Descrição |
|---|---|
| `RETIREMENT_BY_AGE` | Aposentadoria por idade |
| `RETIREMENT_BY_CONTRIBUTION_TIME` | Aposentadoria por tempo de contribuição |
| `SPECIAL_RETIREMENT` | Aposentadoria especial |
| `HYBRID_RETIREMENT` | Aposentadoria híbrida |
| `POINTS_RETIREMENT` | Aposentadoria por pontos |
| `SICKNESS_BENEFIT` | Auxílio-doença |
| `ACCIDENT_BENEFIT` | Auxílio-acidente |
| `MATERNITY_PAY` | Salário-maternidade |
| `PRISONER_BENEFIT` | Auxílio-reclusão |
| `DEATH_PENSION` | Pensão por morte |
| `BPC_LOAS` | BPC/LOAS |
| `BENEFIT_REVIEW` | Revisão de benefício |

---

### Prontuário (CaseNote) — Imutável

#### CaseNote
Tabela: `case_notes`

Registro imutável e versionado do histórico do caso.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `caseId` | `String` | FK para `Case` |
| `userId` | `String` | FK para `User` |
| `type` | `NoteType` | Tipo da nota |
| `content` | `String @db.Text` | Conteúdo da nota |
| `version` | `Int` | Sequencial por caso: 1, 2, 3... |
| `createdAt` | `DateTime @default(now())` | Data de criação |

Sem `updatedAt` — registro imutável por design.

**Relações:** `case -> Case` (Cascade on delete), `user -> User` (Cascade on delete)
**Índices:** `@@index([caseId])`, `@@index([caseId, type])`, `@@index([caseId, createdAt])`

---

#### NoteType (Enum)
Tipo de nota no prontuário.

| Valor | Descrição |
|---|---|
| `CONTACT` | Contato (ligação, reunião, WhatsApp) |
| `DOCUMENT` | Documento (recebimento/envio) |
| `LEGAL` | Jurídico (decisões, despachos, prazos) |
| `INTERNAL` | Observação interna |
| `CALCULATION` | Estratégia de cálculo |
| `PENDING_ISSUE` | Pendência em aberto |

---

### CNIS

#### CnisDocument
Tabela: `cnis_documents`

Documento CNIS (Cadastro Nacional do Segurado) processado.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `caseId` | `String @unique` | FK para `Case` (um por caso) |
| `r2Key` | `String` | Chave no armazenamento R2 |
| `fileName` | `String` | Nome do arquivo |
| `fileSizeBytes` | `Int` | Tamanho em bytes |
| `markdownContent` | `String @db.Text` | Conteúdo extraído em markdown |
| `extractedData` | `Json` | Dados estruturados extraídos |
| `processingStatus` | `ProcessingStatus @default(PENDING)` | Status do processamento |
| `processingError` | `String?` | Erro de processamento |
| `nit` | `String?` | Número de Identificação do Trabalhador |
| `totalContributions` | `Int?` | Total de contribuições |
| `firstContribution` | `DateTime?` | Primeira contribuição |
| `lastContribution` | `DateTime?` | Última contribuição |
| `createdAt` | `DateTime @default(now())` | Data de criação |
| `updatedAt` | `DateTime @updatedAt` | Data de atualização |

**Relações:** `case -> Case` (Cascade on delete)

---

#### ProcessingStatus (Enum)
Status do processamento do CNIS.

| Valor | Descrição |
|---|---|
| `PENDING` | Aguardando processamento |
| `PROCESSING` | Em processamento |
| `SUMMARY_READY` | Resumo pronto |
| `PROCESSING_DETAILS` | Processando detalhes |
| `COMPLETED` | Concluído |
| `FAILED` | Falhou |

---

### Cálculos

#### Calculation
Tabela: `calculations`

Cálculo previdenciário de benefício.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `caseId` | `String` | FK para `Case` |
| `modality` | `CalculationModality` | Modalidade de cálculo |
| `isSelected` | `Boolean @default(false)` | Se é o cálculo selecionado |
| `inputParams` | `Json` | Parâmetros de entrada |
| `benefitSalary` | `Decimal @db.Decimal(12, 2)` | Salário de benefício |
| `rmi` | `Decimal @db.Decimal(12, 2)` | RMI - Renda Mensal Inicial |
| `rma` | `Decimal @db.Decimal(12, 2)` | RMA - Renda Mensal Aposentadoria |
| `socialSecurityFactor` | `Decimal? @db.Decimal(6, 4)` | Fator previdenciário |
| `coefficient` | `Decimal? @db.Decimal(6, 4)` | Coeficiente aplicado |
| `expectedDib` | `DateTime?` | DIB previsto |
| `gracePeriodMet` | `Boolean @default(false)` | Carência atendida |
| `contributionTime` | `Int?` | Tempo de contribuição |
| `ageAtCalculation` | `Int?` | Idade no cálculo |
| `eligible` | `Boolean @default(false)` | Elegível |
| `pendingIssues` | `String[]` | Pendências |
| `calculationMemory` | `Json` | Memória de cálculo |
| `salaryPeriods` | `Json` | Períodos salariais |
| `createdAt` | `DateTime @default(now())` | Data de criação |

**Relações:** `case -> Case` (Cascade on delete)
**Índices:** `@@index([caseId])`

---

#### CalculationModality (Enum)
Modalidade de cálculo previdenciário.

| Valor | Descrição |
|---|---|
| `POINTS_86_96` | Aposentadoria por pontos (transição) |
| `TOLL_50` | Transição - pedágio de 50% |
| `TOLL_100` | Transição - pedágio de 100% |
| `MINIMUM_AGE_65_62` | Idade mínima progressiva |
| `CONTRIBUTION_TIME` | Tempo de contribuição (regra geral) |
| `RETIREMENT_BY_AGE` | Aposentadoria por idade |
| `SPECIAL_RETIREMENT` | Aposentadoria especial |
| `HYBRID` | Aposentadoria híbrida |
| `SICKNESS_BENEFIT_B31` | Auxílio-doença previdenciário |
| `SICKNESS_BENEFIT_B91` | Auxílio-doença acidentário |
| `MATERNITY_PAY` | Salário-maternidade |
| `PRISONER_BENEFIT` | Auxílio-reclusão |
| `DEATH_PENSION` | Pensão por morte |
| `BPC_LOAS` | BPC/LOAS (idoso) |

---

### Retroativos

#### Retroactive
Tabela: `retroactives`

Cálculo de parcelas atrasadas do benefício.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `caseId` | `String` | FK para `Case` |
| `entitlementStartDate` | `DateTime` | Data de início do direito |
| `requestDate` | `DateTime` | Data do requerimento |
| `monthsLate` | `Int` | Meses de atraso |
| `monthlyGrossValue` | `Decimal @db.Decimal(12, 2)` | Valor mensal bruto |
| `totalGrossValue` | `Decimal @db.Decimal(12, 2)` | Valor total bruto |
| `totalCorrectedValue` | `Decimal @db.Decimal(12, 2)` | Valor total corrigido |
| `correctionIndex` | `String` | Índice de correção aplicado |
| `discountValue` | `Decimal @default(0) @db.Decimal(12, 2)` | Valor dos descontos |
| `discountDescription` | `String?` | Descrição dos descontos |
| `finalNetValue` | `Decimal @db.Decimal(12, 2)` | Valor líquido final |
| `calculationMemory` | `Json` | Memória de cálculo |
| `createdAt` | `DateTime @default(now())` | Data de criação |

**Relações:** `case -> Case` (Cascade on delete)
**Índices:** `@@index([caseId])`

---

### Checklist

#### Checklist
Tabela: `checklists`

Checklist de elegibilidade para o tipo de benefício.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `caseId` | `String` | FK para `Case` |
| `benefitType` | `BenefitType` | Tipo de benefício |
| `items` | `Json` | Itens do checklist |
| `eligible` | `Boolean` | Elegível |
| `pendingIssues` | `String[]` | Pendências |
| `createdAt` | `DateTime @default(now())` | Data de criação |

**Relações:** `case -> Case` (Cascade on delete)
**Índices:** `@@index([caseId])`

---

### Pareceres

#### Opinion
Tabela: `opinions`

Parecer jurídico gerado por IA.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `caseId` | `String` | FK para `Case` |
| `promptUsed` | `String @db.Text` | Prompt utilizado |
| `generatedContent` | `String @db.Text` | Conteúdo gerado |
| `customizedContent` | `String? @db.Text` | Conteúdo customizado |
| `model` | `String` | Modelo de IA utilizado |
| `tokensUsed` | `Int` | Tokens consumidos |
| `generationCostUsd` | `Decimal @db.Decimal(8, 6)` | Custo em USD |
| `status` | `OpinionStatus @default(GENERATED)` | Status do parecer |
| `createdAt` | `DateTime @default(now())` | Data de criação |
| `updatedAt` | `DateTime @updatedAt` | Data de atualização |

**Relações:** `case -> Case` (Cascade on delete)
**Índices:** `@@index([caseId])`

---

#### OpinionStatus (Enum)
Status do parecer.

| Valor | Descrição |
|---|---|
| `GENERATED` | Gerado |
| `REVIEWED` | Revisado |
| `FINALIZED` | Finalizado |

---

### Simulações

#### Simulation
Tabela: `simulations`

Simulação de cenários previdenciários.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `caseId` | `String` | FK para `Case` |
| `scenarioName` | `String` | Nome do cenário |
| `scenarioParams` | `Json` | Parâmetros do cenário |
| `rmiProjected` | `Decimal @db.Decimal(12, 2)` | RMI projetado |
| `rmaProjected` | `Decimal @db.Decimal(12, 2)` | RMA projetado |
| `dibProjected` | `DateTime` | DIB projetado |
| `gainVsNow` | `Decimal @db.Decimal(12, 2)` | Ganho vs. requerimento agora |
| `createdAt` | `DateTime @default(now())` | Data de criação |

**Relações:** `case -> Case` (Cascade on delete)
**Índices:** `@@index([caseId])`

---

### Pagamentos

#### Payment
Tabela: `payments`

Registro de pagamento via Mercado Pago.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `userId` | `String` | FK para `User` |
| `mpPaymentId` | `String @unique` | ID do pagamento no Mercado Pago |
| `mpSubscriptionId` | `String?` | ID da assinatura no Mercado Pago |
| `plan` | `Plan` | Plano adquirido |
| `amount` | `Decimal @db.Decimal(10, 2)` | Valor |
| `currency` | `String @default("BRL")` | Moeda |
| `status` | `PaymentStatus` | Status do pagamento |
| `paidAt` | `DateTime?` | Data do pagamento |
| `periodStart` | `DateTime?` | Início do período |
| `periodEnd` | `DateTime?` | Fim do período |
| `createdAt` | `DateTime @default(now())` | Data de criação |

**Relações:** `user -> User` (Cascade on delete)
**Índices:** `@@index([userId])`

---

#### PaymentStatus (Enum)
Status do pagamento.

| Valor | Descrição |
|---|---|
| `PENDING` | Pendente |
| `APPROVED` | Aprovado |
| `REJECTED` | Rejeitado |
| `CANCELLED` | Cancelado |
| `REFUNDED` | Reembolsado |

---

### Salário Mínimo Histórico

#### MinimumWage
Tabela: `minimum_wages`

Tabela de referência com salários mínimos e tetos do RGPS ao longo do tempo.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `effectiveDate` | `DateTime @unique` | Data de início da vigência |
| `value` | `Decimal @db.Decimal(10, 2)` | Salário mínimo |
| `ceiling` | `Decimal @db.Decimal(10, 2)` | Teto do RGPS |
| `legislation` | `String` | Legislação (ex: "Decreto 12.797/2025") |
| `readjustment` | `Float?` | Percentual de reajuste (ex: 6.79) |
| `createdAt` | `DateTime @default(now())` | Data de criação |
| `updatedAt` | `DateTime @updatedAt` | Data de atualização |

**Índices:** `@@index([effectiveDate])`

---

### Regras de Aposentadoria

#### RetirementRule
Tabela: `retirement_rules`

Regras de elegibilidade para aposentadoria (idade, pedágio, pontos, etc.).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `modality` | `String` | Modalidade (ex: "MINIMUM_AGE_65_62", "POINTS_86_96") |
| `gender` | `String` | Gênero: "M", "F" ou "AMBOS" |
| `effectiveDate` | `DateTime` | Data de início da vigência |
| `minimumAge` | `Decimal? @db.Decimal(5, 1)` | Idade mínima (ex: 62.0, 59.5) |
| `contributionYears` | `Int?` | Anos de contribuição |
| `minimumPoints` | `Int?` | Pontos mínimos (apenas regra por pontos) |
| `gracePeriodMonths` | `Int?` | Carência em meses |
| `description` | `String` | Nome legível da regra |
| `legislation` | `String` | Legislação (ex: "EC 103/2019") |
| `notes` | `String? @db.Text` | Observações |
| `createdAt` | `DateTime @default(now())` | Data de criação |
| `updatedAt` | `DateTime @updatedAt` | Data de atualização |

**Índices:** `@@unique([modality, gender, effectiveDate])`, `@@index([modality, gender, effectiveDate])`

---

### Modalidades de Benefício / Cálculo

#### ModalityLabel
Tabela: `modality_labels`

Labels amigáveis para as modalidades de cálculo.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `code` | `String @unique` | Código da modalidade |
| `label` | `String` | Label exibido ao usuário |
| `description` | `String? @db.Text` | Descrição |
| `active` | `Boolean @default(true)` | Ativo |
| `order` | `Int @default(0)` | Ordem de exibição |
| `createdAt` | `DateTime @default(now())` | Data de criação |
| `updatedAt` | `DateTime @updatedAt` | Data de atualização |

**Índices:** `@@index([active, order])`

---

### Análise BPC/LOAS

#### BpcFaixaEtaria (Enum)
Faixa etária para análise BPC/LOAS.

| Valor | Descrição |
|---|---|
| `MENOR_16` | Menor de 16 anos |
| `MAIOR_16` | Maior ou igual a 16 anos |

---

#### BpcAnalysis
Tabela: `bpc_analyses`

Análise de elegibilidade para BPC/LOAS.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `caseId` | `String @unique` | FK para `Case` (um por caso) |
| `patologia` | `String` | Patologia diagnosticada |
| `cid` | `String?` | Código CID |
| `idade` | `Int` | Idade do segurado |
| `faixaEtaria` | `BpcFaixaEtaria` | Faixa etária |
| `rendaFamiliar` | `Float` | Renda familiar total |
| `membrosGrupo` | `Int` | Número de membros do grupo familiar |
| `rendaPerCapita` | `Float` | Renda per capita |
| `barreiras` | `String? @db.Text` | Barreiras enfrentadas |
| `resumoLaudos` | `String? @db.Text` | Resumo dos laudos médicos |
| `preAnalise` | `String? @db.Text` | Pré-análise |
| `analiseLaudo` | `String? @db.Text` | Análise do laudo |
| `perguntasSocial` | `String? @db.Text` | Perguntas para assistente social |
| `perguntasMedicas` | `String? @db.Text` | Perguntas médicas |
| `checklist` | `String? @db.Text` | Checklist de elegibilidade |
| `createdAt` | `DateTime @default(now())` | Data de criação |
| `updatedAt` | `DateTime @updatedAt` | Data de atualização |

**Relações:** `case -> Case` (Cascade on delete)

---

### Notificações In-App

#### Notification
Tabela: `notifications`

Notificações internas do sistema para o usuário.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `userId` | `String` | FK para `User` |
| `type` | `NotificationType` | Tipo de notificação |
| `caseId` | `String?` | FK para `Case` (opcional) |
| `message` | `String` | Mensagem |
| `read` | `Boolean @default(false)` | Lida |
| `createdAt` | `DateTime @default(now())` | Data de criação |

**Relações:** `user -> User` (Cascade on delete)
**Índices:** `@@index([userId, read])`, `@@index([userId, createdAt])`

---

#### NotificationType (Enum)
Tipo de notificação.

| Valor | Descrição |
|---|---|
| `DEADLINE_7D` | Prazo em 7 dias |
| `DEADLINE_3D` | Prazo em 3 dias |
| `DEADLINE_1D` | Prazo em 1 dia |
| `PLAN_LIMIT_NEAR` | Limite do plano próximo |
| `CNIS_PROCESSED` | CNIS processado |
| `CNIS_FAILED` | CNIS falhou |

---

### Auditoria

#### AuditLog
Tabela: `audit_logs`

Log de auditoria de ações no sistema.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `userId` | `String` | FK para `User` |
| `action` | `String` | Ação realizada |
| `resource` | `String` | Recurso afetado |
| `ipAddress` | `String?` | Endereço IP |
| `userAgent` | `String?` | User-Agent do navegador |
| `metadata` | `Json?` | Metadados adicionais |
| `createdAt` | `DateTime @default(now())` | Data de criação |

**Relações:** `user -> User` (Cascade on delete)
**Índices:** `@@index([userId])`, `@@index([createdAt])`

---

### Índices de Correção Monetária (INPC)

#### InpcIndex
Tabela: `inpc_indices`

Índices INPC históricos para correção monetária de retroativos.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador único |
| `competence` | `String @unique` | Competência no formato "YYYY-MM" |
| `value` | `Decimal @db.Decimal(10, 6)` | Valor do índice (ex: 0.005700) |
| `createdAt` | `DateTime @default(now())` | Data de criação |
| `updatedAt` | `DateTime @updatedAt` | Data de atualização |

**Índices:** `@@index([competence])`

---

## Seed Inicial

O seed do Prisma (`prisma/seed.ts`) é a **Single Source of Truth** (SST) para todas as configurações estáticas e regras previdenciárias dinâmicas do sistema. Ele popula automaticamente:

### 1. Usuário Admin Padrão
Cria ou atualiza o usuário administrador com base nas variáveis de ambiente `ADMIN_EMAIL` e `ADMIN_PASSWORD`. Senha é hash com bcrypt (rounds 12). Plano PRO, status ACTIVE.

### 2. PlanLimit (Limites SaaS)
Configura os limites dos três planos:

| Campo | FREE | SOLO | PRO |
|---|---|---|---|
| `maxClients` | 3 | 30 | -1 (ilimitado) |
| `maxCalculationsPerMonth` | 5 | -1 | -1 |
| `maxOpinionsPerMonth` | 1 | 20 | -1 |
| `maxNotesPerCase` | 10 | -1 | -1 |
| `simulatorEnabled` | false | true | true |
| `retroactiveEnabled` | false | true | true |
| `exportPdfEnabled` | false | true | true |
| `whatsappEnabled` | false | true | true |
| `watermarkEnabled` | true | false | false |
| `diagnosisEnabled` | false | true | true |
| `bpcEnabled` | false | true | true |
| `bpcAnalysesPerMonth` | 0 | 50 | -1 |
| `bpcSocialMediaPerMonth` | 0 | 5 | -1 |

### 3. MinimumWage (Salários Mínimos Históricos)
Popula 37 registros históricos de salários mínimos e tetos do RGPS, de julho de 1994 (R$ 64,79) até janeiro de 2026 (R$ 1.621,00). Cada registro inclui:
- `effectiveDate`: Data de vigência
- `value`: Valor do salário mínimo
- `ceiling`: Teto do RGPS
- `legislation`: Legislação de referência
- `readjustment`: Percentual de reajuste (null para o primeiro registro de 1994)

### 4. RetirementRule (Regras de Aposentadoria)
Popula regras de elegibilidade para todas as modalidades:
- **Por Pontos (transição):** Progressão anual de 2019 a 2028/2029 (homens 96->105, mulheres 86->96)
- **Idade Mínima Progressiva:** Homens 65/20 anos, Mulheres 62/15 anos
- **Aposentadoria por Idade:** Homens 65/20 anos, Mulheres 62/15 anos
- **Tempo de Contribuição:** Homens 35 anos, Mulheres 30 anos
- **Pedágio 50%:** Homens 35 anos, Mulheres 30 anos
- **Pedágio 100%:** Homens 60/35 anos, Mulheres 57/30 anos
- **Aposentadoria Especial:** 60 anos / 25 anos de contribuição
- **Híbrida (Rural/Urbano):** Homens 65/15 anos, Mulheres 62/15 anos
- **BPC/LOAS:** 65 anos
- **Auxílio-Doença (B31):** Carência de 12 meses
- **Pensão por Morte:** Carência de 18 meses

### 5. ModalityLabel (Modalidades de Cálculo)
14 modalidades padrão com labels em português:

| Código | Label |
|---|---|
| `POINTS_86_96` | Aposentadoria por Pontos (Transição) |
| `TOLL_50` | Transição - Pedágio de 50% |
| `TOLL_100` | Transição - Pedágio de 100% |
| `MINIMUM_AGE_65_62` | Idade Mínima Progressiva |
| `CONTRIBUTION_TIME` | Tempo de Contribuição (Regra Geral) |
| `RETIREMENT_BY_AGE` | Aposentadoria por Idade |
| `SPECIAL_RETIREMENT` | Aposentadoria Especial (25 anos) |
| `HYBRID` | Aposentadoria Híbrida |
| `SICKNESS_BENEFIT_B31` | Auxílio-Doença Previdenciário |
| `SICKNESS_BENEFIT_B91` | Auxílio-Doença Acidentário |
| `MATERNITY_PAY` | Salário-Maternidade |
| `PRISONER_BENEFIT` | Auxílio-Reclusão |
| `DEATH_PENSION` | Pensão por Morte |
| `BPC_LOAS` | BPC/LOAS (Idoso) |

### 6. InpcIndex (Índices INPC)
29 registros históricos de índices INPC mensais de janeiro de 2024 a maio de 2026 para correção monetária de retroativos.

---

## Comandos

```bash
# Desenvolvimento: Rodar migrações e gerar cliente
npx prisma migrate dev --name <nome_da_migracao>
npx prisma generate

# Desenvolvimento: Popular o banco com as regras e parâmetros do seed
npm run db:seed

# Produção: Aplicar migrações pendentes em CI/CD
npx prisma migrate deploy

# Visualizar dados do PostgreSQL localmente
npx prisma studio
```

---

## Variáveis de Ambiente

```env
DATABASE_URL="postgresql://previando:senha@localhost:60003/previando_db"
NEXTAUTH_URL="https://app.previando.com.br"
NEXTAUTH_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
REDIS_URL="redis://localhost:60004"
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="previando-docs"
OPENAI_API_KEY=""
MERCADOPAGO_ACCESS_TOKEN=""
MERCADOPAGO_WEBHOOK_SECRET=""
MP_PLAN_ID_SOLO=""
MP_PLAN_ID_PRO=""
CPF_HASH_SALT=""
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
8. Backup diário via `pg_dump` + cron
