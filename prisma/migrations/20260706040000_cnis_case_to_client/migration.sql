-- Migra o CNIS de "por caso" para "por cliente" — um segurado não pode ter mais
-- de um CNIS; casos do mesmo cliente devem compartilhar o mesmo documento.
--
-- ATENÇÃO (produção): se um cliente tiver mais de um CNIS cadastrado em casos
-- diferentes, este script mantém apenas o mais recentemente atualizado
-- (updatedAt DESC) e DESCARTA os demais registros da tabela. Os arquivos
-- correspondentes no R2 (r2Key) dos registros descartados NÃO são apagados
-- automaticamente por esta migration — faça um levantamento manual antes de
-- rodar em produção se precisar preservar/auditar esses arquivos.

-- 1. Nova coluna (nullable por enquanto)
ALTER TABLE "cnis_documents" ADD COLUMN "clientId" TEXT;

-- 2. Backfill a partir do caso atual
UPDATE "cnis_documents" cd
SET "clientId" = c."clientId"
FROM "cases" c
WHERE cd."caseId" = c."id";

-- 3. Deduplicação: mantém apenas o CNIS mais recente por cliente
DELETE FROM "cnis_documents"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "clientId" ORDER BY "updatedAt" DESC) AS rn
    FROM "cnis_documents"
  ) ranked
  WHERE rn > 1
);

-- 4. Torna a coluna obrigatória e única
ALTER TABLE "cnis_documents" ALTER COLUMN "clientId" SET NOT NULL;
CREATE UNIQUE INDEX "cnis_documents_clientId_key" ON "cnis_documents"("clientId");

-- 5. Nova FK para clients
ALTER TABLE "cnis_documents" ADD CONSTRAINT "cnis_documents_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Remove a FK/índice/coluna antigos baseados em caseId
ALTER TABLE "cnis_documents" DROP CONSTRAINT "cnis_documents_caseId_fkey";
DROP INDEX "cnis_documents_caseId_key";
ALTER TABLE "cnis_documents" DROP COLUMN "caseId";
