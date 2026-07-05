-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN "previousHash" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "hash" TEXT;

-- CreateTable
CREATE TABLE "audit_chain_state" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastHash" TEXT NOT NULL DEFAULT 'genesis',

    CONSTRAINT "audit_chain_state_pkey" PRIMARY KEY ("id")
);

-- Seed da linha única que ancora a cadeia — sem isso, o primeiro SELECT ...
-- FOR UPDATE não teria nada para travar e concorrência no primeiro registro
-- poderia bifurcar a cadeia.
INSERT INTO "audit_chain_state" ("id", "lastHash") VALUES (1, 'genesis');
