-- AlterTable
ALTER TABLE "plan_limits" ADD COLUMN     "maxRevisionsPerMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "revisionEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "usage_records" ADD COLUMN     "revisionsThisMonth" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "revisions" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "tipoRevisao" TEXT NOT NULL,
    "rmiConcedido" DECIMAL(10,2) NOT NULL,
    "rmiRevisado" DECIMAL(10,2) NOT NULL,
    "diferencaMensal" DECIMAL(10,2) NOT NULL,
    "diferencaPercentual" DOUBLE PRECISION NOT NULL,
    "retroativos5Anos" DECIMAL(12,2) NOT NULL,
    "elegivel" BOOLEAN NOT NULL,
    "pendencias" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "revisions_caseId_idx" ON "revisions"("caseId");

-- AddForeignKey
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
