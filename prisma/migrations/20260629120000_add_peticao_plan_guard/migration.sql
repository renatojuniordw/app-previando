-- AlterTable: add peticao fields to plan_limits
ALTER TABLE "plan_limits"
  ADD COLUMN "peticaoEnabled"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "maxPeticoesPerMonth" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: add peticoesThisMonth to usage_records
ALTER TABLE "usage_records"
  ADD COLUMN "peticoesThisMonth" INTEGER NOT NULL DEFAULT 0;
