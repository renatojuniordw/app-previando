-- CreateEnum: FeeType
CREATE TYPE "FeeType" AS ENUM ('FIXED', 'CONTINGENCY', 'PERCENTAGE', 'OTHER');

-- AlterEnum: add fee due-date notification types
ALTER TYPE "NotificationType" ADD VALUE 'FEE_DUE_SOON';
ALTER TYPE "NotificationType" ADD VALUE 'FEE_OVERDUE';

-- AlterTable: fees
ALTER TABLE "fees" ADD COLUMN "type" "FeeType" NOT NULL DEFAULT 'FIXED';

-- CreateTable: fee_payments
CREATE TABLE "fee_payments" (
    "id"        TEXT NOT NULL,
    "feeId"     TEXT NOT NULL,
    "amount"    DECIMAL(12,2) NOT NULL,
    "paidAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fee_payments_feeId_idx" ON "fee_payments"("feeId");

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_feeId_fkey"
    FOREIGN KEY ("feeId") REFERENCES "fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: converte o paidAmount já existente em um pagamento inicial no histórico
INSERT INTO "fee_payments" ("id", "feeId", "amount", "paidAt", "createdAt")
SELECT gen_random_uuid()::text, "id", "paidAmount", "createdAt", "createdAt"
FROM "fees"
WHERE "paidAmount" > 0;
