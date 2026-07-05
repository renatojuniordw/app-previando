-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SIGNATURE_COMPLETED';

-- AlterTable
ALTER TABLE "plan_limits" ADD COLUMN     "assinaturaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viabilityScoreEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "assinaturas" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "processoKey" TEXT NOT NULL,
    "signUrl" TEXT,
    "status" TEXT NOT NULL,
    "documentUrl" TEXT,
    "signers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assinaturas_caseId_idx" ON "assinaturas"("caseId");

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
