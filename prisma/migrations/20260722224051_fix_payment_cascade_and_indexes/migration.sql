-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_userId_fkey";

-- AlterTable
ALTER TABLE "cases" ALTER COLUMN "portalConfig" SET DEFAULT '{"showCalculations":true,"showRetroactives":false,"showBpcSocialAnalysis":false,"showTimeline":false,"showDocuments":false,"showFaq":false,"showGlossary":false,"showPdfExport":false,"requireIdentity":false}';

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "shared" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "clients_cpfHash_idx" ON "clients"("cpfHash");

-- CreateIndex
CREATE INDEX "cnis_documents_processingStatus_idx" ON "cnis_documents"("processingStatus");

-- CreateIndex
CREATE INDEX "webhook_events_createdAt_idx" ON "webhook_events"("createdAt");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
