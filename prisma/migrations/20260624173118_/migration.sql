-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'SOLO', 'PRO');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('CRITICAL', 'ATTENTION', 'NORMAL');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('PROSPECTING', 'ANALYSIS', 'READY_TO_REQUEST', 'PROCESSING', 'FINISHED');

-- CreateEnum
CREATE TYPE "BenefitType" AS ENUM ('RETIREMENT_BY_AGE', 'RETIREMENT_BY_CONTRIBUTION_TIME', 'SPECIAL_RETIREMENT', 'HYBRID_RETIREMENT', 'POINTS_RETIREMENT', 'SICKNESS_BENEFIT', 'ACCIDENT_BENEFIT', 'MATERNITY_PAY', 'PRISONER_BENEFIT', 'DEATH_PENSION', 'BPC_LOAS', 'BENEFIT_REVIEW');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('CONTACT', 'DOCUMENT', 'LEGAL', 'INTERNAL', 'CALCULATION', 'PENDING_ISSUE');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CalculationModality" AS ENUM ('POINTS_86_96', 'TOLL_50', 'TOLL_100', 'MINIMUM_AGE_65_62', 'CONTRIBUTION_TIME', 'RETIREMENT_BY_AGE', 'SPECIAL_RETIREMENT', 'HYBRID', 'SICKNESS_BENEFIT_B31', 'SICKNESS_BENEFIT_B91', 'MATERNITY_PAY', 'PRISONER_BENEFIT', 'DEATH_PENSION', 'BPC_LOAS');

-- CreateEnum
CREATE TYPE "OpinionStatus" AS ENUM ('GENERATED', 'REVIEWED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BpcFaixaEtaria" AS ENUM ('MENOR_16', 'MAIOR_16');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "oabNumber" TEXT,
    "phone" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "planStatus" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "mpCustomerId" TEXT,
    "mpSubscriptionId" TEXT,
    "mpSubscriptionStatus" TEXT,
    "planExpiresAt" TIMESTAMP(3),
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_limits" (
    "id" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "maxClients" INTEGER NOT NULL,
    "maxCalculationsPerMonth" INTEGER NOT NULL,
    "maxOpinionsPerMonth" INTEGER NOT NULL,
    "maxNotesPerCase" INTEGER NOT NULL,
    "simulatorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "retroactiveEnabled" BOOLEAN NOT NULL DEFAULT false,
    "exportPdfEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "watermarkEnabled" BOOLEAN NOT NULL DEFAULT true,
    "diagnosisEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bpcEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bpcAnalysesPerMonth" INTEGER NOT NULL DEFAULT 0,
    "bpcSocialMediaPerMonth" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalClients" INTEGER NOT NULL DEFAULT 0,
    "calculationsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "opinionsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "bpcAnalysesThisMonth" INTEGER NOT NULL DEFAULT 0,
    "bpcSocialMediaThisMonth" INTEGER NOT NULL DEFAULT 0,
    "usageMonthRef" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpfHash" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'PROSPECTING',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "benefitType" "BenefitType" NOT NULL,
    "processNumber" TEXT,
    "processLastCheck" TIMESTAMP(3),
    "processLastMovDate" TIMESTAMP(3),
    "processLastMovCount" INTEGER,
    "processLastSummary" TEXT,
    "deadlineDays" INTEGER,
    "deadlineDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_notes" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NoteType" NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cnis_documents" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "markdownContent" TEXT NOT NULL,
    "extractedData" JSONB NOT NULL,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processingError" TEXT,
    "nit" TEXT,
    "totalContributions" INTEGER,
    "firstContribution" TIMESTAMP(3),
    "lastContribution" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cnis_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculations" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "modality" "CalculationModality" NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "inputParams" JSONB NOT NULL,
    "benefitSalary" DECIMAL(12,2) NOT NULL,
    "rmi" DECIMAL(12,2) NOT NULL,
    "rma" DECIMAL(12,2) NOT NULL,
    "socialSecurityFactor" DECIMAL(6,4),
    "coefficient" DECIMAL(6,4),
    "expectedDib" TIMESTAMP(3),
    "gracePeriodMet" BOOLEAN NOT NULL DEFAULT false,
    "contributionTime" INTEGER,
    "ageAtCalculation" INTEGER,
    "eligible" BOOLEAN NOT NULL DEFAULT false,
    "pendingIssues" TEXT[],
    "calculationMemory" JSONB NOT NULL,
    "salaryPeriods" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retroactives" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "entitlementStartDate" TIMESTAMP(3) NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL,
    "monthsLate" INTEGER NOT NULL,
    "monthlyGrossValue" DECIMAL(12,2) NOT NULL,
    "totalGrossValue" DECIMAL(12,2) NOT NULL,
    "totalCorrectedValue" DECIMAL(12,2) NOT NULL,
    "correctionIndex" TEXT NOT NULL,
    "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountDescription" TEXT,
    "finalNetValue" DECIMAL(12,2) NOT NULL,
    "calculationMemory" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retroactives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "benefitType" "BenefitType" NOT NULL,
    "items" JSONB NOT NULL,
    "eligible" BOOLEAN NOT NULL,
    "pendingIssues" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opinions" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "promptUsed" TEXT NOT NULL,
    "generatedContent" TEXT NOT NULL,
    "customizedContent" TEXT,
    "model" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "generationCostUsd" DECIMAL(8,6) NOT NULL,
    "status" "OpinionStatus" NOT NULL DEFAULT 'GENERATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opinions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "scenarioName" TEXT NOT NULL,
    "scenarioParams" JSONB NOT NULL,
    "rmiProjected" DECIMAL(12,2) NOT NULL,
    "rmaProjected" DECIMAL(12,2) NOT NULL,
    "dibProjected" TIMESTAMP(3) NOT NULL,
    "gainVsNow" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mpPaymentId" TEXT NOT NULL,
    "mpSubscriptionId" TEXT,
    "plan" "Plan" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "PaymentStatus" NOT NULL,
    "paidAt" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minimum_wages" (
    "id" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "ceiling" DECIMAL(10,2) NOT NULL,
    "legislation" TEXT NOT NULL,
    "readjustment" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "minimum_wages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retirement_rules" (
    "id" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "minimumAge" DECIMAL(5,1),
    "contributionYears" INTEGER,
    "minimumPoints" INTEGER,
    "gracePeriodMonths" INTEGER,
    "description" TEXT NOT NULL,
    "legislation" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retirement_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modality_labels" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modality_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bpc_analyses" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "patologia" TEXT NOT NULL,
    "cid" TEXT,
    "idade" INTEGER NOT NULL,
    "faixaEtaria" "BpcFaixaEtaria" NOT NULL,
    "rendaFamiliar" DOUBLE PRECISION NOT NULL,
    "membrosGrupo" INTEGER NOT NULL,
    "rendaPerCapita" DOUBLE PRECISION NOT NULL,
    "barreiras" TEXT,
    "resumoLaudos" TEXT,
    "preAnalise" TEXT,
    "analiseLaudo" TEXT,
    "perguntasSocial" TEXT,
    "perguntasMedicas" TEXT,
    "checklist" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bpc_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inpc_indices" (
    "id" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "value" DECIMAL(10,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inpc_indices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_mpCustomerId_key" ON "users"("mpCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_mpSubscriptionId_key" ON "users"("mpSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_limits_plan_key" ON "plan_limits"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_userId_key" ON "usage_records"("userId");

-- CreateIndex
CREATE INDEX "clients_userId_idx" ON "clients"("userId");

-- CreateIndex
CREATE INDEX "cases_userId_idx" ON "cases"("userId");

-- CreateIndex
CREATE INDEX "cases_clientId_idx" ON "cases"("clientId");

-- CreateIndex
CREATE INDEX "cases_userId_status_idx" ON "cases"("userId", "status");

-- CreateIndex
CREATE INDEX "cases_priority_deadlineDate_idx" ON "cases"("priority", "deadlineDate");

-- CreateIndex
CREATE INDEX "cases_processNumber_idx" ON "cases"("processNumber");

-- CreateIndex
CREATE INDEX "case_notes_caseId_idx" ON "case_notes"("caseId");

-- CreateIndex
CREATE INDEX "case_notes_caseId_type_idx" ON "case_notes"("caseId", "type");

-- CreateIndex
CREATE INDEX "case_notes_caseId_createdAt_idx" ON "case_notes"("caseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cnis_documents_caseId_key" ON "cnis_documents"("caseId");

-- CreateIndex
CREATE INDEX "calculations_caseId_idx" ON "calculations"("caseId");

-- CreateIndex
CREATE INDEX "retroactives_caseId_idx" ON "retroactives"("caseId");

-- CreateIndex
CREATE INDEX "checklists_caseId_idx" ON "checklists"("caseId");

-- CreateIndex
CREATE INDEX "opinions_caseId_idx" ON "opinions"("caseId");

-- CreateIndex
CREATE INDEX "simulations_caseId_idx" ON "simulations"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_mpPaymentId_key" ON "payments"("mpPaymentId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "minimum_wages_effectiveDate_key" ON "minimum_wages"("effectiveDate");

-- CreateIndex
CREATE INDEX "minimum_wages_effectiveDate_idx" ON "minimum_wages"("effectiveDate");

-- CreateIndex
CREATE INDEX "retirement_rules_modality_gender_effectiveDate_idx" ON "retirement_rules"("modality", "gender", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "retirement_rules_modality_gender_effectiveDate_key" ON "retirement_rules"("modality", "gender", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "modality_labels_code_key" ON "modality_labels"("code");

-- CreateIndex
CREATE INDEX "modality_labels_active_order_idx" ON "modality_labels"("active", "order");

-- CreateIndex
CREATE UNIQUE INDEX "bpc_analyses_caseId_key" ON "bpc_analyses"("caseId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "inpc_indices_competence_key" ON "inpc_indices"("competence");

-- CreateIndex
CREATE INDEX "inpc_indices_competence_idx" ON "inpc_indices"("competence");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cnis_documents" ADD CONSTRAINT "cnis_documents_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculations" ADD CONSTRAINT "calculations_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retroactives" ADD CONSTRAINT "retroactives_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opinions" ADD CONSTRAINT "opinions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bpc_analyses" ADD CONSTRAINT "bpc_analyses_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
