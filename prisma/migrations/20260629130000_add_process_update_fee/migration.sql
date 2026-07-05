-- AlterEnum: add PROCESS_UPDATE to NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'PROCESS_UPDATE';

-- CreateEnum: FeeStatus
CREATE TYPE "FeeStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable: fees
CREATE TABLE "fees" (
    "id"          TEXT NOT NULL,
    "caseId"      TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount"  DECIMAL(12,2) NOT NULL DEFAULT 0,
    "dueDate"     TIMESTAMP(3),
    "status"      "FeeStatus" NOT NULL DEFAULT 'PENDING',
    "notes"       TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fees_caseId_idx" ON "fees"("caseId");

-- AddForeignKey
ALTER TABLE "fees" ADD CONSTRAINT "fees_caseId_fkey"
    FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
