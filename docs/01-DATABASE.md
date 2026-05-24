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

// ─────────────────────────────────────────
// NEXTAUTH
// ─────────────────────────────────────────

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ─────────────────────────────────────────
// USUÁRIOS (Advogados)
// ─────────────────────────────────────────

model User {
  id            String     @id @default(cuid())
  name          String?
  email         String?    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  oabNumber     String?
  phone         String?
  plan          Plan       @default(FREE)
  planStatus    PlanStatus @default(ACTIVE)

  mpCustomerId         String? @unique
  mpSubscriptionId     String? @unique
  mpSubscriptionStatus String?
  planExpiresAt        DateTime?

  isAdmin   Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  accounts    Account[]
  sessions    Session[]
  clients     Client[]
  cases       Case[]
  caseNotes   CaseNote[]
  usageRecord UsageRecord?
  payments    Payment[]
  auditLogs   AuditLog[]

  @@map("users")
}

enum Plan {
  FREE
  SOLO
  PRO
}

enum PlanStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
  SUSPENDED
}

// ─────────────────────────────────────────
// LIMITES POR PLANO
// ─────────────────────────────────────────

model PlanLimit {
  id   String @id @default(cuid())
  plan Plan   @unique

  maxClients              Int
  maxCalculationsPerMonth Int      // -1 = ilimitado
  maxOpinionsPerMonth     Int      // -1 = ilimitado
  maxNotesPerCase         Int      // -1 = ilimitado | FREE = 10

  simulatorEnabled    Boolean @default(false)
  retroativosEnabled  Boolean @default(false)
  exportPdfEnabled    Boolean @default(false)
  whatsappEnabled     Boolean @default(false)
  watermarkEnabled    Boolean @default(true)
  diagnosisEnabled    Boolean @default(false)

  updatedAt DateTime @updatedAt

  @@map("plan_limits")
}

// ─────────────────────────────────────────
// USO ATUAL
// ─────────────────────────────────────────

model UsageRecord {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  totalClients          Int      @default(0)
  calculationsThisMonth Int      @default(0)
  opinionsThisMonth     Int      @default(0)
  usageMonthRef         DateTime @default(now())

  updatedAt DateTime @updatedAt

  @@map("usage_records")
}

// ─────────────────────────────────────────
// CLIENTES (Segurados)
// ─────────────────────────────────────────

model Client {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name      String
  cpfHash   String   // HMAC-SHA256 — nunca plain text
  birthDate DateTime
  phone     String?  // Formato: 5511999999999 (DDI sem +)
  email     String?
  priority  Priority @default(NORMAL)
  notes     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cases Case[]

  @@index([userId])
  @@map("clients")
}

enum Priority {
  CRITICAL
  ATTENTION
  NORMAL
}

// ─────────────────────────────────────────
// CASOS
// ─────────────────────────────────────────

model Case {
  id       String @id @default(cuid())
  userId   String
  clientId String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  client   Client @relation(fields: [clientId], references: [id], onDelete: Cascade)

  status       CaseStatus  @default(PROSPECCAO)
  priority     Priority    @default(NORMAL)
  benefitType  BenefitType
  deadlineDays Int?
  deadlineDate DateTime?
  notes        String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cnisDocument CnisDocument?
  calculations Calculation[]
  retroativos  Retroativo[]
  opinions     Opinion[]
  checklists   Checklist[]
  simulations  Simulation[]
  caseNotes    CaseNote[]

  @@index([userId])
  @@index([clientId])
  @@index([userId, status])
  @@index([priority, deadlineDate])
  @@map("cases")
}

enum CaseStatus {
  PROSPECCAO
  ANALISE
  PRONTO_PARA_REQUERER
  EM_PROCESSAMENTO
  FINALIZADO
}

enum BenefitType {
  APOSENTADORIA_IDADE
  APOSENTADORIA_TEMPO_CONTRIBUICAO
  APOSENTADORIA_ESPECIAL
  APOSENTADORIA_HIBRIDA
  APOSENTADORIA_PONTOS
  AUXILIO_DOENCA
  AUXILIO_ACIDENTE
  SALARIO_MATERNIDADE
  AUXILIO_RECLUSAO
  PENSAO_POR_MORTE
  BPC_LOAS
  REVISAO_BENEFICIO
}

// ─────────────────────────────────────────
// PRONTUÁRIO (CaseNote)
// Histórico versionado e imutável do caso
// ─────────────────────────────────────────

model CaseNote {
  id      String @id @default(cuid())
  caseId  String
  userId  String
  case    Case   @relation(fields: [caseId], references: [id], onDelete: Cascade)
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  type    NoteType
  content String   @db.Text // Máx 5000 chars (validado no backend)
  version Int      // Sequencial por caso: 1, 2, 3...

  // Imutável — sem updatedAt intencional
  createdAt DateTime @default(now())

  @@index([caseId])
  @@index([caseId, type])
  @@index([caseId, createdAt])
  @@map("case_notes")
}

enum NoteType {
  CONTATO    // 🗣 Ligação, reunião, WhatsApp
  DOCUMENTO  // 📄 Recebimento/envio de docs
  JURIDICO   // ⚖️ Decisões, despachos, prazos
  INTERNO    // 📝 Observação interna
  CALCULO    // 🧮 Estratégia de cálculo
  PENDENCIA  // ⚠️ Pendência em aberto
}

// ─────────────────────────────────────────
// CNIS
// ─────────────────────────────────────────

model CnisDocument {
  id     String @id @default(cuid())
  caseId String @unique
  case   Case   @relation(fields: [caseId], references: [id], onDelete: Cascade)

  r2Key         String
  fileName      String
  fileSizeBytes Int

  markdownContent  String           @db.Text
  extractedData    Json
  processingStatus ProcessingStatus @default(PENDING)
  processingError  String?

  nit                  String?
  totalContribuicoes   Int?
  primeiraContribuicao DateTime?
  ultimaContribuicao   DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("cnis_documents")
}

enum ProcessingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

// ─────────────────────────────────────────
// CÁLCULOS
// ─────────────────────────────────────────

model Calculation {
  id     String @id @default(cuid())
  caseId String
  case   Case   @relation(fields: [caseId], references: [id], onDelete: Cascade)

  modalidade          CalculationModalidade
  isSelected          Boolean  @default(false)
  inputParams         Json

  salarioBeneficio    Decimal  @db.Decimal(12, 2)
  rmi                 Decimal  @db.Decimal(12, 2)
  rma                 Decimal  @db.Decimal(12, 2)
  fatorPrevidenciario Decimal? @db.Decimal(6, 4)
  coeficiente         Decimal? @db.Decimal(6, 4)

  dibPrevista       DateTime?
  carenciaAtendida  Boolean   @default(false)
  tempoContribuicao Int?
  idadeNaApuracao   Int?
  elegivel          Boolean   @default(false)
  pendencias        String[]

  memoriaCalculo   Json
  periodosSalarios Json

  createdAt DateTime @default(now())

  @@index([caseId])
  @@map("calculations")
}

enum CalculationModalidade {
  PONTOS_86_96
  PEDAGIO_50
  PEDAGIO_100
  IDADE_MINIMA_65_62
  TEMPO_CONTRIBUICAO
  APOSENTADORIA_IDADE
  APOSENTADORIA_ESPECIAL
  HIBRIDA
  AUXILIO_DOENCA_B31
  AUXILIO_DOENCA_B91
  SALARIO_MATERNIDADE
  AUXILIO_RECLUSAO
  PENSAO_MORTE
  BPC_LOAS
}

// ─────────────────────────────────────────
// RETROATIVOS
// ─────────────────────────────────────────

model Retroativo {
  id     String @id @default(cuid())
  caseId String
  case   Case   @relation(fields: [caseId], references: [id], onDelete: Cascade)

  dataInicioDireito   DateTime
  dataRequerimento    DateTime
  mesesAtraso         Int

  valorMensalBruto    Decimal @db.Decimal(12, 2)
  valorTotalBruto     Decimal @db.Decimal(12, 2)
  valorTotalCorrigido Decimal @db.Decimal(12, 2)
  indiceCorrecao      String
  valorDescontos      Decimal @db.Decimal(12, 2) @default(0)
  descricaoDescontos  String?
  valorLiquidoFinal   Decimal @db.Decimal(12, 2)

  memoriaCalculo Json

  createdAt DateTime @default(now())

  @@index([caseId])
  @@map("retroativos")
}

// ─────────────────────────────────────────
// CHECKLIST
// ─────────────────────────────────────────

model Checklist {
  id     String @id @default(cuid())
  caseId String
  case   Case   @relation(fields: [caseId], references: [id], onDelete: Cascade)

  benefitType BenefitType
  items       Json
  eligible    Boolean
  pendencias  String[]

  createdAt DateTime @default(now())

  @@index([caseId])
  @@map("checklists")
}

// ─────────────────────────────────────────
// PARECERES
// ─────────────────────────────────────────

model Opinion {
  id     String @id @default(cuid())
  caseId String
  case   Case   @relation(fields: [caseId], references: [id], onDelete: Cascade)

  promptUsed        String        @db.Text
  generatedContent  String        @db.Text
  customizedContent String?       @db.Text
  model             String
  tokensUsed        Int
  generationCostUsd Decimal       @db.Decimal(8, 6)
  status            OpinionStatus @default(GENERATED)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([caseId])
  @@map("opinions")
}

enum OpinionStatus {
  GENERATED
  REVIEWED
  FINALIZED
}

// ─────────────────────────────────────────
// SIMULAÇÕES
// ─────────────────────────────────────────

model Simulation {
  id     String @id @default(cuid())
  caseId String
  case   Case   @relation(fields: [caseId], references: [id], onDelete: Cascade)

  scenarioName   String
  scenarioParams Json
  rmiProjected   Decimal  @db.Decimal(12, 2)
  rmaProjected   Decimal  @db.Decimal(12, 2)
  dibProjected   DateTime
  gainVsNow      Decimal  @db.Decimal(12, 2)

  createdAt DateTime @default(now())

  @@index([caseId])
  @@map("simulations")
}

// ─────────────────────────────────────────
// PAGAMENTOS
// ─────────────────────────────────────────

model Payment {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  mpPaymentId      String        @unique
  mpSubscriptionId String?
  plan             Plan
  amount           Decimal       @db.Decimal(10, 2)
  currency         String        @default("BRL")
  status           PaymentStatus
  paidAt           DateTime?
  periodStart      DateTime?
  periodEnd        DateTime?

  createdAt DateTime @default(now())

  @@index([userId])
  @@map("payments")
}

enum PaymentStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  REFUNDED
}

// ─────────────────────────────────────────
// AUDITORIA
// ─────────────────────────────────────────

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action    String
  resource  String
  ipAddress String?
  userAgent String?
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## Seed Inicial

```typescript
// prisma/seed.ts
await prisma.planLimit.createMany({
  data: [
    {
      plan: 'FREE',
      maxClients: 3,
      maxCalculationsPerMonth: 5,
      maxOpinionsPerMonth: 1,
      maxNotesPerCase: 10,
      simulatorEnabled:   false,
      retroativosEnabled: false,
      exportPdfEnabled:   false,
      whatsappEnabled:    false,
      watermarkEnabled:   true,
      diagnosisEnabled:   false,
    },
    {
      plan: 'SOLO',
      maxClients: 30,
      maxCalculationsPerMonth: -1,
      maxOpinionsPerMonth: 20,
      maxNotesPerCase: -1,
      simulatorEnabled:   true,
      retroativosEnabled: true,
      exportPdfEnabled:   true,
      whatsappEnabled:    true,
      watermarkEnabled:   false,
      diagnosisEnabled:   true,
    },
    {
      plan: 'PRO',
      maxClients: -1,
      maxCalculationsPerMonth: -1,
      maxOpinionsPerMonth: -1,
      maxNotesPerCase: -1,
      simulatorEnabled:   true,
      retroativosEnabled: true,
      exportPdfEnabled:   true,
      whatsappEnabled:    true,
      watermarkEnabled:   false,
      diagnosisEnabled:   true,
    },
  ],
})
```

---

## Comandos

```bash
npx prisma migrate dev --name init   # Dev
npx prisma migrate deploy            # Produção
npx prisma generate                  # Client TypeScript
npx prisma db seed                   # Popula PlanLimit
npx prisma studio                    # GUI
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
ADMIN_SECRET=""
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
10. Backup diário via `pg_dump` + cron
