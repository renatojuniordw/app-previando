-- CreateTable
CREATE TABLE "cause_value_calculations" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "administrativeRequestDate" TIMESTAMP(3) NOT NULL,
    "lawsuitFilingDate" TIMESTAMP(3) NOT NULL,
    "entitlementStartDate" TIMESTAMP(3) NOT NULL,
    "monthlyGrossValue" DECIMAL(12,2) NOT NULL,
    "monthsLate" INTEGER NOT NULL,
    "totalCorrectedValue" DECIMAL(12,2) NOT NULL,
    "correctionIndex" TEXT NOT NULL,
    "futureInstallmentsCount" INTEGER NOT NULL DEFAULT 12,
    "futureInstallmentsValue" DECIMAL(12,2) NOT NULL,
    "futureInstallmentsTotal" DECIMAL(12,2) NOT NULL,
    "totalCauseValue" DECIMAL(12,2) NOT NULL,
    "calculationMemory" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cause_value_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cause_value_calculations_caseId_idx" ON "cause_value_calculations"("caseId");

-- AddForeignKey
ALTER TABLE "cause_value_calculations" ADD CONSTRAINT "cause_value_calculations_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
